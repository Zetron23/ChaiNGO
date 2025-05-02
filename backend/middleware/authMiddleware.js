// my-app-backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Middleware to protect routes requiring authentication
const protect = async (req, res, next) => {
  console.log(`PROTECT MIDDLEWARE: Request received for ${req.originalUrl}`); // <-- ADD LOG
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log("PROTECT MIDDLEWARE: Token found, verifying..."); // <-- ADD LOG
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("PROTECT MIDDLEWARE: Token verified, decoded ID:", decoded.id); // <-- ADD LOG

      // Handle Dummy Admin
      if (decoded.id === 'dummy_admin_id' && decoded.role === 'Admin') {
          req.user = { _id: 'dummy_admin_id', role: 'Admin', email: process.env.DUMMY_ADMIN_EMAIL || 'admin@example.com' };
          console.log('PROTECT MIDDLEWARE: Dummy admin authenticated.'); // <-- ADD LOG
          return next();
      }

      // Normal User Lookup
      console.log("PROTECT MIDDLEWARE: Looking up user ID:", decoded.id); // <-- ADD LOG
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
         console.log("PROTECT MIDDLEWARE: User not found in DB for token."); // <-- ADD LOG
         return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      console.log(`PROTECT MIDDLEWARE: User ${req.user.email} found and attached to request.`); // <-- ADD LOG
      next();

    } catch (error) {
      console.error('PROTECT MIDDLEWARE: Token verification failed:', error.name, error.message); // <-- ADD LOG
      if (error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Not authorized, invalid token' });
      if (error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Not authorized, token expired' });
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.log("PROTECT MIDDLEWARE: No token found in header."); // <-- ADD LOG
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to restrict routes to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log(`RESTRICT MIDDLEWARE: Checking role for user ${req.user?._id}, required: ${roles.join(',')}`); // <-- ADD LOG
    if (!req.user || !roles.includes(req.user.role)) {
      console.log(`RESTRICT MIDDLEWARE: Access denied. User role: ${req.user?.role}`); // <-- ADD LOG
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    console.log("RESTRICT MIDDLEWARE: Access granted."); // <-- ADD LOG
    next();
  };
};

module.exports = { protect, restrictTo };
