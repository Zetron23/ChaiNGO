    // my-app-backend/routes/auth.js
    const express = require('express');
    const multer = require('multer'); // Import multer
    const path = require('path'); // Import path
    const { signup, signin, signinWithWallet } = require('../controllers/authController');

    const router = express.Router();

    // --- Multer Configuration ---
    // Define storage options
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Specify the directory to save files
      },
      filename: function (req, file, cb) {
        // Create a unique filename: fieldname-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

    // File filter (optional: accept only certain file types)
    const fileFilter = (req, file, cb) => {
      // Example: Accept only PDF files
      if (file.mimetype === 'application/pdf') {
        cb(null, true); // Accept file
      } else {
        cb(new Error('Invalid file type. Only PDF files are allowed.'), false); // Reject file
      }
    };

    // Initialize multer upload instance
    const upload = multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // Optional: Limit file size (e.g., 5MB)
        fileFilter: fileFilter // Optional: Apply file filter
    });
    // --- End Multer Configuration ---


    // --- Authentication Routes ---

    // Register a new user
    // POST /api/auth/signup/Admin
    // POST /api/auth/signup/Donor
    router.post('/signup/:userType', (req, res, next) => {
        // Apply multer middleware ONLY if userType is NGO
        if (req.params.userType === 'NGO') {
            // Use upload.single('document'), 'document' must match the name attribute of the file input in the frontend form
            upload.single('document')(req, res, (err) => {
                if (err) {
                    // Handle multer-specific errors (like file size or type)
                    console.error("Multer error during NGO signup:", err.message);
                    // Send a specific error response based on the multer error
                    return res.status(400).json({ message: err.message || "File upload error" });
                }
                // If multer processing is successful (or no file needed for other roles), proceed to the main signup controller
                next();
            });
        } else {
            // For Admin/Donor, skip multer and proceed directly
            next();
        }
    }, signup); // The main signup controller function


    // Sign in using email and password
    router.post('/signin/:userType', signin);

    // Sign in using MetaMask wallet address
    router.post('/signin/wallet/:userType', signinWithWallet);

    module.exports = router;
    