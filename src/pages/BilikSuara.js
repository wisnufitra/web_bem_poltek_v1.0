// src/pages/BilikSuara.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logActivity } from '../utils/logActivity';

const CountdownTimer = ({ targetDate }) => {
    const [countdown, setCountdown] = useState('');
    useEffect(() => {
        if (!targetDate) return;
        const interval = setInterval(() => {
            const now = new Date();
            const distance = new Date(targetDate) - now;
            if (distance < 0) {
                setCountdown("Waktu telah berakhir.");
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
    return <p style={{ margin: 0, fontWeight: 'bold' }}>Sisa Waktu: {countdown}</p>;
};

const BilikSuara = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [user, setUser] = useState(null);
    const [voterInfo, setVoterInfo] = useState(null);
    
    const [showVisiMisiModal, setShowVisiMisiModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [votedSuccessfully, setVotedSuccessfully] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, currentUser => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                navigate('/login-pemilih');
            }
        });
        
        const eventDocRef = doc(db, 'pemilihan_events', eventId);
        const unsubscribeEvent = onSnapshot(eventDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const eventData = { id: docSnap.id, ...docSnap.data() };
                setEvent(eventData);
                if (auth.currentUser && eventData.pemilih) {
                    const currentVoter = eventData.pemilih.find(p => p.email === auth.currentUser.email);
                    setVoterInfo(currentVoter);
                }
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeEvent();
        };
    }, [eventId, navigate]);

    useEffect(() => {
        if (votedSuccessfully) {
            const timer = setTimeout(() => {
                navigate('/dashboard-pemilih');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [votedSuccessfully, navigate]);

    const handleVote = async () => {
        setShowConfirmModal(false);
        setLoading(true);
        const eventDocRef = doc(db, 'pemilihan_events', eventId);
        
        const updatedKandidat = selectedCandidate.id !== 'abstain' 
            ? event.kandidat.map(k => 
                k.id === selectedCandidate.id ? { ...k, suara: (k.suara || 0) + 1 } : k
              )
            : event.kandidat;

        const updatedPemilih = event.pemilih.map(p => 
            p.email === user.email ? { ...p, sudahMemilih: true } : p
        );

        try {
            await updateDoc(eventDocRef, {
                kandidat: updatedKandidat,
                pemilih: updatedPemilih
            });
            await logActivity(`Memberikan suara di event "${event.namaEvent}"`);
            setVotedSuccessfully(true);
        } catch (error) {
            console.error("Gagal menyimpan suara:", error);
            alert("Terjadi kesalahan saat menyimpan suara Anda.");
            setLoading(false);
        }
    };

    const containerStyle = { maxWidth: '1000px', margin: '40px auto', padding: '20px' };
    const candidateGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' };
    const candidateCardStyle = { border: '3px solid #eee', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease-in-out' };
    const selectedCandidateStyle = { ...candidateCardStyle, borderColor: '#004d40', boxShadow: '0 0 15px rgba(0,77,64,0.3)', transform: 'scale(1.05)' };
    const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 };
    const modalContentStyle = { backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "500px", maxHeight: '90vh', overflowY: 'auto' };

    if (loading) return <p style={{textAlign: 'center'}}>Memuat bilik suara...</p>;
    if (!event || !voterInfo || voterInfo.statusVerifikasi !== 'terverifikasi') {
        return <p style={{textAlign: 'center'}}>Pemilihan tidak ditemukan atau Anda tidak memiliki hak untuk memilih di event ini.</p>;
    }
    
    if (voterInfo.sudahMemilih || votedSuccessfully) {
        return (
            <div style={containerStyle}>
                <div style={{textAlign: 'center', backgroundColor: '#f0fff4', padding: '40px', borderRadius: '12px'}}>
                    <h1 style={{color: 'green'}}>Terima Kasih!</h1>
                    <p>Suara Anda telah berhasil direkam. Terima kasih atas partisipasi Anda dalam {event.namaEvent}.</p>
                    <p>Anda akan diarahkan kembali ke dashboard...</p>
                </div>
            </div>
        );
    }
    
    if (event.status !== 'berlangsung') return <div style={containerStyle}><h1 style={{textAlign: 'center'}}>Voting Ditutup</h1><p style={{textAlign: 'center'}}>Sesi voting untuk pemilihan ini belum dibuka atau sudah ditutup.</p></div>;

    return (
        <div style={containerStyle}>
            <h1 style={{ color: '#004d40', textAlign: 'center' }}>{event.namaEvent}</h1>
            <div style={{textAlign: 'center', marginBottom: '20px', padding: '10px', backgroundColor: '#eee', borderRadius: '8px'}}>
                <p style={{margin: 0}}>Anda login sebagai: <strong>{voterInfo.nama}</strong> ({user.email})</p>
                <CountdownTimer targetDate={event.jadwalSelesai} />
            </div>
            <p style={{textAlign: 'center'}}>Silakan pilih salah satu kandidat di bawah ini.</p>
            
            <div style={candidateGridStyle}>
                {event.kandidat.map(k => (
                    <div 
                        key={k.id} 
                        style={selectedCandidate?.id === k.id ? selectedCandidateStyle : candidateCardStyle}
                        onClick={() => setSelectedCandidate(k)}
                    >
                        <img src={k.fotoUrl} alt={k.nama} style={{width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover'}} />
                        <h3 style={{marginTop: '15px'}}>{k.nama}</h3>
                        <button onClick={(e) => {e.stopPropagation(); setShowVisiMisiModal(true); setSelectedCandidate(k);}} style={{padding: '5px 10px', background: '#eee', border: '1px solid #ddd', borderRadius: '6px'}}>Lihat Visi & Misi</button>
                    </div>
                ))}
                {event.allowAbstain && (
                    <div 
                        key="abstain" 
                        style={selectedCandidate?.id === 'abstain' ? selectedCandidateStyle : candidateCardStyle}
                        onClick={() => setSelectedCandidate({ id: 'abstain', nama: 'Abstain (Kotak Kosong)'})}
                    >
                        <div style={{width: '150px', height: '150px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto'}}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                        </div>
                        <h3 style={{marginTop: '15px'}}>Abstain</h3>
                        <p style={{fontSize: '14px', color: '#666'}}>Pilih ini jika Anda tidak ingin memilih kandidat manapun.</p>
                    </div>
                )}
            </div>

            <div style={{textAlign: 'center', marginTop: '40px'}}>
                <button 
                    onClick={() => setShowConfirmModal(true)} 
                    disabled={!selectedCandidate}
                    style={{padding: '15px 30px', fontSize: '18px', backgroundColor: selectedCandidate ? 'green' : 'grey', color: 'white', border: 'none', borderRadius: '8px', cursor: selectedCandidate ? 'pointer' : 'not-allowed'}}
                >
                    Kirim Suara
                </button>
            </div>

            {showVisiMisiModal && selectedCandidate && (
                 <div style={modalOverlayStyle} onClick={() => setShowVisiMisiModal(false)}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{color: '#004d40'}}>{selectedCandidate.nama}</h2>
                        <h4 style={{borderBottom: '1px solid #ddd', paddingBottom: '5px'}}>Visi & Misi</h4>
                        <p style={{whiteSpace: 'pre-wrap', textAlign: 'left'}}>{selectedCandidate.visiMisi}</p>
                        <button onClick={() => setShowVisiMisiModal(false)} style={{padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', marginTop: '20px'}}>Tutup</button>
                    </div>
                </div>
            )}

            {showConfirmModal && selectedCandidate && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{color: '#004d40'}}>Konfirmasi Pilihan Anda</h2>
                        <p>Apakah Anda yakin ingin memilih kandidat berikut? Pilihan ini tidak dapat diubah.</p>
                        <div style={{textAlign: 'center', margin: '20px 0'}}>
                            {/* --- PERBAIKAN DI SINI --- */}
                            {selectedCandidate.id !== 'abstain' && selectedCandidate.fotoUrl && (
                                <img src={selectedCandidate.fotoUrl} alt={selectedCandidate.nama} style={{width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover'}} />
                            )}
                            <h3>{selectedCandidate.nama}</h3>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'center', gap: '15px'}}>
                            <button onClick={handleVote} style={{padding: '10px 20px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '6px'}}>Ya, Saya Yakin</button>
                            <button onClick={() => setShowConfirmModal(false)} style={{padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px'}}>Batal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BilikSuara;