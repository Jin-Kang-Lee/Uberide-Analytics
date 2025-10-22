import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_URI in .env file");

  const conn = await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  return conn;
}
