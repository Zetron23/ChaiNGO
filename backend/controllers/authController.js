// my-app-backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// --- DUMMY ADMIN CREDENTIALS (For Demo Only - Use ENV variables in real apps!) ---
const DUMMY_ADMIN_EMAIL = process.env.DUMMY_ADMIN_EMAIL || 'admin@example.com';
const DUMMY_ADMIN_PASSWORD = process.env.DUMMY_ADMIN_PASSWORD || 'ansh1234';
// ---

// --- Helper Function ---
const generateToken = (id, role) => {
  // Use a consistent dummy ID for the dummy admin for token generation
  const userId = (id === 'dummy_admin_id' ? 'dummy_admin_id' : id);
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- Controller Functions ---

// Signup (No changes needed here, frontend will prevent Admin signup)
exports.signup = async (req, res) => {
    // ... (existing signup logic remains the same) ...
    // NOTE: The frontend changes will prevent this from being called with userType='Admin'

    const { email, password, walletAddress } = req.body;
    const { userType } = req.params;

    if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });
    const allowedRoles = ['Admin', 'Donor', 'NGO']; // Keep Admin here for backend validation just in case
    if (!allowedRoles.includes(userType)) return res.status(400).json({ message: 'Invalid user type specified' });
    if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return res.status(400).json({ message: 'Invalid wallet address format' });

    // Prevent Admin signup explicitly on backend too, even if frontend blocks it
    if (userType === 'Admin') {
        return res.status(403).json({ message: 'Admin signup is disabled.' });
    }

    let documentPath = null;
    if (userType === 'NGO') {
        if (!req.file) return res.status(400).json({ message: 'Verification document is required for NGO signup' });
        documentPath = `/uploads/${req.file.filename}`;
    }

    try {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ message: 'User already exists with this email' });
      if (walletAddress) {
          const walletExists = await User.findOne({ walletAddress: new RegExp(`^${walletAddress}$`, 'i') });
          if (walletExists) return res.status(400).json({ message: 'This wallet address is already linked' });
      }
      const newUser = {
          email, password, role: userType,
          verificationStatus: userType === 'NGO' ? 'pending' : 'not_required',
          documentUrl: userType === 'NGO' ? documentPath : undefined,
      };
      if (walletAddress) newUser.walletAddress = walletAddress;
      const user = await User.create(newUser);
      if (user) {
          if (userType === 'NGO') {
              return res.status(201).json({ message: 'NGO registration successful. Account pending admin approval.', _id: user._id, email: user.email, role: user.role });
          } else { // Donor
              res.status(201).json({ _id: user._id, email: user.email, role: user.role, walletAddress: user.walletAddress, token: generateToken(user._id, user.role) });
          }
      } else { res.status(400).json({ message: 'Invalid user data' }); }
    } catch (error) {
      console.error('Signup Error:', error);
      if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(val => val.message); return res.status(400).json({ message: messages.join(', ') }); }
      if (error.code === 11000) { const field = Object.keys(error.keyValue)[0]; return res.status(400).json({ message: `An account with this ${field} already exists.` }); }
      res.status(500).json({ message: 'Server error during signup' });
    }
};

// Signin with Email/Password (UPDATED for Dummy Admin)
exports.signin = async (req, res) => {
  const { email, password } = req.body;
  const { userType } = req.params;

  if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });
  const allowedRoles = ['Admin', 'Donor', 'NGO'];
  if (!allowedRoles.includes(userType)) return res.status(400).json({ message: 'Invalid user type' });

  // --- DUMMY ADMIN LOGIN CHECK ---
  if (userType === 'Admin' && email === DUMMY_ADMIN_EMAIL && password === DUMMY_ADMIN_PASSWORD) {
      console.log('Dummy Admin login successful');
      // Credentials match the dummy admin, bypass database check
      return res.json({
          _id: 'dummy_admin_id', // Use a consistent dummy ID
          email: DUMMY_ADMIN_EMAIL,
          role: 'Admin',
          walletAddress: undefined, // Dummy admin has no wallet linked here
          token: generateToken('dummy_admin_id', 'Admin'), // Generate token for dummy admin
      });
  }
  // --- END DUMMY ADMIN LOGIN CHECK ---

  // If not the dummy admin, proceed with normal database lookup
  try {
    const user = await User.findOne({ email }).select('+password +verificationStatus'); // Fetch status

    // Check user exists, role matches, password matches
    if (user && user.role === userType && (await user.matchPassword(password))) {
        // Check verification status for NGOs
        if (user.role === 'NGO' && user.verificationStatus !== 'approved') {
            return res.status(403).json({ message: `Your NGO account is currently ${user.verificationStatus}.` });
        }
        // Valid login for non-dummy users
        res.json({
            _id: user._id, email: user.email, role: user.role,
            walletAddress: user.walletAddress, token: generateToken(user._id, user.role),
        });
    } else {
        // Invalid credentials or role mismatch
        if (user && user.role !== userType) return res.status(401).json({ message: `Email registered as ${user.role}, not ${userType}` });
        return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Signin Error:', error);
    res.status(500).json({ message: 'Server error during signin' });
  }
};


// Signin with Wallet (UPDATED to block Admin)
exports.signinWithWallet = async (req, res) => {
  const { walletAddress } = req.body;
  const { userType } = req.params;

  // --- BLOCK ADMIN WALLET LOGIN ---
  if (userType === 'Admin') {
      return res.status(403).json({ message: 'Admin login via wallet is not supported.' });
  }
  // ---

  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return res.status(400).json({ message: 'Valid wallet address required' });
  const allowedRoles = ['Donor', 'NGO']; // Admin removed
  if (!allowedRoles.includes(userType)) return res.status(400).json({ message: 'Invalid user type for wallet signin' });

  try {
      const user = await User.findOne({
          walletAddress: new RegExp(`^${walletAddress}$`, 'i'),
          role: userType
      }).select('+verificationStatus'); // Fetch status

      if (user) {
          // Check verification status for NGOs
          if (user.role === 'NGO' && user.verificationStatus !== 'approved') {
              return res.status(403).json({ message: `Your NGO account is currently ${user.verificationStatus}.` });
          }
          // Valid wallet login
          res.json({
              _id: user._id, email: user.email, role: user.role,
              walletAddress: user.walletAddress, token: generateToken(user._id, user.role),
          });
      } else {
          return res.status(401).json({ message: 'Wallet address not found or not registered for this user type' });
      }
  } catch (error) {
      console.error('Wallet Signin Error:', error);
      res.status(500).json({ message: 'Server error during wallet signin' });
  }
};

