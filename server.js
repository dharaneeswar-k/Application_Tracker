const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Application = require('./models/Application');
const Todo = require('./models/Todo');
const Timetable = require('./models/Timetable');
const Note = require('./models/Note');
const { protect } = require('./middleware/auth');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB connection error:', err));

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

// ─── Todo Routes ────────────────────────────────────────────────────────────

app.post('/api/todos', protect, async (req, res) => {
    try {
        const todo = await Todo.create({ ...req.body, userId: req.user.id });
        res.status(201).json(todo);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.get('/api/todos', protect, async (req, res) => {
    try {
        const todos = await Todo.find({ userId: req.user.id })
            .sort({ pinned: -1, dueDate: 1, createdAt: -1 });
        res.json(todos);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/todos/:id', protect, async (req, res) => {
    try {
        const todo = await Todo.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!todo) return res.status(404).json({ message: 'Todo not found' });
        res.json(todo);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/todos/:id', protect, async (req, res) => {
    try {
        const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!todo) return res.status(404).json({ message: 'Todo not found' });
        res.json({ message: 'Todo removed' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Timetable Routes ──────────────────────────────────────────────────────

app.post('/api/timetables', protect, async (req, res) => {
    try {
        const timetable = await Timetable.create({ ...req.body, userId: req.user.id });
        res.status(201).json(timetable);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.get('/api/timetables', protect, async (req, res) => {
    try {
        const timetables = await Timetable.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(timetables);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/timetables/:id', protect, async (req, res) => {
    try {
        const timetable = await Timetable.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
        res.json(timetable);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/timetables/:id', protect, async (req, res) => {
    try {
        const timetable = await Timetable.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
        res.json({ message: 'Timetable removed' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ────────────────────────────────────────────────────────────────────────────

// Note Routes
app.post('/api/notes', protect, async (req, res) => {
    try {
        const note = await Note.create({ ...req.body, userId: req.user.id });
        res.status(201).json(note);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/notes', protect, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user.id }).sort({ isPinned: -1, updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notes/:id', protect, async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/notes/:id', protect, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
