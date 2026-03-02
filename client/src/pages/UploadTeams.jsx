import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle, Share2, Eye } from 'lucide-react';

const UploadTeams = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState('');
    const [teams, setTeams] = useState([]);

    const fetchTeams = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/teams`);
            setTeams(res.data);
        } catch (err) {
            console.error('Error fetching teams', err);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(`Successfully processed ${res.data.processedCount} teams.`);
            setSuccess(true);
            setFile(null);
            fetchTeams(); // Refresh list after upload
        } catch (err) {
            setMessage('Error uploading file. Make sure it is a valid CSV.');
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async (team) => {
        if (!team.qrCodeUrl) return;

        try {
            // Convert Base64 data URL to Blob
            const response = await fetch(team.qrCodeUrl);
            const blob = await response.blob();
            const file = new File([blob], `${team.teamName}_QR.png`, { type: blob.type });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `${team.teamName} Check-in QR Code`,
                    text: `Here is the Check-in QR code for Team ${team.teamName}`,
                    files: [file]
                });
            } else {
                // Fallback for browsers that don't support file sharing
                const newWindow = window.open("");
                newWindow.document.write(`<img src="${team.qrCodeUrl}" alt="QR Code"/>`);
            }
        } catch (error) {
            console.error('Error sharing:', error);
            // Fallback
            const newWindow = window.open("");
            newWindow.document.write(`<img src="${team.qrCodeUrl}" alt="QR Code"/>`);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="upload-page">
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Participants Directory</h1>

            <div className="glass-panel" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto 2rem auto', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <UploadCloud size={64} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                    <h3>Upload Teams CSV</h3>
                    <p style={{ color: '#9ca3af', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        CSV must have columns: Team Name, Team College, Member 1, Member 2, etc.
                    </p>
                </div>

                <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="csv-upload"
                />
                <label htmlFor="csv-upload" className="btn-primary" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
                    Select CSV File
                </label>

                {file && <p style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Selected: {file.name}</p>}

                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', opacity: (!file || loading) ? 0.5 : 1 }}
                >
                    {loading ? 'Processing...' : 'Upload & Generate QR Codes'}
                </button>

                {message && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            marginTop: '1.5rem',
                            padding: '12px',
                            borderRadius: '8px',
                            background: success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: success ? 'var(--success)' : 'var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        {success && <CheckCircle size={18} />}
                        {message}
                    </motion.div>
                )}
            </div>

            {teams.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h2 style={{ marginBottom: '1.5rem' }}>Team QR Codes</h2>
                    <div className="table-responsive-wrapper">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Team Name</th>
                                    <th>Members Count</th>
                                    <th>QR Code</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map(team => (
                                    <tr key={team._id}>
                                        <td style={{ fontWeight: '600' }}>{team.teamName}</td>
                                        <td style={{ color: '#9ca3af' }}>{team.members.length}</td>
                                        <td>
                                            {team.qrCodeUrl ? (
                                                <img src={team.qrCodeUrl} alt="QR Code" style={{ width: '50px', height: '50px', borderRadius: '8px' }} />
                                            ) : 'N/A'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', boxShadow: 'none' }}
                                                    onClick={() => {
                                                        const newWindow = window.open("");
                                                        newWindow.document.write(`<img src="${team.qrCodeUrl}" alt="QR Code" style="width: 300px; padding: 20px;"/>`);
                                                    }}
                                                >
                                                    <Eye size={16} /> View
                                                </button>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                    onClick={() => handleShare(team)}
                                                >
                                                    <Share2 size={16} /> Share
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default UploadTeams;
