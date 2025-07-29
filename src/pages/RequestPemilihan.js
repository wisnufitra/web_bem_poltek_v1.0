import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logActivity } from '../utils/logActivity';

const RequestPemilihan = () => {
    const navigate = useNavigate();
    const [ormawa, setOrmawa] = useState('');
    const [namaEvent, setNamaEvent] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [fileSuratUrl, setFileSuratUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                // Jika tidak ada user yang login, arahkan ke halaman login
                alert("Anda harus login sebagai perwakilan Ormawa untuk mengajukan permintaan.");
                navigate('/login');
            } else {
                setUser(currentUser);
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ormawa || !namaEvent || !fileSuratUrl) {
            setError('Nama Ormawa, Nama Pemilihan, dan Link Dokumen wajib diisi.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await addDoc(collection(db, 'pemilihan_requests'), {
                ormawa: ormawa,
                namaEvent: namaEvent,
                deskripsi: deskripsi,
                fileSuratUrl: fileSuratUrl,
                status: 'menunggu',
                diajukanPada: serverTimestamp(),
                diajukanOleh: user.email // Mencatat siapa yang mengajukan
            });

            await logActivity(`Pengajuan pemilihan baru dari "${ormawa}"`);

            setMessage('Permintaan berhasil diajukan! Silakan tunggu konfirmasi dari Master Admin BEM.');
            setOrmawa('');
            setNamaEvent('');
            setDeskripsi('');
            setFileSuratUrl('');

        } catch (err) {
            console.error("Error submitting request:", err);
            setError('Terjadi kesalahan saat mengirim permintaan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const containerStyle = { maxWidth: '600px', margin: '40px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
    const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#004d40', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };

    return (
        <div style={containerStyle}>
            <h1 style={{ color: '#004d40', textAlign: 'center' }}>Formulir Pengajuan Pemilihan</h1>
            <p style={{textAlign: 'center', color: '#666'}}>Isi formulir ini untuk mengajukan event pemilihan baru. Permintaan akan ditinjau oleh Master Admin BEM.</p>
            
            {message && <p style={{color: 'green', textAlign: 'center', fontWeight: 'bold'}}>{message}</p>}
            {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <input style={inputStyle} value={ormawa} onChange={(e) => setOrmawa(e.target.value)} placeholder="Nama Organisasi (Contoh: HIMAFI)" required />
                <input style={inputStyle} value={namaEvent} onChange={(e) => setNamaEvent(e.target.value)} placeholder="Nama Pemilihan (Contoh: Pemilihan Ketua HIMAFI 2025)" required />
                <textarea style={{...inputStyle, minHeight: '100px'}} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi singkat tentang pemilihan..." />
                <label>Link Dokumen Pengesahan (Google Drive):</label>
                <input type="url" style={inputStyle} value={fileSuratUrl} onChange={(e) => setFileSuratUrl(e.target.value)} placeholder="Tempel link di sini..." required />
                <button type="submit" style={buttonStyle} disabled={loading}>{loading ? 'Mengirim...' : 'Ajukan Permintaan'}</button>
            </form>
        </div>
    );
};

export default RequestPemilihan;