import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
    const [teams, setTeams] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [allocating, setAllocating] = useState(false);

    const fetchData = async () => {
        try {
            const [teamsRes, roomsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/teams`),
                axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/rooms`)
            ]);
            setTeams(teamsRes.data);
            setRooms(roomsRes.data);

            // If currently allocating, update the selected team to see if there are still unallocated members
            if (selectedTeam) {
                const updatedSelected = teamsRes.data.find(t => t._id === selectedTeam._id);
                // If it no longer has unallocated members, close the modal
                if (updatedSelected && !updatedSelected.members.some(m => !m.roomAllocated)) {
                    setSelectedTeam(null);
                } else {
                    setSelectedTeam(updatedSelected);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetchData();
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const checkedInCount = teams.filter(t => t.scanned).length;

    const handleAllocate = async () => {
        if (!selectedTeam || !selectedRoomId) return;
        setAllocating(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/allocate-room`, {
                teamId: selectedTeam._id,
                roomId: selectedRoomId
            });
            await fetchData();
            setSelectedRoomId('');
        } catch (err) {
            alert(err.response?.data?.error || 'Allocation error');
        } finally {
            setAllocating(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dashboard">
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Dashboard Overview</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ color: '#9ca3af', marginBottom: '8px' }}>Total Teams</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{teams.length}</p>
                </div>
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ color: '#9ca3af', marginBottom: '8px' }}>Checked In</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{checkedInCount}</p>
                </div>
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ color: '#9ca3af', marginBottom: '8px' }}>Total Rooms Configured</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{rooms.length}</p>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Recent Check-ins & Room Allocation</h2>
                <div className="table-responsive-wrapper">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Team Name</th>
                                <th>Members</th>
                                <th>Room Allocation Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.filter(t => t.scanned).length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                                        No teams have checked in yet.
                                    </td>
                                </tr>
                            ) : (
                                teams.filter(t => t.scanned).map(team => {
                                    const unallocatedMembers = team.members.filter(m => !m.roomAllocated);
                                    const allocatedCount = team.members.length - unallocatedMembers.length;
                                    const isFullyAllocated = unallocatedMembers.length === 0;

                                    return (
                                        <tr key={team._id}>
                                            <td style={{ fontWeight: '600' }}>{team.teamName}</td>
                                            <td>{team.members.map(m => m.name).join(', ')}</td>
                                            <td>
                                                <span className={`badge ${isFullyAllocated ? 'badge-success' : 'badge-warning'}`}>
                                                    {allocatedCount} / {team.members.length} Allocated
                                                </span>
                                            </td>
                                            <td>
                                                {!isFullyAllocated && (
                                                    <button
                                                        className="btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                        onClick={() => setSelectedTeam(team)}
                                                    >
                                                        Allocate Room
                                                    </button>
                                                )}
                                                {isFullyAllocated && (
                                                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Completed</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <AnimatePresence>
                    {selectedTeam && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000, padding: '20px'
                        }}>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="glass-panel"
                                style={{ width: '100%', maxWidth: '500px', padding: '32px' }}
                            >
                                <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Allocate Room for {selectedTeam.teamName}</h2>
                                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                                    Unallocated Members: {selectedTeam.members.filter(m => !m.roomAllocated).map(m => m.name).join(', ')}
                                </p>

                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db' }}>Select Available Room</label>
                                    <select
                                        className="input-glass"
                                        value={selectedRoomId}
                                        onChange={(e) => setSelectedRoomId(e.target.value)}
                                    >
                                        <option value="">-- Choose a Room --</option>
                                        {rooms.filter(r => r.currentOccupancy < r.capacity).map(room => (
                                            <option key={room._id} value={room._id}>
                                                Room {room.roomNumber} (Available: {room.capacity - room.currentOccupancy})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button onClick={() => setSelectedTeam(null)} className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', boxShadow: 'none' }}>
                                        Cancel
                                    </button>
                                    <button onClick={handleAllocate} disabled={allocating || !selectedRoomId} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                                        {allocating ? 'Allocating...' : 'Assign Room'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default Dashboard;
