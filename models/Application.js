const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  role: { type: String, required: true },
  location: { type: String },
  jobType: { type: String, enum: ['Internship', 'Full-Time', 'Part-Time', 'Contract', 'Freelance', 'Remote', 'Hybrid'] },
  salary: { type: String },
  applicationDate: { type: Date, required: true },
  status: { type: String, enum: ['Applied', 'Interview', 'Rejected', 'Offer', 'Ghosted'] },
  source: { type: String },
  contactPerson: { type: String },
  notes: { type: String },
  followUpDate: { type: Date },
  resumeVersion: { type: String },
  compensation: {
    base: { type: Number, default: 0 },
    equity: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    stipend: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  timeline: [{
    status: { type: String },
    date: { type: Date, default: Date.now },
    note: { type: String }
  }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
