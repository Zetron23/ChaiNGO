// my-app-backend/controllers/projectController.js
const ethers = require('ethers');
const Project = require('../models/Project');
const User = require('../models/User');
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


// @desc    Create a new project (DB and Contract)
// @route   POST /api/projects
// @access  Private/NGO
exports.createProject = async (req, res) => {
    if (!req.user || req.user.role !== 'NGO' || req.user.verificationStatus !== 'approved') {
        return res.status(403).json({ message: 'Only approved NGOs can create projects.' });
    }

    const { name, description, fundingRequired, milestonesInput } = req.body;
    const ngoUserId = req.user._id;

    // --- Input Validation ---
    if (!name || !description || fundingRequired === undefined || !milestonesInput || milestonesInput.trim() === '') {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    const fundingRequiredNum = Number(fundingRequired);
    if (isNaN(fundingRequiredNum) || fundingRequiredNum <= 0) { // Goal must be > 0
        return res.status(400).json({ message: 'Funding required must be a positive number.' });
    }
    const milestones = milestonesInput.split('^').map(m => m.trim()).filter(m => m);
    if (milestones.length === 0) {
        return res.status(400).json({ message: 'Please provide valid milestones separated by ^.' });
    }
    // --- End Validation ---

    try {
         // 1. Get NGO Wallet Address from User model
         const ngoUser = await User.findById(ngoUserId).select('walletAddress');
         if (!ngoUser || !ngoUser.walletAddress) {
             return res.status(400).json({ message: 'NGO wallet address not found. Please link wallet in profile.' });
         }
         const ngoWalletAddress = ngoUser.walletAddress;

         // 2. Create Project in Database (initially without contractProjectId)
         const newProject = new Project({
             ngoOwner: ngoUserId, name, description,
             fundingRequired: fundingRequiredNum, // Store the number in DB
             milestones: milestones.map(desc => ({ description: desc, status: 'pending' })),
             // contractProjectId will be added after contract call
         });
         const savedProject = await newProject.save();
         const backendId = savedProject._id; // Use DB ID for reference if needed

         // Convert fundingRequired to string for parseEther
         const fundingRequiredString = String(fundingRequired);

         // 3. Register Project on Smart Contract
         console.log(`Registering project on contract: Goal=${ethers.parseEther(fundingRequiredString)} Wei, Milestones=${milestones.length}, NGO=${ngoWalletAddress}`);
         const tx = await donationContract.registerProject(
             0, // Pass 0 or backendId if you store it in contract's 'id' field
             ethers.parseEther(fundingRequiredString), // Use the string version here
             milestones.length,
             ngoWalletAddress
         );
         console.log(`Transaction sent: ${tx.hash}`);
         const receipt = await tx.wait(); // Wait for transaction confirmation
         console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);

         // 4. Extract contractProjectId from event logs (more robust)
         let contractProjectId = null;
         const eventTopic = donationContract.interface.getEvent("ProjectRegistered").topicHash;
         const log = receipt.logs.find(l => l.topics[0] === eventTopic);

         if (log) {
             const decodedLog = donationContract.interface.parseLog(log);
             contractProjectId = Number(decodedLog.args.projectId); // Convert BigInt to Number
             console.log(`Contract Project ID from event: ${contractProjectId}`);
         } else {
             console.error("Could not find ProjectRegistered event in transaction receipt!");
             throw new Error("Failed to retrieve project ID from contract event.");
         }

         // 5. Update Database record with contractProjectId
         savedProject.contractProjectId = contractProjectId;
         await savedProject.save();

         res.status(201).json(savedProject); // Return the complete project data

    } catch (error) {
        console.error('Error creating project (DB or Contract):', error);
        // Attempt to clean up DB entry if contract call failed? (Complex)
        // Handle DB validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        // Handle contract errors (e.g., revert, gas issues)
        // error.reason might contain revert message from contract
        res.status(500).json({ message: `Server/Contract error: ${error.reason || error.message}` });
    }
};

// Get Active Projects
exports.getActiveProjects = async (req, res) => {
    try {
        const activeProjects = await Project.find({ status: 'active' })
            .populate({ path: 'ngoOwner', select: 'ngoName ngoLogoUrl email' })
            .select('name description fundingRequired fundingRaised status ngoOwner createdAt contractProjectId milestones') // Include necessary fields
            .sort({ createdAt: -1 });

        // Map to include totalMilestones count if needed by frontend
        const formattedProjects = activeProjects.map(p => ({
            ...p.toObject(), // Convert Mongoose doc to plain object
            totalMilestones: p.milestones?.length || 0 // Add milestone count
        }));
        res.json(formattedProjects);
    } catch (error) {
        console.error('Error fetching active projects:', error);
        res.status(500).json({ message: 'Server error fetching active projects' });
    }
};


// Complete Milestone
exports.completeMilestone = async (req, res) => {
    const { projectId, milestoneId } = req.params; const userId = req.user._id;
    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!project.ngoOwner.equals(userId)) return res.status(403).json({ message: 'Not authorized' });
        const milestone = project.milestones.id(milestoneId); if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
        if (milestone.status === 'completed' || milestone.status === 'verified') return res.status(400).json({ message: `Milestone already ${milestone.status}.` });
        if (milestone.status === 'pending' || milestone.status === 'rejected') {
            milestone.status = 'completed'; milestone.updatedAt = Date.now(); milestone.adminNotes = undefined; await project.save();
            res.json({ message: `Milestone submitted for verification`, project });
        } else { return res.status(400).json({ message: `Cannot update milestone with status '${milestone.status}'.` }); }
    } catch (error) { console.error('Error updating milestone status:', error); res.status(500).json({ message: 'Server error updating milestone' }); }
};

// Get My Projects
exports.getMyProjects = async (req, res) => {
    try {
        const ngoUser = req.user;
        if (ngoUser.role !== 'NGO') return res.status(403).json({ message: 'Access denied.' });
        // Populate ngoOwner details when fetching projects
        const projects = await Project.find({ ngoOwner: ngoUser._id })
                                     .populate({ path: 'ngoOwner', select: 'ngoName ngoLogoUrl email' }) // Populate necessary NGO fields
                                     .select('name description fundingRequired fundingRaised status ngoOwner createdAt contractProjectId milestones') // Include necessary fields
                                     .sort({ createdAt: -1 });

        // Map to include totalMilestones count if needed by frontend
        const formattedProjects = projects.map(p => ({
            ...p.toObject(), // Convert Mongoose doc to plain object
            totalMilestones: p.milestones?.length || 0 // Add milestone count
        }));

        res.json(formattedProjects);
    } catch (error) {
        console.error('Error fetching NGO projects:', error);
        res.status(500).json({ message: 'Server error fetching projects' });
    }
};
