// my-app-backend/routes/donationRoutes.js
const express = require('express');
const { recordDonation } = require('../controllers/donationController'); // Ensure controller function is imported
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Import middleware for protection

const router = express.Router();

// --- Donation Routes ---

// POST /api/donations/record - Record a successful blockchain donation
// Requires user to be logged in (protect) and be a Donor (restrictTo)
router.post('/record', protect, restrictTo('Donor'), recordDonation);

// TODO: Add route for GET /api/donations/my-history (Private/Donor)
// Example: router.get('/my-history', protect, restrictTo('Donor'), getMyDonations);

module.exports = router;
