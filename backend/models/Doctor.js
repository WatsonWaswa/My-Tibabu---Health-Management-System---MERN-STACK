import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialty: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  experience: {
    type: Number,
    default: 0
  },
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  certifications: [{
    name: String,
    issuingAuthority: String,
    year: Number
  }],
  languages: [{
    type: String
  }],
  consultationFee: {
    type: Number,
    default: 0
  },
  availability: {
    monday: { start: String, end: String, available: { type: Boolean, default: false } },
    tuesday: { start: String, end: String, available: { type: Boolean, default: false } },
    wednesday: { start: String, end: String, available: { type: Boolean, default: false } },
    thursday: { start: String, end: String, available: { type: Boolean, default: false } },
    friday: { start: String, end: String, available: { type: Boolean, default: false } },
    saturday: { start: String, end: String, available: { type: Boolean, default: false } },
    sunday: { start: String, end: String, available: { type: Boolean, default: false } }
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Doctor', doctorSchema); 