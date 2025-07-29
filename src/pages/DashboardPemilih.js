// ========================================================================
// --- 1. src/pages/DashboardPemilih.js (DIPERBARUI TOTAL) ---
// Tampilan dirombak total menjadi lebih canggih, informatif, dan fungsional.
// ========================================================================
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const CountdownTimer = ({ targetDate }) => {
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        if (!targetDate) return;

        const interval = setInterval(() => {
            const now = new Date();
            const distance = new Date(targetDate) - now;

            if (distance < 0) {
                setCountdown("Waktu voting telah berakhir.");
                clearInterval(interval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setCountdown(`${days}h ${hours}j ${minutes}m ${seconds}d`);
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return <p><strong>Sisa Waktu:</strong> {countdown}</p>;
};

const DashboardPemilih = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [voterProfile, setVoterProfile] = useState(null);
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);

                // Ambil profil pemilih dari koleksi 'voters'
                const voterDocRef = doc(db, "voters", currentUser.uid);
                const docSnap = await getDoc(voterDocRef);
                if (docSnap.exists()) {
                    setVoterProfile(docSnap.data());
                }
                
                const q = query(collection(db, 'pemilihan_events'));
                const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
                    const eventList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    const eligibleElections = eventList.filter(event => 
                        event.pemilih && event.pemilih.some(p => 
                            p.email === currentUser.email && 
                            p.statusVerifikasi === 'terverifikasi'
                        )
                    );

                    setElections(eligibleElections);
                    setLoading(false);
                });
                return () => unsubscribeFirestore();
            } else {
                navigate('/login-pemilih');
            }
        });
        return () => unsubscribeAuth();
    }, [navigate]);

    const handleLogout = () => {
        signOut(auth).then(() => navigate('/login-pemilih'));
    };
    
    const containerStyle = { maxWidth: '900px', margin: '40px auto', padding: '20px' };
    const cardStyle = { border: '1px solid #ddd', borderRadius: '12px', marginBottom: '20px', backgroundColor: '#fff', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', overflow: 'hidden' };
    const cardHeaderStyle = { padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
    const cardBodyStyle = { padding: '20px' };
    const cardFooterStyle = { padding: '15px 20px', backgroundColor: '#f9f9f9', borderTop: '1px solid #eee' };
    const announcementStyle = { backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '6px', padding: '15px', marginBottom: '20px' };
    const statusBadgeStyle = { padding: '5px 10px', borderRadius: '12px', color: 'white', fontWeight: 'bold', fontSize: '12px' };

    const getStatusComponent = (status) => {
        switch(status) {
            case 'berlangsung': return <span style={{...statusBadgeStyle, backgroundColor: 'green'}}>Berlangsung</span>;
            case 'selesai': return <span style={{...statusBadgeStyle, backgroundColor: 'red'}}>Selesai</span>;
            default: return <span style={{...statusBadgeStyle, backgroundColor: 'orange'}}>Akan Datang</span>;
        }
    };

    const renderActionButton = (event, hasVoted) => {
        if (hasVoted) {
            return <p style={{color: 'green', fontWeight: 'bold', margin: 0}}>Anda sudah memberikan suara.</p>;
        }
        switch (event.status) {
            case 'berlangsung':
                return <Link to={`/voting/${event.id}`} style={{textDecoration: 'none', padding: '10px 20px', backgroundColor: 'green', color: 'white', borderRadius: '6px'}}>Mulai Memilih</Link>;
            case 'setup':
                return <p style={{color: 'orange', fontWeight: 'bold', margin: 0}}>Pemilihan akan segera dimulai.</p>;
            case 'selesai':
                if (event.publishResults) {
                    return <Link to={`/hasil/${event.id}`} style={{textDecoration: 'none', padding: '10px 20px', backgroundColor: '#1e88e5', color: 'white', borderRadius: '6px'}}>Lihat Hasil</Link>;
                }
                return <p style={{color: 'red', fontWeight: 'bold', margin: 0}}>Pemilihan telah selesai.</p>;
            default:
                return null;
        }
    };

    return (
        <div style={containerStyle}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px'}}>
                <h1 style={{ color: '#004d40', margin: 0 }}>Dashboard Pemilih</h1>
                <button onClick={handleLogout} style={{backgroundColor: 'red', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px'}}>Logout</button>
            </div>
            <p>Selamat datang, <strong>{voterProfile?.namaLengkap || user?.email}</strong>. Berikut adalah pemilihan yang dapat Anda ikuti:</p>

            {loading ? <p>Mencari pemilihan...</p> : elections.map(event => {
                const voterInfo = event.pemilih.find(p => p.email === user.email);
                const hasVoted = voterInfo && voterInfo.sudahMemilih;

                return (
                    <div key={event.id} style={cardStyle}>
                        <div style={cardHeaderStyle}>
                            <h2 style={{margin: 0, fontSize: '20px'}}>{event.namaEvent}</h2>
                            {getStatusComponent(event.status)}
                        </div>
                        <div style={cardBodyStyle}>
                            {event.pengumuman && (
                                <div style={announcementStyle}>
                                    <strong>📢 Pengumuman Panitia:</strong>
                                    <p style={{margin: '5px 0 0'}}>{event.pengumuman.teks}</p>
                                </div>
                            )}
                            <p>{event.deskripsi}</p>
                        </div>
                        <div style={cardFooterStyle}>
                            {event.status === 'berlangsung' && !hasVoted && <CountdownTimer targetDate={event.jadwalSelesai} />}
                            {renderActionButton(event, hasVoted)}
                        </div>
                    </div>
                )
            })}
            {elections.length === 0 && !loading && <p>Saat ini tidak ada pemilihan aktif yang dapat Anda ikuti.</p>}
        </div>
    );
};

export default DashboardPemilih;
