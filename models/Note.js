const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);
