// my-app-backend/controllers/donationController.js
const Donation = require('../models/Donation');
const Project = require('../models/Project');
const User = require('../models/User'); // Needed to verify donor role
const ethers = require('ethers'); // For converting amounts if needed

// @desc    Record a successful donation made via smart contract
// @route   POST /api/donations/record
// @access  Private/Donor
// Ensure 'exports.recordDonation' is correctly defined
exports.recordDonation = async (req, res) => {
    // Get data sent from frontend after successful contract interaction
    const { projectId, amountEth, transactionHash } = req.body;
    // Ensure req.user exists from 'protect' middleware
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Not authorized, user data missing.' });
    }
    const donorUserId = req.user._id;
    const donorWalletAddress = req.user.walletAddress; // Assuming wallet address is on req.user

    // --- Basic Validation ---
    if (!projectId || !amountEth || !transactionHash) {
        return res.status(400).json({ message: 'Missing required fields: projectId, amountEth, transactionHash' });
    }
    if (!donorWalletAddress) {
        return res.status(400).json({ message: 'Donor wallet address not found.' });
    }
     if (isNaN(parseFloat(amountEth)) || parseFloat(amountEth) <= 0) {
        return res.status(400).json({ message: 'Invalid donation amount.' });
    }
    // --- End Validation ---

    try {
        // 1. Verify Donor Role (redundant if restrictTo('Donor') is used, but safe)
        if (req.user.role !== 'Donor') {
            return res.status(403).json({ message: 'Only donors can record donations.' });
        }

        // 2. Find the Project and verify it exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        // 3. Check if this transaction hash has already been recorded
        const existingDonation = await Donation.findOne({ transactionHash });
        if (existingDonation) {
            console.log(`Donation already recorded for tx: ${transactionHash}`);
            return res.status(200).json({ message: 'Donation already recorded.', donation: existingDonation });
        }

        // 4. Convert amount (assuming input `amountEth` is in ETH) to Wei string for storage
        const amountWei = ethers.parseEther(amountEth).toString();

        // 5. Create the Donation record
        const newDonation = await Donation.create({
            donor: donorUserId,
            project: projectId,
            ngo: project.ngoOwner, // Get NGO ID from the project
            amount: amountWei,
            currency: 'WEI', // Store as Wei
            transactionHash,
            donorWalletAddress,
            // donationTimestamp can use default
        });

        // 6. Update the Project's fundingRaised (handle potential race conditions)
        // Convert amountWei back to a number (ETH) for calculation if fundingRaised is stored as ETH number
        // If fundingRaised is stored as Wei (string), use BigInt arithmetic
        const amountEthNum = parseFloat(amountEth);
        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            // Ensure $inc operator is used correctly
            { $inc: { fundingRaised: amountEthNum } },
            { new: true, runValidators: true } // Return updated doc and run schema validators
        );

        console.log(`Recorded donation for tx: ${transactionHash}, Project ${projectId} funding updated.`);

        res.status(201).json({
            message: 'Donation recorded successfully.',
            donation: newDonation,
            updatedProjectFunding: updatedProject?.fundingRaised // Send back updated amount
        });

    } catch (error) {
        console.error('Error recording donation:', error);
        // Handle potential duplicate key error for transactionHash gracefully
        if (error.code === 11000 && error.keyPattern && error.keyPattern.transactionHash) {
             return res.status(409).json({ message: 'This transaction has already been recorded.' });
        }
        res.status(500).json({ message: 'Server error recording donation.' });
    }
};

// TODO: Add controller for fetching donor's donation history
// exports.getMyDonations = async (req, res) => { ... };
