import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  caption: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  tags: [{ type: String, required: true }],
  likes: [{ type: String }],
  saved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Saved",
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comments",
    },
  ],
  createdAt: {
    type: Number,
    required: true,
  },
});

export const Post = mongoose.models.Post || mongoose.model("Post", postSchema);
