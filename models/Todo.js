const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    done: { type: Boolean, default: false }
}, { _id: true });

const TodoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
        type: String,
        enum: ['Job Prep', 'Interview', 'Networking', 'Learning', 'Personal', 'Other'],
        default: 'Other'
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    dueDate: { type: Date, default: null },
    completed: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    subtasks: [subtaskSchema]
}, { timestamps: true });

module.exports = mongoose.model('Todo', TodoSchema);
