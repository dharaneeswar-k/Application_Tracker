const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    category: String,
    topic: { type: String, required: true },
    done: { type: Boolean, default: false }
});

const DaySchema = new mongoose.Schema({
    label: { type: String, required: true }, // e.g., "DAY 1"
    tasks: [TaskSchema]
});

const TimetableSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: String,
    days: [DaySchema],
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Timetable', TimetableSchema);
