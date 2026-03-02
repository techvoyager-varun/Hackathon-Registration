import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, Home } from 'lucide-react';

const SearchRooms = () => {
    const [query, setQuery] = useState('');
    const [teams, setTeams] = useState([]);
    const [expandedTeams, setExpandedTeams] = useState({});

    const fetchTeams = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/teams`);
            setTeams(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTeams();
        const interval = setInterval(() => {
            fetchTeams();
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const toggleExpand = (teamId) => {
        setExpandedTeams(prev => ({
            ...prev,
            [teamId]: !prev[teamId]
        }));
    };

    // Filter by name if search is entered, otherwise show all checked-in or allocated teams
    const filteredTeams = teams.filter(team => {
        const matchesSearch = team.teamName.toLowerCase().includes(query.toLowerCase());
        // Only show teams that are scanned/checked-in
        return team.scanned && matchesSearch;
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Allocated Team Rooms</h1>

            <div className="glass-panel" style={{ padding: '24px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '12px', color: '#9ca3af' }} size={20} />
                        <input
                            type="text"
                            className="input-glass"
                            placeholder="Search by team name..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ paddingLeft: '48px' }}
                        />
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                {filteredTeams.length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem 0' }}>No checked-in teams found.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {filteredTeams.map((team, index) => {
                            const isExpanded = !!expandedTeams[team._id];
                            const allocatedMembers = team.members.filter(m => m.roomAllocated);
                            const fullyAllocated = allocatedMembers.length === team.members.length;

                            return (
                                <div key={team._id} style={{
                                    borderBottom: index !== filteredTeams.length - 1 ? '1px solid var(--card-border)' : 'none'
                                }}>
                                    <div
                                        onClick={() => toggleExpand(team._id)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '20px 24px', cursor: 'pointer',
                                            background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                                            transition: 'background 0.2s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', flex: 1, paddingRight: '12px' }}>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{team.teamName}</h3>
                                            <span className={`badge ${fullyAllocated ? 'badge-success' : 'badge-warning'}`}>
                                                {allocatedMembers.length} / {team.members.length} Allocated
                                            </span>
                                        </div>
                                        <div>
                                            {isExpanded ? <ChevronUp size={24} color="#9ca3af" /> : <ChevronDown size={24} color="#9ca3af" />}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{ padding: '0 24px 24px 24px', background: 'rgba(255,255,255,0.01)' }}>
                                                    <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                                                        {team.members.map((m, idx) => (
                                                            <div key={idx} style={{
                                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
                                                                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                                                            }}>
                                                                <span style={{ fontWeight: '500', color: '#e5e7eb' }}>{m.name}</span>
                                                                {m.roomAllocated ? (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 600 }}>
                                                                        <Home size={16} /> Room {m.roomAllocated}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Not Assigned</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SearchRooms;
