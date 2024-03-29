import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
    required: true,
  },
  saved: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: String }],
  followers: [{ type: String }],
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
