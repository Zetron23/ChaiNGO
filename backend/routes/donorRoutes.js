    // my-app-backend/routes/donorRoutes.js
    const express = require('express');
    const { getDonorProfile } = require('../controllers/donorController');
    const { protect, restrictTo } = require('../middleware/authMiddleware');

    const router = express.Router();

    // --- Donor Specific Routes ---
    // All routes require authentication and Donor role

    // GET /api/donor/profile - Get logged-in Donor's profile details & summary
    router.get('/profile', protect, restrictTo('Donor'), getDonorProfile);

    // TODO: Add route for fetching donation history later

    module.exports = router;
    