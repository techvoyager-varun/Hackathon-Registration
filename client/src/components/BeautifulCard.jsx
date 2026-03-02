import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Home } from 'lucide-react';

const BeautifulCard = ({ team, onClose, onConfirm, loading }) => {
    if (!team) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '20px'
            }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 50 }}
                    className="beautiful-card"
                    style={{ width: '100%', maxWidth: '500px' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                            {team.teamName}
                        </h2>
                        <p style={{ color: '#9ca3af', fontSize: '1.2rem' }}>{team.collegeName}</p>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '2rem' }}>
                        <h4 style={{ color: '#9ca3af', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>
                            Team Members
                        </h4>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {team.members.map((m, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <span style={{ fontWeight: '500', fontSize: '1.1rem' }}>{m.name}</span>
                                    {m.roomAllocated && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600 }}>
                                            <Home size={16} /> Room {m.roomAllocated}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {team.scanned ? (
                        <div style={{ textAlign: 'center', color: 'var(--success)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 600 }}>
                            <CheckCircle /> Check-in Completed
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '16px', marginTop: '2rem', flexWrap: 'wrap' }}>
                            <button onClick={onClose} className="btn-primary" style={{ flex: '1 1 120px', background: 'rgba(255,255,255,0.1)', color: 'white', boxShadow: 'none' }}>
                                Cancel
                            </button>
                            <button onClick={onConfirm} disabled={loading} className="btn-primary" style={{ flex: '2 1 200px', justifyContent: 'center' }}>
                                {loading ? 'Confirming...' : 'Confirm Check-in'}
                            </button>
                        </div>
                    )}

                    {team.scanned && (
                        <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            Close & Next Scan
                        </button>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BeautifulCard;
