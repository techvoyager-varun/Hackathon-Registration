const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const Team = require('./models/Team');
const Room = require('./models/Room');
const User = require('./models/User');

dotenv.config();
connectDB();

const app = express();
app.use(cors({
    origin: process.env.CLIENT_URL || '*', // Allow frontend Vercel URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // Crucial for cookies/tokens if passed
}));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Auth Middleware (simple verification)
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: 'User already exists' });

        user = new User({ email, password });
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, user: { email: user.email, isAdmin: user.isAdmin } });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, user: { email: user.email, isAdmin: user.isAdmin } });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Upload CSV and Process Teams
app.post('/api/upload', upload.single('file'), (req, res) => {
    const results = [];
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                let processedCount = 0;
                for (const row of results) {
                    // Assuming CSV has: Team Name, Team College, Member 1, Member 2, Member 3
                    const teamName = row['Team Name'] || row.teamName;
                    const collegeName = row['Team College'] || row.collegeName || row.college;

                    if (!teamName) continue;

                    // Extract members
                    const members = [];
                    for (let i = 1; i <= 5; i++) {
                        const memberName = row[`Member ${i}`] || row[`Member ${i} Name`];
                        if (memberName) {
                            members.push({ name: memberName });
                        }
                    }

                    if (members.length === 0) continue;

                    let team = await Team.findOne({ teamName });
                    if (!team) {
                        team = new Team({ teamName, collegeName, members });
                        await team.save();

                        // Generate QR Code containing the team ID
                        const qrData = JSON.stringify({ teamId: team._id, teamName: team.teamName });
                        const qrCodeUrl = await QRCode.toDataURL(qrData);

                        team.qrCodeUrl = qrCodeUrl;
                        await team.save();
                        processedCount++;
                    }
                }

                // Clean up uploaded file
                fs.unlinkSync(req.file.path);

                res.json({ message: 'CSV processed successfully', processedCount });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Server error processing CSV' });
            }
        });
});

// Get all teams
app.get('/api/teams', async (req, res) => {
    try {
        const teams = await Team.find();
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Setup Initial Rooms
app.post('/api/rooms/setup', async (req, res) => {
    try {
        const { totalRooms, capacityPerRoom = 3 } = req.body;

        const existingRooms = await Room.find();
        const existingNames = new Set(existingRooms.map(r => r.roomNumber));

        const rooms = [];
        let counter = 101;

        for (let i = 1; i <= totalRooms; i++) {
            while (existingNames.has(counter.toString())) {
                counter++;
            }
            rooms.push({ roomNumber: counter.toString(), capacity: capacityPerRoom });
            existingNames.add(counter.toString());
        }

        await Room.insertMany(rooms);
        res.json({ message: `${totalRooms} rooms created successfully.` });
    } catch (err) {
        res.status(500).json({ error: 'Server error parsing rooms' });
    }
});

// Scan & Check-In a Team
app.post('/api/checkin', async (req, res) => {
    try {
        const { teamId } = req.body;
        const team = await Team.findById(teamId);

        if (!team) return res.status(404).json({ error: 'Team not found' });
        if (team.scanned) {
            return res.status(400).json({ error: 'Team already checked in', team });
        }

        // Auto-allocation logic removed. Just mark as scanned.
        team.scanned = true;
        team.checkedInAt = new Date();
        await team.save();

        res.json({ message: 'Team successfully checked in. Proceed to dashboard for manual room allocation.', team });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during check-in' });
    }
});

// Allocate Room Manually
app.post('/api/allocate-room', async (req, res) => {
    try {
        const { teamId, roomId } = req.body;

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        const room = await Room.findById(roomId);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        const availableCapacity = room.capacity - room.currentOccupancy;
        if (availableCapacity <= 0) {
            return res.status(400).json({ error: 'Room is already full completely.' });
        }

        let allocatedCount = 0;

        // Assign unallocated members up to the available capacity (in array order)
        for (let i = 0; i < team.members.length; i++) {
            if (!team.members[i].roomAllocated && allocatedCount < availableCapacity) {
                team.members[i].roomAllocated = room.roomNumber;
                room.allocatedMembers.push({
                    teamId: team._id,
                    teamName: team.teamName,
                    memberName: team.members[i].name
                });
                allocatedCount++;
            }
        }

        if (allocatedCount > 0) {
            room.currentOccupancy += allocatedCount;
            await room.save();
            await team.save();
        }

        res.json({ message: `Successfully allocated ${allocatedCount} members to room ${room.roomNumber}`, team, room });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during allocation' });
    }
});

// Search Rooms by Team Name
app.get('/api/rooms/search', async (req, res) => {
    try {
        const { teamName } = req.query;
        if (!teamName) return res.status(400).json({ error: 'Team name query required' });

        const rooms = await Room.find({ 'allocatedMembers.teamName': new RegExp(teamName, 'i') });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: 'Server error search rooms' });
    }
});

// Get all rooms
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Rename a Room
app.put('/api/rooms/:id/rename', async (req, res) => {
    try {
        const { id } = req.params;
        const { newName } = req.body;

        if (!newName || newName.trim() === '') {
            return res.status(400).json({ error: 'New room name is required' });
        }

        const room = await Room.findById(id);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        // Check if another room already has this name
        const existing = await Room.findOne({ roomNumber: newName, _id: { $ne: id } });
        if (existing) {
            return res.status(400).json({ error: 'A room with this name already exists' });
        }

        // We also need to update the historically saved string references inside the Teams array!
        // But for simplicity of query, any allocated members already have the old string
        // We'll update the Room properties. 
        // We will ALSO update the Team members directly so UI updates gracefully across the board.
        const oldName = room.roomNumber;
        room.roomNumber = newName;
        await room.save();

        // Update Teams members who were allocated this old room name
        await Team.updateMany(
            { 'members.roomAllocated': oldName },
            { $set: { 'members.$[elem].roomAllocated': newName } },
            { arrayFilters: [{ 'elem.roomAllocated': oldName }] }
        );

        res.json({ message: 'Room renamed successfully', room });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error renaming room' });
    }
});

// Delete a Room
app.delete('/api/rooms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findById(id);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        const roomNumber = room.roomNumber;

        await Room.findByIdAndDelete(id);

        // Deallocate any team members who were assigned to this room
        await Team.updateMany(
            { 'members.roomAllocated': roomNumber },
            { $set: { 'members.$[elem].roomAllocated': null } },
            { arrayFilters: [{ 'elem.roomAllocated': roomNumber }] }
        );

        res.json({ message: 'Room deleted successfully, and associated members deallocated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting room' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
