    // my-app-backend/controllers/ngoController.js
    const User = require('../models/User');
    const fs = require('fs'); // File system module for deleting old logo if needed
    const path = require('path'); // Path module

    // @desc    Get details of the logged-in NGO
    // @route   GET /api/ngo/profile
    // @access  Private/NGO
    exports.getNgoProfile = async (req, res) => {
        try {
            // req.user is populated by the 'protect' middleware
            const ngoUser = req.user;

            // Ensure the user is an NGO
            if (ngoUser.role !== 'NGO') {
                return res.status(403).json({ message: 'Access denied' });
            }

            // Fetch full details including profile fields
            const userDetails = await User.findById(ngoUser._id)
                .select('email role walletAddress verificationStatus createdAt documentUrl ngoName ngoDescription ngoLogoUrl'); // Select all needed fields

            if (!userDetails) {
                return res.status(404).json({ message: 'NGO details not found' });
            }

            res.json(userDetails);

        } catch (error) {
             console.error('Error fetching NGO profile:', error);
             res.status(500).json({ message: 'Server error fetching NGO profile' });
        }
    };

    // @desc    Update profile for the logged-in NGO
    // @route   PUT /api/ngo/profile
    // @access  Private/NGO
    exports.updateNgoProfile = async (req, res) => {
        const { ngoName, ngoDescription } = req.body;
        const userId = req.user._id; // Get user ID from authenticated user

        try {
            const ngoUser = await User.findById(userId);

            if (!ngoUser || ngoUser.role !== 'NGO') {
                return res.status(404).json({ message: 'NGO user not found or not authorized' });
            }

            // Update text fields if provided
            if (ngoName !== undefined) ngoUser.ngoName = ngoName;
            if (ngoDescription !== undefined) ngoUser.ngoDescription = ngoDescription;

            // Handle logo upload if a file is present
            if (req.file) {
                const newLogoPath = `/uploads/${req.file.filename}`;

                // Optional: Delete the old logo file if it exists
                if (ngoUser.ngoLogoUrl) {
                    const oldLogoFilePath = path.join(__dirname, '..', ngoUser.ngoLogoUrl); // Construct absolute path
                     // Use fs.unlink to delete the file, handle potential errors
                     fs.unlink(oldLogoFilePath, (err) => {
                        if (err && err.code !== 'ENOENT') { // Ignore 'file not found' errors
                            console.error("Error deleting old logo:", oldLogoFilePath, err);
                            // Decide if this should block the update or just log the error
                        } else if (!err) {
                             console.log("Successfully deleted old logo:", oldLogoFilePath);
                        }
                    });
                }

                // Update the logo URL in the database
                ngoUser.ngoLogoUrl = newLogoPath;
            }

            // Save the updated user document
            const updatedUser = await ngoUser.save();

            // Return relevant updated details (exclude sensitive info)
            res.json({
                _id: updatedUser._id,
                email: updatedUser.email,
                role: updatedUser.role,
                ngoName: updatedUser.ngoName,
                ngoDescription: updatedUser.ngoDescription,
                ngoLogoUrl: updatedUser.ngoLogoUrl,
                verificationStatus: updatedUser.verificationStatus, // Include status
                // Add other fields as needed
            });

        } catch (error) {
            console.error('Error updating NGO profile:', error);
            // Handle Mongoose validation errors
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).json({ message: messages.join('. ') });
            }
            res.status(500).json({ message: 'Server error updating profile' });
        }
    };
    