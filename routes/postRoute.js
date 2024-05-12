import express from "express";
import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";
import { Comment } from "../models/commentModel.js";
import { Saved } from "../models/savedModel.js";
import { requireAuth } from "../MiddleWare/middleware.js";

const postsRouter = express.Router();

postsRouter.post("/", requireAuth, async (req, res) => {
  try {
    if (
      !req.body.creator ||
      !req.body.caption ||
      !req.body.tags ||
      !req.body.location ||
      !req.body.imageUrl
    ) {
      return res.status(400).send({
        message: "Send all required fields: creator, caption, file, tags",
      });
    }
    const newPost = {
      creator: req.body.creator,
      caption: req.body.caption,
      imageUrl: req.body.imageUrl,
      location: req.body.location,
      tags: req.body.tags,
      likes: req.body.likes,
      saved: req.body.saved,
      comments: req.body.comments,
      createdAt: req.body.createdAt,
    };
    const post = await Post.create(newPost);
    return res.status(201).send(post);
  } catch (error) {
    console.log("Error adding post to mongo db", error);
    res.status(500).send({ message: error.message });
  }
});

postsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const { cursor } = req.query;
    const posts = await Post.find({})
      .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
      .limit(13)
      .skip(cursor)
      .populate({
        path: "creator",
        model: User,
      });
    return res.status(200).send(posts);
  } catch (error) {
    console.log("Error fetching post from MongoDB", error);
    res.status(500).send({ message: error.message });
  }
});
postsRouter.get("/allPosts", requireAuth, async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 }).populate({
      path: "creator",
      model: User,
    });
    return res.status(200).send(posts);
  } catch (error) {
    console.log("Error fetching post from MongoDB", error);
    res.status(500).send({ message: error.message });
  }
});

postsRouter.get("/post/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const fetchData = await Post.findById(id)
      .populate({
        path: "creator",
        model: User,
      })
      .populate({
        path: "comments",
        model: Comment,
        populate: {
          path: "user", // Assuming the field in comments is named 'user'
          model: User,
        },
      })
      .populate({
        path: "saved",
        model: Saved,
        populate: {
          path: "user",
          model: User,
        },
        populate: {
          path: "postId",
          model: Post,
        },
      });
    return res.status(200).send(fetchData);
  } catch (error) {
    console.log("Error fetching post from MongoDB", error);
    res.status(500).send({ message: error.message });
  }
});

postsRouter.patch("/likes/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { likes } = req.body;
    const fetchData = await Post.findByIdAndUpdate(
      id,
      { likes: likes },
      {
        new: true,
      }
    );
    return res.status(200).send(fetchData);
  } catch (error) {
    console.log("Error updating post:", error);
    res.status(500).send({ message: error.message });
  }
});
postsRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, imageUrl, location, tags } = req.body;
    const updatePost = {
      caption,
      imageUrl,
      location,
      tags,
    };
    const fetchData = await Post.findByIdAndUpdate(id, updatePost, {
      new: true,
    });
    return res.status(200).send(fetchData);
  } catch (error) {
    console.log("Error updating post:", error);
    res.status(500).send({ message: error.message });
  }
});

postsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await Post.findByIdAndDelete(id);
    return res.status(202);
  } catch (error) {
    console.log("Error deleting post from mongodb", error);
    res.status(500).send({ message: error.message });
  }
});
postsRouter.get("/searchPost", requireAuth, async (req, res) => {
  try {
    const { query } = req.query;
    const posts = await Post.find({
      $or: [
        { caption: { $regex: query, $options: "i" } }, // Search in the caption
        { tags: { $regex: query, $options: "i" } }, // Search in the tags
      ],
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "creator",
        model: User,
      });
    return res.status(200).send(posts);
  } catch (error) {
    console.log("Error searching for post from MongoDB", error);
    res.status(500).send({ message: error.message });
  }
});
postsRouter.patch("/updatePost/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, imageUrl, location, tags } = req.body;
    const updatePost = {
      caption,
      imageUrl,
      location,
      tags,
    };
    const fetchData = await Post.findByIdAndUpdate(id, updatePost, {
      new: true,
    });
    return res.status(200).send(fetchData);
  } catch (error) {
    console.log("Error updating post:", error);
    res.status(500).send({ message: error.message });
  }
});
export default postsRouter;
