import mongoose from 'mongoose';

const localityRateSchema = new mongoose.Schema({
  town: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  locality: {
    type: String,
    required: true,
  },
  electricityRate: {
    type: Number,
    required: true,
  }
}, {
  timestamps: true,
});

// Enforce unique combination of town, city, and locality
localityRateSchema.index({ town: 1, city: 1, locality: 1 }, { unique: true });

const LocalityRate = mongoose.model('LocalityRate', localityRateSchema);

export default LocalityRate;
