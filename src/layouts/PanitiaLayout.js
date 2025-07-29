// src/layouts/PanitiaLayout.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import { useParams, useNavigate, NavLink, Outlet } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const EventContext = createContext();
export const useEvent = () => useContext(EventContext);

const PanitiaLayout = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            if (!user) navigate('/login');
        });

        if (!eventId) {
            setLoading(false);
            return;
        }

        const eventDocRef = doc(db, 'pemilihan_events', eventId);
        const unsubscribeFirestore = onSnapshot(eventDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setEvent({ id: docSnap.id, ...docSnap.data() });
            } else {
                setEvent(null);
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeFirestore();
        };
    }, [eventId, navigate]);

    // --- Styles ---
    const containerStyle = { maxWidth: '1200px', margin: '40px auto', padding: '20px' };
    const navContainerStyle = { display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px', flexWrap: 'wrap' };
    
    // --- PERBAIKAN DI SINI ---
    const navLinkStyle = { 
        padding: '10px 20px', 
        textDecoration: 'none', 
        background: 'none', 
        cursor: 'pointer', 
        fontSize: '16px', 
        fontWeight: 'bold', 
        color: '#666',
        border: 'none', // Hapus border shorthand
        borderBottom: '3px solid transparent' // Gunakan border spesifik yang transparan
    };
    const activeNavLinkStyle = { 
        ...navLinkStyle, 
        color: '#004d40', 
        borderBottom: '3px solid #004d40' // Timpa border spesifik
    };

    if (loading) return <p style={{textAlign: 'center'}}>Memuat data event...</p>;
    if (!event) return <p style={{textAlign: 'center'}}>Event pemilihan tidak ditemukan.</p>;

    return (
        <EventContext.Provider value={{ event, eventId }}>
            <div style={containerStyle}>
                <h1 style={{ color: '#004d40', textAlign: 'center' }}>Dashboard Panitia</h1>
                <h2 style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>{event.namaEvent}</h2>

                <nav style={navContainerStyle}>
                    <NavLink to={`/panitia/${eventId}/ringkasan`} style={({isActive}) => isActive ? activeNavLinkStyle : navLinkStyle}>Ringkasan</NavLink>
                    <NavLink to={`/panitia/${eventId}/pengaturan`} style={({isActive}) => isActive ? activeNavLinkStyle : navLinkStyle}>Pengaturan</NavLink>
                    <NavLink to={`/panitia/${eventId}/kandidat`} style={({isActive}) => isActive ? activeNavLinkStyle : navLinkStyle}>Kelola Kandidat</NavLink>
                    <NavLink to={`/panitia/${eventId}/pemilih`} style={({isActive}) => isActive ? activeNavLinkStyle : navLinkStyle}>Kelola Pemilih Event</NavLink>
                    <NavLink to="/admin/kelola-pemilih-terdaftar" style={({isActive}) => isActive ? activeNavLinkStyle : navLinkStyle}>Verifikasi Akun Pemilih</NavLink>
                </nav>

                <main>
                    <Outlet />
                </main>
            </div>
        </EventContext.Provider>
    );
};

export default PanitiaLayout;