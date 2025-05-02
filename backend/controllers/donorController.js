// my-app-backend/controllers/donorController.js
const User = require('../models/User');
const Donation = require('../models/Donation'); // Import the Donation model
const Project = require('../models/Project'); // Import Project if needed for other summaries
const ethers = require('ethers'); // Import ethers to handle Wei conversion

// @desc    Get profile details and donation summary of the logged-in Donor
// @route   GET /api/donor/profile
// @access  Private/Donor
exports.getDonorProfile = async (req, res) => {
    try {
        // req.user is populated by the 'protect' middleware
        const donorUserId = req.user._id;

        // Ensure the user is a Donor (redundant check if using restrictTo middleware)
        if (req.user.role !== 'Donor') {
            return res.status(403).json({ message: 'Access denied. Only donors can access this profile.' });
        }

        // 1. Fetch Donor Profile Details (excluding password)
        const userDetails = await User.findById(donorUserId)
            .select('email role walletAddress createdAt'); // Select fields for profile card

        if (!userDetails) {
            return res.status(404).json({ message: 'Donor details not found' });
        }

        // 2. Calculate Donation Summary
        // Find all donations made by this donor
        const donorDonations = await Donation.find({ donor: donorUserId });

        let totalDonatedWei = BigInt(0); // Use BigInt for Wei calculations
        const supportedProjectIds = new Set(); // Use a Set to count unique projects

        donorDonations.forEach(donation => {
            // Assuming donation.amount is stored as a Wei string
            try {
                totalDonatedWei += BigInt(donation.amount);
                supportedProjectIds.add(donation.project.toString()); // Add project ID string to Set
            } catch (e) {
                console.error(`Error processing donation amount: ${donation.amount}`, e);
                // Skip this donation in calculation if amount is invalid
            }
        });

        // Convert total Wei back to an ETH number string for easier frontend use
        // Note: This might lose precision for very large numbers, but should be okay for display
        const totalDonatedEth = ethers.formatEther(totalDonatedWei);

        const donationSummary = {
            // Send back the ETH value as a number
            totalDonated: parseFloat(totalDonatedEth),
            projectsSupported: supportedProjectIds.size // Get the count of unique projects
        };
        // --- End Summary Calculation ---

        // 3. Send Response
        res.json({
            profile: userDetails,
            summary: donationSummary // Send calculated summary
        });

    } catch (error) {
         console.error('Error fetching Donor profile:', error);
         res.status(500).json({ message: 'Server error fetching Donor profile' });
    }
};

// TODO: Add controller for fetching donor's donation history
// exports.getMyDonations = async (req, res) => { ... };
