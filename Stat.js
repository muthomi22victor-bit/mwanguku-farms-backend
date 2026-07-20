const mongoose = require('mongoose');

const statSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true, // e.g. 'healthy-birds', 'happy-customers'
      trim: true,
    },
    label: {
      type: String,
      required: [true, 'Label is required'], // e.g. "Healthy Birds"
      trim: true,
    },
    value: {
      type: Number,
      required: [true, 'Value is required'], // e.g. 500
      min: 0,
    },
    suffix: {
      type: String, // e.g. "+", "%"
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stat', statSchema);
