    // my-app-backend/models/User.js
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');

    // Define the User schema
    const UserSchema = new mongoose.Schema({
      email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [ /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
        lowercase: true,
      },
      password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false,
      },
      role: {
        type: String,
        enum: ['Admin', 'Donor', 'NGO'],
        required: [true, 'Please provide a user role'],
      },
      walletAddress: {
        type: String,
        unique: true,
        sparse: true,
        match: [/^0x[a-fA-F0-9]{40}$/, 'Please provide a valid wallet address'],
      },
      documentUrl: { // Verification document
        type: String,
        required: function() { return this.role === 'NGO'; }
      },
      verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not_required'],
        default: function() { return this.role === 'NGO' ? 'pending' : 'not_required'; }
      },
      // --- NEW NGO Profile Fields ---
      ngoName: {
          type: String,
          trim: true,
          maxlength: [100, 'NGO name cannot exceed 100 characters'],
          // Optional: Make required only for approved NGOs?
          // required: function() { return this.role === 'NGO' && this.verificationStatus === 'approved'; }
      },
      ngoDescription: {
          type: String,
          trim: true,
          maxlength: [1000, 'NGO description cannot exceed 1000 characters'],
      },
      ngoLogoUrl: { // Stores the path/URL to the uploaded logo
          type: String,
      },
      // --- End NGO Profile Fields ---
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }, { timestamps: true }); // Use timestamps option for createdAt/updatedAt

    // --- Mongoose Middleware ---
    // Hash password before saving
    UserSchema.pre('save', async function (next) {
      if (!this.isModified('password')) return next();
      try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
      } catch (error) {
        next(error);
      }
    });

    // --- Mongoose Instance Methods ---
    // Compare entered password with hashed password
    UserSchema.methods.matchPassword = async function (enteredPassword) {
      // Ensure password field was selected if needed (it's select: false by default)
      if (!this.password) {
         // Re-fetch user with password if not present (shouldn't happen if called after fetching with +password)
         const userWithPassword = await mongoose.model('User').findById(this._id).select('+password');
         if (!userWithPassword || !userWithPassword.password) return false;
         return await bcrypt.compare(enteredPassword, userWithPassword.password);
      }
      return await bcrypt.compare(enteredPassword, this.password);
    };

    // Create and export the User model
    const User = mongoose.model('User', UserSchema);

    module.exports = User;
    