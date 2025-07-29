// src/pages/RegisterPanitia.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const RegisterPanitia = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [namaLengkap, setNamaLengkap] = useState('');
    const [ormawa, setOrmawa] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                namaTampilan: namaLengkap,
                kementerian: ormawa, // Menggunakan field kementerian untuk nama Ormawa
                role: 'pending_panitia',
                foto: ''
            });

            alert('Registrasi Panitia berhasil! Akun Anda akan segera ditinjau oleh Master Admin BEM.');
            navigate('/login');

        } catch (error) {
            console.error("Registration error:", error);
            setError('Gagal mendaftar. Pastikan email belum terdaftar dan password minimal 6 karakter.');
        } finally {
            setLoading(false);
        }
    };

    // --- Styles Diperbarui ---
    const containerStyle = { maxWidth: '450px', margin: '40px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
    const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#00092f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
    const linkStyle = { color: '#00092f', fontWeight: 'bold' };

    return (
        <div style={containerStyle}>
            <h2 style={{ textAlign: 'center', color: '#00092f' }}>Registrasi Panitia E-Voting</h2>
            <form onSubmit={handleRegister}>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                <input style={inputStyle} type="text" value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)} placeholder="Nama Lengkap Penanggung Jawab" required />
                <input style={inputStyle} type="text" value={ormawa} onChange={(e) => setOrmawa(e.target.value)} placeholder="Nama Ormawa (Contoh: HIMAFI)" required />
                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Resmi" required />
                <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 karakter)" required />
                <button type="submit" style={buttonStyle} disabled={loading}>{loading ? 'Memproses...' : 'Daftar sebagai Panitia'}</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                Sudah punya akun? <Link to="/login" style={linkStyle}>Login di sini</Link>
            </p>
        </div>
    );
};

export default RegisterPanitia;