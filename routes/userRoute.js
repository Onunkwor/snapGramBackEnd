import express from "express";
import { User } from "../models/userModel.js";
import { Webhook } from "svix";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { clerkClient } from "@clerk/clerk-sdk-node";
dotenv.config();
const usersRouter = express.Router();
//Save User To Database
usersRouter.post("/", async (req, res) => {
  try {
    if (!req.body.firstName || !req.body.username || !req.body.photo) {
      return res.status(400).send({
        message: "Send all required fields: name, username, email",
      });
    }
    const newUser = {
      clerkId: req.body.clerkId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username,
      email: req.body.email,
      photo: req.body.photo,
    };
    const user = await User.create(newUser);
    return res.status(201).send(user);
  } catch (error) {
    console.log("Error adding user to mongo db", error);
    res.status(500).send({ message: error.message });
  }
});

//Get all Users from Database
usersRouter.get("/", async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).send(users);
  } catch (error) {
    console.log("Error getting users", error);
    return res.status(500).send({ message: error.message });
  }
});

//Get a User from Database
usersRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    return res.status(200).send(user);
  } catch (error) {
    console.log("Error getting users", error);
    return res.status(500).send({ message: error.message });
  }
});

//Update User
usersRouter.put("/:id", async (req, res) => {
  try {
    if (!req.body.username || !req.body.email || !req.body.name) {
      return res.status(400).send({
        message: "Send all required fields: name, username, email",
      });
    }
    const { id } = req.params;
    const result = await User.findByIdAndUpdate(id, req.body);
    if (!result) {
      return res.status(400).send({
        message: "User not found",
      });
    }
    return res.status(200).send({ message: "User Updated" });
  } catch (error) {
    console.log("Error getting users", error);
    return res.status(500).send({ message: error.message });
  }
});

//Delete User
usersRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send({
        message: "Pass a valid Id",
      });
    }
    const result = await User.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).send({
        message: "User not found",
      });
    }
    return res.status(200).send({ message: "User Deleted" });
  } catch (error) {
    console.log("Error getting users", error);
    return res.status(500).send({ message: error.message });
  }
});

//Clerk webhook
//I encountered an issue with the clerk webhook but what helped was to use JSON.stringify on the req.body and to add my current ip address to mongodb
usersRouter.post(
  "/api/webhooks/user",
  bodyParser.raw({ type: "application/json" }),
  async function (req, res) {
    // Check if the 'Signing Secret' from the Clerk Dashboard was correctly provided
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      throw new Error("You need a WEBHOOK_SECRET in your .env");
    }
    console.log(WEBHOOK_SECRET);
    // Grab the headers and body
    const headers = req.headers;
    const payload = JSON.stringify(req.body);

    // Get the Svix headers for verification
    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];

    // If there are missing Svix headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error occured -- no svix headers", {
        status: 400,
      });
    }

    // Initiate Svix
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    // Attempt to verify the incoming webhook
    // If successful, the payload will be available from 'evt'
    // If the verification fails, error out and  return error code
    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      // Console log and return error
      console.log("Webhook failed to verify. Error:", err.message);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // Grab the ID and TYPE of the Webhook
    const { id } = evt.data;
    const eventType = evt.type;

    if (eventType === "user.created") {
      const {
        id,
        email_addresses,
        image_url,
        first_name,
        last_name,
        username,
      } = evt.data;

      const user = {
        clerkId: id,
        email: email_addresses[0].email_address,
        username: username,
        firstName: first_name,
        lastName: last_name,
        photo: image_url,
      };

      const newUser = await User.create(user);

      if (newUser) {
        await clerkClient.users.updateUserMetadata(id, {
          publicMetadata: {
            userId: newUser._id,
          },
        });
      }

      return res.json({ message: "OK", user: newUser });
    }
  }
);

export default usersRouter;
