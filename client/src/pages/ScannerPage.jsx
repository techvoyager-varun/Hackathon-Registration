import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { motion } from 'framer-motion';
import BeautifulCard from '../components/BeautifulCard';

const ScannerPage = () => {
    const [scanResult, setScanResult] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [scannerKey, setScannerKey] = useState(0);

    useEffect(() => {
        let scanner = null;

        // We use a small timeout to bypass React 18 Strict Mode's double-mount bug
        // This guarantees only one scanner starts.
        const timer = setTimeout(() => {
            scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );
            scanner.render(onScanSuccess, onScanFailure);
        }, 100);

        function onScanSuccess(decodedText) {
            try {
                const data = JSON.parse(decodedText);
                if (data.teamId) {
                    setScanResult(prev => {
                        // Prevent fetching multiple times for the same scan
                        if (prev !== decodedText) {
                            fetchTeamDetails(data.teamId);
                            // Clean up the scanner once we have a valid team ID
                            if (scanner) {
                                scanner.clear().catch(err => console.error(err));
                                scanner = null;
                            }
                            return decodedText;
                        }
                        return prev;
                    });
                }
            } catch (err) {
                // Silently fail if not matching format
            }
        }

        function onScanFailure(error) {
            // Silently retry
        }

        return () => {
            clearTimeout(timer);
            if (scanner) {
                scanner.clear().catch(error => console.error("Failed to clear scanner", error));
            }
        };
    }, [scannerKey]);

    const fetchTeamDetails = async (teamId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/teams`);
            const team = res.data.find(t => t._id === teamId);
            if (team) {
                setTeamData(team);
            } else {
                setError('Team not found in database.');
            }
        } catch (err) {
            setError('Error fetching team details.');
        }
    };

    const handleConfirm = async () => {
        if (!teamData) return;
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/checkin`, { teamId: teamData._id });
            setTeamData(res.data.team);
            setError('');
            // We do not wait for allocation anymore, it is handled on the dashboard.
        } catch (err) {
            setError(err.response?.data?.error || 'Error during check-in');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTeamData(null);
        setScanResult(null);
        setError('');
        // Re-mount the scanner explicitly instead of doing a full browser page reload
        setScannerKey(prev => prev + 1);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>QR Check-In Scanner</h1>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div className="glass-panel" style={{ padding: '24px', flex: '1 1 400px', maxWidth: '600px' }}>
                    <div key={scannerKey} id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}></div>
                    {error && <p style={{ color: 'var(--danger)', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
                </div>

                <div className="glass-panel" style={{ padding: '24px', flex: '1 1 300px' }}>
                    <h3>Instructions</h3>
                    <ul style={{ color: '#9ca3af', marginTop: '1rem', lineHeight: '1.8', paddingLeft: '20px' }}>
                        <li>Point the camera at the team's QR Code.</li>
                        <li>Ensure good lighting.</li>
                        <li>Upon successful scan, a card will appear with team details.</li>
                        <li>Verify the members and click Confirm to assign accommodations.</li>
                    </ul>
                </div>
            </div>

            {teamData && (
                <BeautifulCard
                    team={teamData}
                    loading={loading}
                    onConfirm={handleConfirm}
                    onClose={handleClose}
                />
            )}
        </motion.div>
    );
};

export default ScannerPage;
