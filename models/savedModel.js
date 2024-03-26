import mongoose from "mongoose";

const savedSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  createdAt: {
    type: String,
    required: true,
  },
});

export const Saved =
  mongoose.models.Saved || mongoose.model("Saved", savedSchema);
