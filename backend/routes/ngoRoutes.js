    // my-app-backend/routes/ngoRoutes.js
    const express = require('express');
    const multer = require('multer');
    const path = require('path');
    const { getNgoProfile, updateNgoProfile } = require('../controllers/ngoController');
    const { protect, restrictTo } = require('../middleware/authMiddleware');

    const router = express.Router();

    // --- Multer Configuration for Logo Upload ---
    const logoStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save logos in the same uploads folder for simplicity
      },
      filename: function (req, file, cb) {
        // Create a unique filename: logo-userid-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Use req.user._id if available to make filename more specific
        const userId = req.user?._id || 'unknown';
        cb(null, `logo-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });

    // File filter for logos (accept common image types)
    const logoFileFilter = (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) { // Accept any image type
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only images are allowed for logos.'), false);
      }
    };

    // Initialize multer upload instance for logos
    const uploadLogo = multer({
        storage: logoStorage,
        limits: { fileSize: 2 * 1024 * 1024 }, // Example: Limit logo size to 2MB
        fileFilter: logoFileFilter
    });
    // --- End Multer Configuration ---


    // --- NGO Specific Routes ---
    // All routes require authentication and NGO role

    // GET /api/ngo/profile - Get logged-in NGO's profile details
    router.get('/profile', protect, restrictTo('NGO'), getNgoProfile);

    // PUT /api/ngo/profile - Update logged-in NGO's profile
    // Use uploadLogo.single('ngoLogo') middleware to handle logo file upload
    // 'ngoLogo' must match the name attribute of the file input in the frontend form
    router.put(
        '/profile',
        protect,
        restrictTo('NGO'),
        uploadLogo.single('ngoLogo'), // Apply multer middleware here
        updateNgoProfile
    );


    module.exports = router;
    