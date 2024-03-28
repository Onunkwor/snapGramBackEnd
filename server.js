import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import usersRouter from "./routes/userRoute.js";
import cors from "cors";
import postsRouter from "./routes/postRoute.js";
import commentsRouter from "./routes/comment.Route.js";
import savedRouter from "./routes/savedRoute.js";

//Get .env variables
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;
console.log(MONGODB_URI);

//Initialize app
const app = express();

app.listen(4000, () => {
  console.log("Welcome to mern stack");
});

app.get("/", (req, res) => {
  console.log(req);
  return res.status(200).send("Welcome to mern stack");
});

//Middleware for parsing request body
app.use(express.json());

//Middleware for handling cors policy
//Option 1: Allow all origins with default oof cors(*)
// app.use(cors());
//Option 2: Allow custom origins
const corsOptions = {
  origin: "https://snapgramapp.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));

app.use("/users", usersRouter);
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);
app.use("/saves", savedRouter);
//Connect to MongoDB
mongoose
  .connect(MONGODB_URI, { dbName: "snapGram" })
  .then(() => {
    console.log("App connected to mongodb");
  })
  .catch((err) => {
    console.log("Error connecting to mongodb: ", err);
  });
