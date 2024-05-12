import express from "express";
import { Comment } from "../models/commentModel.js";
import { User } from "../models/userModel.js";
import { Post } from "../models/postModel.js";
import { requireAuth } from "../MiddleWare/middleware.js";
const commentsRouter = express.Router();

commentsRouter.post("/", requireAuth, async (req, res) => {
  try {
    if (
      !req.body.user ||
      !req.body.comment ||
      !req.body.postId ||
      !req.body.createdAt
    ) {
      return res.status(400).send({
        message: "Send all required fields: userId, comment, postId, createdAt",
      });
    }
    const { postId } = req.body;
    const newComment = {
      user: req.body.user,
      postId: req.body.postId,
      comment: req.body.comment,
      likes: req.body.likes,
      createdAt: req.body.createdAt,
    };
    const comment = await Comment.create(newComment);
    const findPost = await Post.findById(postId);
    const addCommentToPost = await Post.findByIdAndUpdate(
      postId,
      { comments: [...findPost.comments, comment._id] }, // Append the new comment ID to the comments array
      { new: true }
    );
    return res.status(201).send(comment);
  } catch (error) {
    console.log("Error adding comment to mongo db", error);
    res.status(500).send({ message: error.message });
  }
});
commentsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const { postId } = req.body;
    const fetchData = await Comment.find({ postId: postId });
    const comments = fetchData.populate({
      path: "user",
      model: User,
    });
    return res.status(200).send(comments);
  } catch (error) {
    console.log("Error fetching comments from mongo db", error);
    res.status(500).send({ message: error.message });
  }
});

commentsRouter.patch("/:commentId", requireAuth, async (req, res) => {
  try {
    const { likes } = req.body;
    const { commentId } = req.params;
    // Find the comment by its ObjectId and update its likes array
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { likes: [likes] },
      { new: true }
    );
    const findPost = await Post.findOne({ comments: commentId });
    if (!updatedComment) {
      return res.status(404).send({ message: "Comment not found" });
    }

    return res.status(200).send(findPost);
  } catch (error) {
    console.log("Error updating comment:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

commentsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await Comment.findByIdAndDelete(id);
    return res.status(202);
  } catch (error) {
    console.log("Error deleting comment:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

export default commentsRouter;
