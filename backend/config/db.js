// my-app-backend/config/db.js
const mongoose = require('mongoose');
// require('dotenv').config(); // REMOVED: dotenv should be configured in server.js

const connectDB = async () => {
  try {
    // Get MongoDB connection string from environment variables
    // process.env will be populated by the dotenv.config() call in server.js
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      // This error will now correctly trigger if MONGO_URI wasn't loaded by server.js
      throw new Error('MONGO_URI is not defined in the environment variables. Check .env file and ensure dotenv.config() is called in server.js');
    }

    // Connect to MongoDB
    await mongoose.connect(mongoURI);

    console.log('MongoDB Connected...');
  } catch (err) {
    // Log any connection errors
    console.error('MongoDB Connection Error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
