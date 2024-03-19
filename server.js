import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import usersRouter from "./routes/userRoute.js";
import cors from "cors";

//Get .env variables
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;
console.log(MONGODB_URI);

//Initialize app
const app = express();

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
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["content-type"],
  })
);

app.use("/users", usersRouter);
//Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("App connected to mongodb");
    app.listen(4000, () => {
      console.log(MONGODB_URI);
    });
  })
  .catch((err) => {
    console.log("Error connecting to mongodb: ", err);
  });
