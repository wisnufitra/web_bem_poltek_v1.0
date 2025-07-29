// src/pages/HasilPemilihan.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
// --- 1. IMPORT BARU DARI LIBRARY YANG SUDAH DIINSTAL ---
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HasilPemilihan = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const eventDocRef = doc(db, 'pemilihan_events', eventId);
        const unsubscribe = onSnapshot(eventDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setEvent({ id: docSnap.id, ...docSnap.data() });
            } else {
                setEvent(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [eventId]);

    const containerStyle = { maxWidth: '900px', margin: '40px auto', padding: '20px', textAlign: 'center' };
    const cardStyle = { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };

    if (loading) return <p>Memuat hasil...</p>;
    if (!event || event.status !== 'selesai' || !event.publishResults) {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <h1>Hasil Belum Tersedia</h1>
                    <p>Hasil untuk pemilihan ini belum dipublikasikan oleh panitia atau sesi voting belum selesai.</p>
                    <Link to="/pemilihan" style={{ color: '#004d40', fontWeight: 'bold' }}>Kembali ke Daftar Pemilihan</Link>
                </div>
            </div>
        );
    }
    
    const sortedKandidat = [...(event.kandidat || [])].sort((a, b) => b.suara - a.suara);
    const totalSuaraMasuk = sortedKandidat.reduce((acc, curr) => acc + curr.suara, 0);

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h1 style={{color: '#004d40'}}>Hasil Resmi {event.namaEvent}</h1>
                <p>Total Suara Masuk: <strong>{totalSuaraMasuk}</strong></p>
                {sortedKandidat.length > 0 ? (
                    <div style={{width: '100%', height: 400, marginTop: '30px'}}>
                        <ResponsiveContainer>
                            <BarChart data={sortedKandidat} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="nama" width={150} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="suara" name="Total Suara" fill="#004d40" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : <p>Tidak ada data suara.</p>}
                 <Link to="/pemilihan" style={{display: 'inline-block', marginTop: '30px', color: '#004d40', fontWeight: 'bold'}}>Kembali ke Daftar Pemilihan</Link>
            </div>
        </div>
    );
};

export default HasilPemilihan;