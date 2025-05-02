    // my-app-backend/models/Project.js
    const mongoose = require('mongoose');

    const MilestoneSchema = new mongoose.Schema({
      description: { type: String, required: true, trim: true },
      status: { type: String, enum: ['pending', 'completed', 'verified', 'rejected'], default: 'pending' },
      adminNotes: { type: String, trim: true },
      updatedAt: { type: Date }
    });

    const ProjectSchema = new mongoose.Schema({
      name: { type: String, required: true, trim: true, maxlength: 100 },
      description: { type: String, required: true, trim: true },
      fundingRequired: { type: Number, required: true, min: 0 },
      fundingRaised: { type: Number, default: 0, min: 0 }, // This will be updated based on contract events/backend calls
      ngoOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      milestones: [MilestoneSchema],
      status: { type: String, enum: ['draft', 'active', 'completed', 'cancelled'], default: 'active' },
      // --- NEW ---
      contractProjectId: { // ID assigned by the DonationContract
          type: Number, // Match the uint256 type (can overflow JS Number if huge, consider String)
          // unique: true, // Should be unique if assigned sequentially by contract
          // sparse: true,
      },
      // -----------
    }, { timestamps: true });

    const Project = mongoose.model('Project', ProjectSchema);
    module.exports = Project;
    