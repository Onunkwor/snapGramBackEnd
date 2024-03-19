import express from "express";
import { User } from "../models/userModel.js";
const usersRouter = express.Router();
//Save User To Database
usersRouter.post("/", async (req, res) => {
  try {
    if (!req.body.username || !req.body.email || !req.body.name) {
      return res.status(400).send({
        message: "Send all required fields: name, username, email",
      });
    }
    const newUser = {
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
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

export default usersRouter;
