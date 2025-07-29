import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logActivity } from '../utils/logActivity';

const AdminMasterVoting = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            if (!user) navigate('/login');
            // Idealnya, cek juga apakah user adalah master admin
        });

        const qRequests = query(collection(db, 'pemilihan_requests'), orderBy('diajukanPada', 'desc'));
        const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeRequests();
        };
    }, [navigate]);

    const handleApproveRequest = async (request) => {
        if (!request || !request.id) return;
        if (!window.confirm(`Setujui pemilihan untuk "${request.namaEvent}"?`)) return;

        try {
            // 1. Buat event pemilihan baru
            const newEventRef = await addDoc(collection(db, 'pemilihan_events'), {
                namaEvent: request.namaEvent,
                deskripsi: request.deskripsi || "",
                ormawa: request.ormawa,
                status: 'setup',
                dibuatPada: serverTimestamp(),
                kandidat: [],
                pemilih: [],
                publishResults: false,
                allowAbstain: true,
            });

            // 2. Hapus permintaan yang sudah diproses
            await deleteDoc(doc(db, 'pemilihan_requests', request.id));

            await logActivity(`Menyetujui permintaan pemilihan "${request.namaEvent}"`);
            alert(`Pemilihan untuk "${request.namaEvent}" telah disetujui. Event baru telah dibuat dengan ID: ${newEventRef.id}. Berikan ID ini kepada panitia.`);
        } catch (error) {
            console.error("Gagal menyetujui permintaan:", error);
            alert("Terjadi kesalahan saat menyetujui permintaan.");
        }
    };
    
    const handleRejectRequest = async (id, ormawaName) => {
        if (!window.confirm(`Tolak permintaan pemilihan dari "${ormawaName}"?`)) return;
        
        await deleteDoc(doc(db, 'pemilihan_requests', id));
        await logActivity(`Menolak permintaan pemilihan dari "${ormawaName}"`);
    };

    const containerStyle = { maxWidth: '900px', margin: '40px auto', padding: '20px' };
    const cardStyle = { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px' };
    const buttonStyle = { border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', color: 'white', marginLeft: '10px' };

    return (
        <div style={containerStyle}>
            <h1 style={{ color: '#004d40', textAlign: 'center' }}>Kelola Permintaan E-Voting</h1>
            <p style={{textAlign: 'center', color: '#666'}}>Setujui atau tolak permintaan event pemilihan dari Ormawa.</p>
            
            <div style={{marginTop: '30px'}}>
                {loading ? <p>Memuat permintaan...</p> : requests.length === 0 ? <p style={{textAlign: 'center'}}>Tidak ada permintaan baru.</p> : (
                    requests.map(req => (
                        <div key={req.id} style={{...cardStyle, borderLeft: '5px solid orange'}}>
                            <h3>{req.namaEvent}</h3>
                            <p><strong>Ormawa:</strong> {req.ormawa}</p>
                            <p>{req.deskripsi}</p>
                            <a href={req.fileSuratUrl} target="_blank" rel="noopener noreferrer">Lihat Dokumen Pengesahan</a>
                            
                            <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee'}}>
                                <button onClick={() => handleApproveRequest(req)} style={{...buttonStyle, backgroundColor: 'green'}}>Setujui</button>
                                <button onClick={() => handleRejectRequest(req.id, req.ormawa)} style={{...buttonStyle, backgroundColor: 'red'}}>Tolak</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button onClick={() => navigate("/admin")} style={{ marginTop: "30px", padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px' }}>
                Kembali ke Dashboard Utama
            </button>
        </div>
    );
};

export default AdminMasterVoting;