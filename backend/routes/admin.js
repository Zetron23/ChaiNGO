    // my-app-backend/routes/admin.js
    const express = require('express');
    // Import new controller functions
    const { getPendingNgos, verifyNgo, getPendingMilestones, verifyMilestone } = require('../controllers/adminController');
    const { protect, restrictTo } = require('../middleware/authMiddleware');

    const router = express.Router();

    // --- Admin Routes ---
    // All routes below require authentication (protect) and Admin role (restrictTo('Admin'))

    // --- NGO Verification ---
    router.get('/pending-ngos', protect, restrictTo('Admin'), getPendingNgos);
    router.put('/verify-ngo/:userId', protect, restrictTo('Admin'), verifyNgo);

    // --- Milestone Verification ---
    router.get('/pending-milestones', protect, restrictTo('Admin'), getPendingMilestones);
    router.put('/verify-milestone/:projectId/:milestoneId', protect, restrictTo('Admin'), verifyMilestone);

    module.exports = router;
    