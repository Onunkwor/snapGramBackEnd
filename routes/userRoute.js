import express from "express";
import { User } from "../models/userModel.js";
import { Webhook } from "svix";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import clerkClient from "@clerk/clerk-sdk-node";
import { Post } from "../models/postModel.js";
import { requireAuth } from "../MiddleWare/middleware.js";
dotenv.config();
const usersRouter = express.Router();

//Get all Users from Database
usersRouter.get("/", async (req, res) => {
  try {
    const { cursor } = req.query;
    const users = await User.find({}).limit(6).skip(cursor);
    return res.status(200).send(users);
  } catch (error) {
    console.log("Error getting users", error);
    return res.status(500).send({ message: error.message });
  }
});

//Get a User from Database
usersRouter.get("/clerk/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.find({ clerkId: id });
    return res.status(200).send(user);
  } catch (error) {
    console.log("Error getting users", error);
    return res.status(500).send({ message: error.message });
  }
});
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
usersRouter.put("/:id", requireAuth, async (req, res) => {
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

      // Check if a user with the same email already exists
      const userAlreadyExist = await User.findOne({
        email: email_addresses[0].email_address,
      });

      if (userAlreadyExist) {
        // Send a response indicating that the user already exists
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Create a new user
      const user = {
        clerkId: id,
        email: email_addresses[0].email_address,
        username: username || first_name,
        firstName: first_name,
        lastName: last_name || first_name,
        photo: image_url,
        saved: [],
        followers: [],
        following: [],
      };

      try {
        const newUser = await User.create(user);
        await clerkClient.users.updateUserMetadata(id, {
          publicMetadata: {
            userId: newUser._id,
          },
        });
        return res
          .status(200)
          .json({ success: true, message: "User created successfully" });
      } catch (error) {
        // Handle any errors that occur during user creation
        console.error("Error creating user:", error);
        return res
          .status(500)
          .json({ success: false, message: "Error creating user" });
      }
    }

    if (eventType === "user.updated") {
      const { id, image_url, first_name, last_name, username } = evt.data;

      const user = {
        firstName: first_name,
        lastName: last_name || first_name,
        username: username || first_name,
        photo: image_url,
      };

      const updatedUser = await User.findOneAndUpdate({ clerkId: id }, user, {
        new: true,
      });
      return res.status(200).json({ message: "OK", user: updatedUser });
    }
    if (eventType === "user.deleted") {
      const { id } = evt.data;

      // Find the user by clerkId
      const userToDelete = await User.findOne({ clerkId: id });

      // Check if userToDelete exists
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete the user
      const deleteUser = await User.findOneAndDelete({ clerkId: id });

      // Delete any associated posts
      const deleteUserPost = await Post.deleteMany({
        creator: userToDelete._id,
      });

      return res
        .status(200)
        .json({ message: "User and associated posts deleted successfully" });
    }
  }
);

usersRouter.patch("/follow", async (req, res) => {
  try {
    const { followingRecord, followersRecord } = req.body;

    // Fetch the current user and the user to follow
    const currentUser = await User.findById(followersRecord);
    const userToFollow = await User.findById(followingRecord);

    // Update the following list of the current user
    await User.findByIdAndUpdate(currentUser._id, {
      following: [...currentUser.following, userToFollow._id],
    });

    // Update the followers list of the user to follow
    await User.findByIdAndUpdate(userToFollow._id, {
      followers: [...userToFollow.followers, currentUser._id],
    });

    // Send a success response to the client
    return res.status(200).send({ message: "Successfully followed user." });
  } catch (error) {
    console.log("Error following user:", error);
    return res.status(500).send({ message: "Internal server error." });
  }
});
usersRouter.patch("/unFollow", async (req, res) => {
  try {
    const { currentUser, user, followingRecordList, followerRecordList } =
      req.body;

    // Fetch the current user and the user to follow
    const logInUser = await User.findById(currentUser);
    const userToUnFollow = await User.findById(user);

    // Update the following list of the current user
    await User.findByIdAndUpdate(logInUser._id, {
      following: followingRecordList,
    });

    // Update the followers list of the user to follow
    await User.findByIdAndUpdate(userToUnFollow._id, {
      followers: followerRecordList,
    });

    // Send a success response to the client
    return res.status(200).send({ message: "Successfully UnFollowed user." });
  } catch (error) {
    console.log("Error unFollowing user:", error);
    return res.status(500).send({ message: "Internal server error." });
  }
});

export default usersRouter;
