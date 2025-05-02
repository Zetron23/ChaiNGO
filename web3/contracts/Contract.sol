// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol"; // For admin controls
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // Prevent reentrancy attacks

contract DonationContract is Ownable, ReentrancyGuard {

    struct Project {
        uint256 id; // Link to backend project ID (optional, for reference)
        uint256 fundingGoal; // In Wei
        uint256 totalRaised; // In Wei
        uint256 milestoneCount;
        uint256 amountPerMilestone; // fundingGoal * 40% / milestoneCount
        uint256 initialFundsReleased; // fundingGoal * 60% (tracked amount)
        uint256 milestonesFunded; // How many milestones have had funds released
        address payable ngoWallet;
        bool exists;
        bool active; // Can donations be accepted?
    }

    // Mapping from a unique project ID (can be assigned sequentially or match backend ID)
    mapping(uint256 => Project) public projects;
    uint256 public nextProjectId = 1; // Counter for assigning unique IDs

    // Events
    event ProjectRegistered(uint256 indexed projectId, address indexed ngoWallet, uint256 fundingGoal, uint256 milestoneCount);
    event DonationMade(uint256 indexed projectId, address indexed donor, uint256 amount, uint256 amountToNgo, uint256 amountToMilestones);
    event MilestoneFundsReleased(uint256 indexed projectId, uint256 milestoneIndex, uint256 amount);
    event ProjectFundsWithdrawn(uint256 indexed projectId, address indexed ngoWallet, uint256 amount); // If adding explicit withdrawal

    modifier projectExists(uint256 _projectId) {
        require(projects[_projectId].exists, "Project does not exist");
        _;
    }

    modifier projectIsActive(uint256 _projectId) {
        require(projects[_projectId].active, "Project is not active for donations");
        _;
    }

    constructor() Ownable() {} // Set deployer as owner/admin

    // --- Admin Functions ---

    function registerProject(
        uint256 _backendId, // Optional reference ID from your database
        uint256 _fundingGoalWei,
        uint256 _milestoneCount,
        address payable _ngoWallet
    ) external onlyOwner returns (uint256) {
        require(_fundingGoalWei > 0, "Funding goal must be positive");
        require(_milestoneCount > 0, "Must have at least one milestone");
        require(_ngoWallet != address(0), "Invalid NGO wallet address");

        uint256 projectId = nextProjectId++;
        uint256 milestoneAmount = (_fundingGoalWei * 40) / 100 / _milestoneCount; // Calculate per-milestone share

        projects[projectId] = Project({
            id: _backendId, // Store backend ID if provided
            fundingGoal: _fundingGoalWei,
            totalRaised: 0,
            milestoneCount: _milestoneCount,
            amountPerMilestone: milestoneAmount,
            initialFundsReleased: 0, // Track the 60% portion goal
            milestonesFunded: 0,
            ngoWallet: _ngoWallet,
            exists: true,
            active: true // Activate project upon registration
        });

        emit ProjectRegistered(projectId, _ngoWallet, _fundingGoalWei, _milestoneCount);
        return projectId;
    }

    function releaseMilestonePayment(uint256 _projectId)
        external
        onlyOwner // Only admin can release milestone funds
        projectExists(_projectId)
        nonReentrant // Prevent reentrancy
    {
        Project storage project = projects[_projectId];
        require(project.milestonesFunded < project.milestoneCount, "All milestone funds already released");

        // Calculate expected funds held for milestones so far based on total raised
        // This ensures we don't release funds that haven't been donated yet
        uint256 expectedMilestoneEscrow = (project.totalRaised * 40) / 100;
        uint256 fundsReleasedForMilestones = project.milestonesFunded * project.amountPerMilestone;

        require(expectedMilestoneEscrow > fundsReleasedForMilestones, "Insufficient escrowed funds for next milestone");

        uint256 amountToRelease = project.amountPerMilestone;

        // Ensure we don't try to release more than is available in the contract for this milestone portion
        uint256 contractBalanceForMilestone = address(this).balance - (project.totalRaised - expectedMilestoneEscrow); // Estimate milestone funds in contract
        if (amountToRelease > contractBalanceForMilestone) {
             // This might happen due to slight rounding or gas differences, release what's available
             amountToRelease = contractBalanceForMilestone;
             // Or revert: require(amountToRelease <= contractBalanceForMilestone, "Contract balance insufficient for milestone");
        }
        require(amountToRelease > 0, "Milestone amount calculation error or no funds");


        project.milestonesFunded++; // Increment funded count *before* transfer

        // Transfer funds to NGO
        (bool success, ) = project.ngoWallet.call{value: amountToRelease}("");
        require(success, "Milestone fund transfer failed");

        emit MilestoneFundsReleased(_projectId, project.milestonesFunded, amountToRelease); // Emit index *after* incrementing
    }

    function toggleProjectActive(uint256 _projectId) external onlyOwner projectExists(_projectId) {
        projects[_projectId].active = !projects[_projectId].active;
    }

     // Optional: Function to update NGO wallet if needed
    function updateNgoWallet(uint256 _projectId, address payable _newNgoWallet) external onlyOwner projectExists(_projectId) {
        require(_newNgoWallet != address(0), "Invalid new NGO wallet address");
        projects[_projectId].ngoWallet = _newNgoWallet;
    }

    // --- Public/Donor Functions ---

    function donate(uint256 _projectId)
        external
        payable // Allows function to receive ETH
        projectExists(_projectId)
        projectIsActive(_projectId)
        nonReentrant
    {
        require(msg.value > 0, "Donation must be positive");
        Project storage project = projects[_projectId];

        uint256 donationAmount = msg.value;
        project.totalRaised += donationAmount;

        // Calculate distribution
        uint256 amountToNgo = (donationAmount * 60) / 100;
        uint256 amountToMilestones = donationAmount - amountToNgo; // The remaining 40%

        // Transfer 60% directly to NGO
        if (amountToNgo > 0) {
            (bool success, ) = project.ngoWallet.call{value: amountToNgo}("");
            require(success, "Direct NGO transfer failed");
            project.initialFundsReleased += amountToNgo; // Track amount sent for 60% portion
        }

        // The remaining 40% (amountToMilestones) stays in the contract for milestone releases

        emit DonationMade(_projectId, msg.sender, donationAmount, amountToNgo, amountToMilestones);
    }

    // --- View Functions ---

    function getProjectDetails(uint256 _projectId)
        external
        view
        projectExists(_projectId)
        returns (Project memory)
    {
        return projects[_projectId];
    }

    // Allow owner to withdraw any remaining funds in case of errors (use carefully!)
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Emergency withdraw failed");
    }

    // Receive function to accept direct ETH transfers (optional, donations should ideally use the donate function)
    receive() external payable {}
}
