import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Edit2, Check, X, Trash2 } from 'lucide-react';

const RoomConfig = () => {
    const [totalRooms, setTotalRooms] = useState('');
    const [capacity, setCapacity] = useState('3');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [rooms, setRooms] = useState([]);
    const [editingRoomId, setEditingRoomId] = useState(null);
    const [editName, setEditName] = useState('');

    const fetchRooms = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/rooms`);
            // Sort by room number roughly
            const sortedRooms = res.data.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
            setRooms(sortedRooms);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleSetup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/rooms/setup`, {
                totalRooms: Number(totalRooms),
                capacityPerRoom: Number(capacity)
            });
            setMessage(res.data.message);
            setTotalRooms('');
            fetchRooms(); // Refresh the list
        } catch (err) {
            setMessage('Error configuring rooms.');
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const handleRename = async (roomId) => {
        if (!editName || editName.trim() === '') return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/rooms/${roomId}/rename`, {
                newName: editName.trim()
            });
            setEditingRoomId(null);
            fetchRooms();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to rename room');
        }
    };

    const handleDelete = async (roomId, currentOccupancy) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/rooms/${roomId}`);
            fetchRooms();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete room');
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Room Configuration</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                {/* Generation Form */}
                <div className="glass-panel" style={{ padding: '32px', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Batch Create Rooms</h3>
                    <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        Generate a batch of sequentially numbered rooms (e.g., 101, 102). These will be appended to your existing rooms.
                    </p>

                    <form onSubmit={handleSetup}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db' }}>Total Rooms to Create</label>
                            <input
                                type="number"
                                className="input-glass"
                                value={totalRooms}
                                onChange={(e) => setTotalRooms(e.target.value)}
                                placeholder="e.g. 50"
                                required
                                min="1"
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db' }}>Capacity per Room</label>
                            <input
                                type="number"
                                className="input-glass"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                placeholder="e.g. 3"
                                required
                                min="1"
                            />
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || !totalRooms}>
                            {loading ? 'Processing...' : 'Generate New Rooms'}
                        </button>
                    </form>

                    {message && (
                        <div style={{ marginTop: '1.5rem', padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', textAlign: 'center' }}>
                            {message}
                        </div>
                    )}
                </div>

                {/* Rooms List */}
                <div className="glass-panel" style={{ padding: '32px' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Manage Existing Rooms
                        <span className="badge badge-success">{rooms.length} Total</span>
                    </h3>

                    {rooms.length === 0 ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>No rooms have been configured yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                            {rooms.map(room => (
                                <div key={room._id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                                    padding: '16px', background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                                }}>

                                    {editingRoomId === room._id ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
                                            <input
                                                type="text"
                                                className="input-glass"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                style={{ padding: '8px 12px', flex: 1 }}
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleRename(room._id)}
                                                style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--success)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                                                title="Save Rename"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => setEditingRoomId(null)}
                                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                                                title="Cancel"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{room.roomNumber}</span>
                                                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                                                    Capacity: <strong style={{ color: room.currentOccupancy >= room.capacity ? 'var(--danger)' : 'var(--success)' }}>{room.capacity - room.currentOccupancy} free</strong> / {room.capacity}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => {
                                                        setEditingRoomId(room._id);
                                                        setEditName(room.roomNumber);
                                                    }}
                                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                                                    title="Rename"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(room._id, room.currentOccupancy)}
                                                    style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--danger)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default RoomConfig;
