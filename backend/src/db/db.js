const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI not defined in environment");
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");

    // Clean up obsolete 'username_1' unique index if it exists
    try {
      await mongoose.connection.db.collection("users").dropIndex("username_1");
      console.log("Obsolete 'username_1' index dropped successfully");
    } catch (err) {
      if (err.codeName !== "IndexNotFound") {
        console.warn("Warning: Could not drop index 'username_1':", err.message);
      }
    }
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
