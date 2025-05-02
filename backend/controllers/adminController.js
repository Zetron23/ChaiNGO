// my-app-backend/controllers/adminController.js
const ethers = require('ethers'); // Import ethers
const User = require('../models/User');
const Project = require('../models/Project'); // Import Project model
require('dotenv').config();

// --- Contract Setup ---
const contractAddress = process.env.DONATION_CONTRACT_ADDRESS;
const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const adminWallet = new ethers.Wallet(adminPrivateKey, provider);

// --- ACTUAL ABI ---
const contractAbi = [
    { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
    { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "donor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amountToNgo", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amountToMilestones", "type": "uint256" } ], "name": "DonationMade", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "milestoneIndex", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "MilestoneFundsReleased", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "ngoWallet", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "ProjectFundsWithdrawn", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "uint256", "name": "projectId", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "ngoWallet", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "fundingGoal", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "milestoneCount", "type": "uint256" } ], "name": "ProjectRegistered", "type": "event" },
    { "inputs": [ { "internalType": "uint256", "name": "_projectId", "type": "uint256" } ], "name": "donate", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [], "name": "emergencyWithdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "_projectId", "type": "uint256" } ], "name": "getProjectDetails", "outputs": [ { "components": [ { "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "uint256", "name": "fundingGoal", "type": "uint256" }, { "internalType": "uint256", "name": "totalRaised", "type": "uint256" }, { "internalType": "uint256", "name": "milestoneCount", "type": "uint256" }, { "internalType": "uint256", "name": "amountPerMilestone", "type": "uint256" }, { "internalType": "uint256", "name": "initialFundsReleased", "type": "uint256" }, { "internalType": "uint256", "name": "milestonesFunded", "type": "uint256" }, { "internalType": "address payable", "name": "ngoWallet", "type": "address" }, { "internalType": "bool", "name": "exists", "type": "bool" }, { "internalType": "bool", "name": "active", "type": "bool" } ], "internalType": "struct DonationContract.Project", "name": "", "type": "tuple" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "nextProjectId", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "projects", "outputs": [ { "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "uint256", "name": "fundingGoal", "type": "uint256" }, { "internalType": "uint256", "name": "totalRaised", "type": "uint256" }, { "internalType": "uint256", "name": "milestoneCount", "type": "uint256" }, { "internalType": "uint256", "name": "amountPerMilestone", "type": "uint256" }, { "internalType": "uint256", "name": "initialFundsReleased", "type": "uint256" }, { "internalType": "uint256", "name": "milestonesFunded", "type": "uint256" }, { "internalType": "address payable", "name": "ngoWallet", "type": "address" }, { "internalType": "bool", "name": "exists", "type": "bool" }, { "internalType": "bool", "name": "active", "type": "bool" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "_backendId", "type": "uint256" }, { "internalType": "uint256", "name": "_fundingGoalWei", "type": "uint256" }, { "internalType": "uint256", "name": "_milestoneCount", "type": "uint256" }, { "internalType": "address payable", "name": "_ngoWallet", "type": "address" } ], "name": "registerProject", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "_projectId", "type": "uint256" } ], "name": "releaseMilestonePayment", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "_projectId", "type": "uint256" } ], "name": "toggleProjectActive", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "_projectId", "type": "uint256" }, { "internalType": "address payable", "name": "_newNgoWallet", "type": "address" } ], "name": "updateNgoWallet", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "stateMutability": "payable", "type": "receive" }
];
// --- End ABI ---

const donationContract = new ethers.Contract(contractAddress, contractAbi, adminWallet);
// --- End Contract Setup ---


// @desc    Get all NGOs with pending verification status
// @route   GET /api/admin/pending-ngos
// @access  Private/Admin
exports.getPendingNgos = async (req, res) => {
    console.log("ADMIN CONTROLLER: getPendingNgos called by user:", req.user?._id); // Logging
    try {
        console.log("ADMIN CONTROLLER: Finding pending NGOs in DB..."); // Logging
        const pendingNgos = await User.find({ role: 'NGO', verificationStatus: 'pending' })
                                      .select('email createdAt walletAddress documentUrl');
        console.log(`ADMIN CONTROLLER: Found ${pendingNgos.length} pending NGOs.`); // Logging
        res.json(pendingNgos);
        console.log("ADMIN CONTROLLER: Response sent for getPendingNgos."); // Logging
    } catch (error) {
        console.error('ADMIN CONTROLLER: Error fetching pending NGOs:', error); // Logging
        res.status(500).json({ message: 'Server error fetching pending NGOs' });
    }
};

// @desc    Update NGO verification status (approve/reject)
// @route   PUT /api/admin/verify-ngo/:userId
// @access  Private/Admin
exports.verifyNgo = async (req, res) => {
    console.log(`ADMIN CONTROLLER: verifyNgo called for user ${req.params.userId} with status ${req.body.status}`); // Logging
    const { userId } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    try {
        console.log("ADMIN CONTROLLER: Finding NGO user..."); // Logging
        const ngoUser = await User.findById(userId);
        if (!ngoUser || ngoUser.role !== 'NGO') return res.status(404).json({ message: 'NGO user not found' });
        console.log("ADMIN CONTROLLER: Updating NGO status..."); // Logging
        ngoUser.verificationStatus = status; await ngoUser.save();
        console.log("ADMIN CONTROLLER: NGO status updated."); // Logging
        res.json({ message: `NGO verification status updated to ${status}`, user: { _id: ngoUser._id, email: ngoUser.email, verificationStatus: ngoUser.verificationStatus } });
    } catch (error) { console.error('ADMIN CONTROLLER: Error verifying NGO:', error); res.status(500).json({ message: 'Server error verifying NGO' }); } // Logging
};

// @desc    Get all project milestones with status 'completed'
// @route   GET /api/admin/pending-milestones
// @access  Private/Admin
exports.getPendingMilestones = async (req, res) => {
    console.log("ADMIN CONTROLLER: getPendingMilestones called."); // Logging
    try {
        console.log("ADMIN CONTROLLER: Finding projects with completed milestones..."); // Logging
        const projectsWithPendingMilestones = await Project.find({ 'milestones.status': 'completed' })
            .populate('ngoOwner', 'email ngoName')
            .select('name milestones ngoOwner createdAt contractProjectId');
        console.log(`ADMIN CONTROLLER: Found ${projectsWithPendingMilestones.length} projects with potential pending milestones.`); // Logging

        const pendingMilestones = projectsWithPendingMilestones.flatMap(project =>
            project.milestones
                .filter(milestone => milestone.status === 'completed')
                .map(milestone => ({
                    projectId: project._id, contractProjectId: project.contractProjectId, projectName: project.name,
                    ngoId: project.ngoOwner._id, ngoName: project.ngoOwner.ngoName || project.ngoOwner.email,
                    milestoneId: milestone._id, milestoneDescription: milestone.description,
                    milestoneSubmittedAt: milestone.updatedAt || project.updatedAt
                }))
        );
        console.log(`ADMIN CONTROLLER: Found ${pendingMilestones.length} actual pending milestones.`); // Logging
        res.json(pendingMilestones);
        console.log("ADMIN CONTROLLER: Response sent for getPendingMilestones."); // Logging
    } catch (error) { console.error('ADMIN CONTROLLER: Error fetching pending milestones:', error); res.status(500).json({ message: 'Server error fetching pending milestones' }); } // Logging
};


// @desc    Update a specific milestone's status (verified/rejected)
// @route   PUT /api/admin/verify-milestone/:projectId/:milestoneId
// @access  Private/Admin
exports.verifyMilestone = async (req, res) => {
    console.log(`ADMIN CONTROLLER: verifyMilestone called for DB project ${req.params.projectId}, milestone ${req.params.milestoneId}`); // Logging
    const { projectId: backendProjectId, milestoneId } = req.params;
    const { status, adminNotes } = req.body;
    if (!['verified', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });

    try {
        console.log("ADMIN CONTROLLER: Finding project and milestone in DB..."); // Logging
        const project = await Project.findById(backendProjectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        const milestone = project.milestones.id(milestoneId);
        if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
        if (milestone.status !== 'completed') return res.status(400).json({ message: `Milestone status is '${milestone.status}'.` });
        const contractProjectId = project.contractProjectId;
        if (!contractProjectId && status === 'verified') { console.error(`ADMIN CONTROLLER: Contract project ID missing for DB project ${backendProjectId}`); return res.status(500).json({ message: 'Contract project ID not found. Cannot release funds.' }); } // Logging

        console.log("ADMIN CONTROLLER: Updating milestone status in DB..."); // Logging
        milestone.status = status;
        milestone.adminNotes = status === 'rejected' ? (adminNotes || 'Rejected by admin') : undefined;
        milestone.updatedAt = Date.now();
        await project.save();
        console.log("ADMIN CONTROLLER: Milestone status updated in DB."); // Logging

        if (status === 'verified') {
            console.log(`ADMIN CONTROLLER: Releasing milestone funds via contract for project ID: ${contractProjectId}`); // Logging
            try {
                // Ensure contractProjectId is passed correctly (as number/BigInt)
                const tx = await donationContract.releaseMilestonePayment(BigInt(contractProjectId)); // Use BigInt for uint256
                console.log(`ADMIN CONTROLLER: Milestone release tx sent: ${tx.hash}`); // Logging
                const receipt = await tx.wait();
                console.log(`ADMIN CONTROLLER: Milestone release tx confirmed: ${receipt.blockNumber}`); // Logging
            } catch (contractError) {
                console.error(`ADMIN CONTROLLER: Contract milestone release failed:`, contractError); // Logging
                milestone.status = 'completed'; // Revert status
                milestone.adminNotes = `Contract release failed: ${contractError.reason || contractError.message}`;
                await project.save(); // Save reverted status
                console.log("ADMIN CONTROLLER: Reverted milestone status in DB due to contract error."); // Logging
                return res.status(500).json({ message: `DB updated, but contract fund release failed: ${contractError.reason || contractError.message}` });
            }
        }

        console.log(`ADMIN CONTROLLER: Response sent for verifyMilestone.`); // Logging
        res.json({ message: `Milestone successfully ${status}`, projectId: project._id, milestoneId: milestone._id, newStatus: milestone.status });

    } catch (error) { console.error('ADMIN CONTROLLER: Error verifying/rejecting milestone:', error); res.status(500).json({ message: 'Server error updating milestone status' }); } // Logging
};
