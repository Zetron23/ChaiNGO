// my-app-backend/models/Donation.js
const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
    donor: { // Reference to the User who donated
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // Assuming only logged-in donors can donate via UI
        index: true,
    },
    project: { // Reference to the Project donated to
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true,
    },
    ngo: { // Reference to the NGO owning the project (denormalized for easier querying)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: { // Amount donated (store as string if using Wei, or Number if storing ETH/USD)
        type: String, // Store Wei amount as string to avoid precision issues
        required: true,
    },
    currency: { // Currency used (e.g., 'ETH', 'WEI', 'USD')
        type: String,
        default: 'WEI', // Assuming direct ETH donations for now
        required: true,
    },
    transactionHash: { // Blockchain transaction hash
        type: String,
        required: true,
        unique: true, // Ensure each transaction is recorded only once
        index: true,
    },
    donorWalletAddress: { // Wallet address of the donor
        type: String,
        required: true,
    },
    donationTimestamp: { // Timestamp from the blockchain event (more accurate) or server time
        type: Date,
        default: Date.now,
    }
}, { timestamps: true }); // Adds createdAt and updatedAt managed by Mongoose

// Ensure the model is correctly created and exported
const Donation = mongoose.model('Donation', DonationSchema);

module.exports = Donation; // Use module.exports
