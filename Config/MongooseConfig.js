// import dotenv from "dotenv";
// dotenv.config();
import mongoose from "mongoose";

mongoose.set("strictQuery", false);

const database = process.env.DATABASE_NAME;

mongoose.connect(database)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Connection error:", err.message));

export default mongoose;

