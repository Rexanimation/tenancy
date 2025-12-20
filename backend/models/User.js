import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['admin', 'renter'],
    default: 'renter',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  unit: {
    type: String,
    default: '',
  },
  rentAmount: {
    type: Number,
    default: 0,
  },
  electricityRate: {
    type: Number,
    default: 0,
  },
  municipalFee: {
    type: Number,
    default: 0,
  },
  parkingCharges: {
    type: Number,
    default: 0,
  },
  electricityUnits: {
    type: Number,
    default: 0,
  },
  penalties: {
    type: Number,
    default: 0,
  },
  dues: {
    type: Number,
    default: 0,
  },
  advancePaid: {
    type: Number,
    default: 0,
  },
  upiId: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
