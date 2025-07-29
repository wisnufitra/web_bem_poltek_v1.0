import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const DaftarPemilihan = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'pemilihan_events'), orderBy('dibuatPada', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const containerStyle = { maxWidth: '900px', margin: '40px auto', padding: '20px' };
    const titleStyle = { color: '#004d40', textAlign: 'center', marginBottom: '30px' };
    const buttonStyle = { display: 'inline-block', padding: '10px 20px', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' };
    const cardStyle = { border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px', textAlign: 'left' };
    const statusBadgeStyle = { padding: '5px 10px', borderRadius: '12px', color: 'white', fontWeight: 'bold', fontSize: '12px' };

    const getStatusComponent = (status) => {
        switch(status) {
            case 'berlangsung': return <span style={{...statusBadgeStyle, backgroundColor: 'green'}}>Berlangsung</span>;
            case 'selesai': return <span style={{...statusBadgeStyle, backgroundColor: 'red'}}>Selesai</span>;
            default: return <span style={{...statusBadgeStyle, backgroundColor: 'orange'}}>Setup</span>;
        }
    };

    return (
        <div style={containerStyle}>
            <h1 style={titleStyle}>Portal E-Voting KM Poltek Nuklir</h1>
            <div style={{textAlign: 'center', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '40px'}}>
                <Link to="/login-pemilih" style={{...buttonStyle, backgroundColor: 'green'}}>Masuk Portal Pemilih</Link>
                <Link to="/register-pemilih" style={{...buttonStyle, backgroundColor: '#004d40'}}>Daftar sebagai Pemilih</Link>
                <Link to="/request-pemilihan" style={{...buttonStyle, backgroundColor: '#1e88e5'}}>Ajukan Permintaan Pemilihan</Link>
            </div>
            
            <h2 style={{...titleStyle, fontSize: '24px'}}>Daftar Event Pemilihan</h2>
            {loading ? <p>Memuat event...</p> : events.map(event => (
                <div key={event.id} style={cardStyle}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <h3>{event.namaEvent}</h3>
                        {getStatusComponent(event.status)}
                    </div>
                    <p><strong>Penyelenggara:</strong> {event.ormawa}</p>
                    {event.status === 'selesai' && event.publishResults && (
                        <Link to={`/hasil/${event.id}`} style={{...buttonStyle, backgroundColor: '#004d40'}}>Lihat Hasil</Link>
                    )}
                </div>
            ))}
        </div>
    );
};

export default DaftarPemilihan;