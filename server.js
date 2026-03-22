const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Application = require('./models/Application');
const { protect } = require('./middleware/auth');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected')).catch(err => console.log('MongoDB connection error:', err));

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ username, password });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.json({ token, username: user.username });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Applications Routes
app.post('/api/applications', protect, async (req, res) => {
    try {
        const body = { ...req.body, userId: req.user.id };
        if (!body.timeline || body.timeline.length === 0) {
            body.timeline = [{ status: body.status || 'Applied', date: new Date(), note: 'Application tracked' }];
        }
        const application = await Application.create(body);
        res.status(201).json(application);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/applications', protect, async (req, res) => {
    try {
        const applications = await Application.find({ userId: req.user.id }).sort({ applicationDate: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/applications/:id', protect, async (req, res) => {
    try {
        const application = await Application.findOne({ _id: req.params.id, userId: req.user.id });
        if (!application) return res.status(404).json({ message: 'Application not found' });
        res.json(application);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/applications/:id', protect, async (req, res) => {
    try {
        const application = await Application.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!application) return res.status(404).json({ message: 'Application not found' });
        res.json(application);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/applications/:id', protect, async (req, res) => {
    try {
        const application = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!application) return res.status(404).json({ message: 'Application not found' });
        res.json({ message: 'Application removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
