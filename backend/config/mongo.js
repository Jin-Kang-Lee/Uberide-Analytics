import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectMongo = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Print cluster host and DB name
    console.log("🍃 MongoDB Connected Successfully");
    console.log(`   🔗 Host: ${conn.connection.host}`);
    console.log(`   📂 Database: ${conn.connection.name}`);

    // ✅ Return the connection object so server.js can use it
    return conn;

  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.error("   ⚠️  Make sure your IP is whitelisted and credentials are correct.");
    // ❌ Do NOT exit the whole process — let backend continue without Mongo if needed
    throw error; // pass the error up instead of exiting
  }
};

export default connectMongo;
