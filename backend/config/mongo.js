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

  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.error("   ⚠️  Make sure your IP is whitelisted and credentials are correct.");
    process.exit(1);
  }
};

export default connectMongo;
