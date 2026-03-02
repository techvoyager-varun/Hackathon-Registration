const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  collegeName: { type: String, required: true },
  members: [{
    name: { type: String, required: true },
    roomAllocated: { type: String, default: null }
  }],
  qrCodeUrl: { type: String }, // Base64 QR code representation
  scanned: { type: Boolean, default: false },
  checkedInAt: { type: Date }
});

module.exports = mongoose.model('Team', teamSchema);
