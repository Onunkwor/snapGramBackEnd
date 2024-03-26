import express from "express";
import { Saved } from "../models/savedModel.js";
import { Post } from "../models/postModel.js";
import mongoose from "mongoose";
import { User } from "../models/userModel.js";
const savedRouter = express.Router();

savedRouter.post("/", async (req, res) => {
  try {
    if (!req.body.postId || !req.body.user || !req.body.createdAt) {
      return res.status(400).send({
        message: "Send all required fields: user, postId, createdAt",
      });
    }
    const { postId, user } = req.body;
    const savePost = {
      postId: req.body.postId,
      user: req.body.user,
      createdAt: req.body.createdAt,
    };
    const save = await Saved.create(savePost);
    const saveToPost = await Post.findByIdAndUpdate(
      postId,
      { saved: [save._id] },
      { new: true }
    );
    const saveToUser = await User.findByIdAndUpdate(
      user,
      { save: [save._id] },
      { new: true }
    );
    return res.status(201).send(save);
  } catch (error) {
    console.log("Error adding saves to mongo db", error);
    res.status(500).send({ message: error.message });
  }
});

savedRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fetchData = await Saved.find({ userId: id });
    const savedPosts = fetchData.populate({
      path: "postId",
      model: Post,
    });
    return res.status(200).send(savedPosts);
  } catch (error) {
    console.log("Error fetching savedPost from mongo db", error);
    res.status(500).send({ message: error.message });
  }
});
savedRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const saveObjectId = mongoose.Types.ObjectId(id);
    const fetchData = await Saved.findByIdAndDelete({ _id: saveObjectId });
    return res.status(201);
  } catch (error) {
    console.log("Error deleting savedPost from mongo db", error);
    res.status(500).send({ message: error.message });
  }
});

export default savedRouter;
