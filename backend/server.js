// my-app-backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const projectRoutes = require('./routes/projectRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const donorRoutes = require('./routes/donorRoutes');
const donationRoutes = require('./routes/donationRoutes'); // 1. Import Donation routes

dotenv.config();
connectDB();
const app = express();

// --- Middleware ---
const allowedOrigins = ['http://localhost:3000', 'http://10.1.161.121:3000'];
const corsOptions = { /* ... CORS options ... */
    origin: function (origin, callback) { if (!origin || allowedOrigins.indexOf(origin) !== -1) callback(null, true); else callback(new Error('Not allowed by CORS')); }, optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/donations', donationRoutes); // 2. Mount Donation routes

// --- Basic Root Route ---
app.get('/', (req, res) => res.send('API is running...'));

// --- Error Handling Middleware ---
app.use((err, req, res, next) => { /* ... Error handling logic ... */
    if (err.message === 'Not allowed by CORS') { return res.status(403).json({ message: 'Access forbidden by CORS policy.' }); }
    if (err instanceof multer.MulterError) { console.error('Multer Error:', err); if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: `File too large. Max size is ${err.field === 'ngoLogo' ? '2MB' : '5MB'}.` }); return res.status(400).json({ message: `File Upload Error: ${err.message}` }); }
    if (err.message.includes('Invalid file type')) { console.error('File Type Error:', err.message); return res.status(400).json({ message: err.message }); }
    console.error('Unhandled Error:', err.stack); res.status(500).send('Something broke!');
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
