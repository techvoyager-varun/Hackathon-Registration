const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, default: 3 },
    currentOccupancy: { type: Number, default: 0 },
    allocatedMembers: [{
        teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        teamName: String,
        memberName: String
    }]
});

module.exports = mongoose.model('Room', roomSchema);
