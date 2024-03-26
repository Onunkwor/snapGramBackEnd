import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  postId: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  likes: [{ type: String }],
  createdAt: {
    type: Number,
    required: true,
  },
});

export const Comment =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);
