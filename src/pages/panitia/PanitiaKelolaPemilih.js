// src/pages/panitia/PanitiaKelolaPemilih.js
import React, { useState, useEffect, useMemo } from 'react';
import { useEvent } from '../../layouts/PanitiaLayout';
import { db } from '../../firebase/firebaseConfig';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { logActivity } from '../../utils/logActivity';

const prodiOptions = ["Semua", "Teknokimia Nuklir", "Elektronika Instrumentasi", "Elektromekanika"];

const PanitiaKelolaPemilih = () => {
    const { event, eventId } = useEvent();
    const [allVerifiedVoters, setAllVerifiedVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [prodiFilter, setProdiFilter] = useState('Semua');

    useEffect(() => {
        const q = query(collection(db, 'voters'), where("isVerified", "==", true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAllVerifiedVoters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const { pemilihDiEvent, pemilihTersedia } = useMemo(() => {
        const pemilihDiEventEmails = event.pemilih?.map(p => p.email) || [];
        const pemilihDiEvent = event.pemilih || [];
        
        const pemilihTersedia = allVerifiedVoters.filter(voter => 
            !pemilihDiEventEmails.includes(voter.email) &&
            (prodiFilter === 'Semua' || voter.prodi === prodiFilter) &&
            (voter.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) || voter.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        return { pemilihDiEvent, pemilihTersedia };
    }, [event.pemilih, allVerifiedVoters, searchTerm, prodiFilter]);

    // --- FUNGSI YANG DIPERBAIKI ---
    const handleTambahPemilihKeEvent = async (voter) => {
        const newPemilih = {
            id: voter.id,
            nama: voter.namaLengkap,
            email: voter.email,
            prodi: voter.prodi, // <-- PERBAIKAN DI SINI
            statusVerifikasi: 'terverifikasi',
            sudahMemilih: false
        };
        const eventDocRef = doc(db, 'pemilihan_events', eventId);
        await updateDoc(eventDocRef, { pemilih: [...(event.pemilih || []), newPemilih] });
        await logActivity(`Menambahkan pemilih ${voter.namaLengkap} ke event ${event.namaEvent}`);
    };

    const handleTambahSemua = async () => {
        if (pemilihTersedia.length === 0) return;
        if (window.confirm(`Yakin ingin menambahkan ${pemilihTersedia.length} pemilih hasil filter ke event ini?`)) {
            const pemilihBaru = pemilihTersedia.map(voter => ({
                id: voter.id,
                nama: voter.namaLengkap,
                email: voter.email,
                prodi: voter.prodi, // <-- PERBAIKAN DI SINI
                statusVerifikasi: 'terverifikasi',
                sudahMemilih: false
            }));
            const eventDocRef = doc(db, 'pemilihan_events', eventId);
            await updateDoc(eventDocRef, { pemilih: [...(event.pemilih || []), ...pemilihBaru] });
            await logActivity(`Menambahkan ${pemilihTersedia.length} pemilih ke event ${event.namaEvent}`);
        }
    };

    const handleHapusPemilihDariEvent = async (voterId) => {
        if (window.confirm("Yakin ingin menghapus pemilih dari event ini?")) {
            const pemilihDihapus = event.pemilih.find(p => p.id === voterId);
            const pemilihBaru = event.pemilih.filter(p => p.id !== voterId);
            const eventDocRef = doc(db, 'pemilihan_events', eventId);
            await updateDoc(eventDocRef, { pemilih: pemilihBaru });
            await logActivity(`Menghapus pemilih ${pemilihDihapus.nama} dari event ${event.namaEvent}`);
        }
    };

    const sectionStyle = { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
    const buttonStyle = { padding: '8px 12px', backgroundColor: '#004d40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' };
    const itemStyle = { borderBottom: '1px solid #ddd', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' };

    return (
        <div>
            <div style={sectionStyle}>
                <h3>Daftar Pemilih di Event Ini ({pemilihDiEvent.length})</h3>
                {pemilihDiEvent.map(p => (
                    <div key={p.id} style={itemStyle}>
                        <span><strong>{p.nama}</strong> ({p.email})</span>
                        <button onClick={() => handleHapusPemilihDariEvent(p.id)} style={{...buttonStyle, backgroundColor: 'red'}}>Hapus dari Event</button>
                    </div>
                ))}
            </div>
            <div style={sectionStyle}>
                <h3>Tambahkan Pemilih Terverifikasi</h3>
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px'}}>
                    <input style={{...inputStyle, flexGrow: 1, marginBottom: 0}} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari nama atau email..." />
                    <select style={{padding: '10px', borderRadius: '6px'}} value={prodiFilter} onChange={(e) => setProdiFilter(e.target.value)}>
                        {prodiOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <button onClick={handleTambahSemua} style={{...buttonStyle, backgroundColor: 'green', width: '100%', marginBottom: '20px'}}>+ Tambahkan Semua Hasil Filter ({pemilihTersedia.length})</button>
                {loading ? <p>Memuat...</p> : pemilihTersedia.map(voter => (
                    <div key={voter.id} style={itemStyle}>
                        <div>
                            <p style={{margin: 0}}><strong>{voter.namaLengkap}</strong> ({voter.nim})</p>
                            <small>{voter.prodi} - {voter.email}</small>
                        </div>
                        <button onClick={() => handleTambahPemilihKeEvent(voter)} style={{...buttonStyle, backgroundColor: '#1e88e5'}}>+ Tambahkan</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default PanitiaKelolaPemilih;