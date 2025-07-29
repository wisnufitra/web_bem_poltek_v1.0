import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const LoginPemilih = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                const voterDocRef = doc(db, "voters", user.uid);
                const docSnap = await getDoc(voterDocRef);

                if (docSnap.exists() && docSnap.data().isVerified === true) {
                    navigate('/dashboard-pemilih');
                } else {
                    await signOut(auth);
                    setError("Akun Anda belum diverifikasi oleh panitia atau tidak ditemukan.");
                }
            })
            .catch(err => {
                setError("Email atau password salah.");
            })
            .finally(() => setLoading(false));
    };

    const containerStyle = { maxWidth: '400px', margin: '80px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
    const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#004d40', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
    const linkStyle = { color: '#004d40', fontWeight: 'bold' };

    return (
        <div style={containerStyle}>
            <h2 style={{ textAlign: 'center', color: '#004d40' }}>Portal Pemilih</h2>
            <p style={{textAlign: 'center', color: '#666'}}>Silakan login untuk menggunakan hak suara Anda.</p>
            <form onSubmit={handleLogin}>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Terdaftar" required />
                <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                <button type="submit" style={buttonStyle} disabled={loading}>{loading ? 'Memproses...' : 'Login'}</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                Belum punya akun pemilih? <Link to="/register-pemilih" style={linkStyle}>Daftar di sini</Link>
            </p>
        </div>
    );
};

export default LoginPemilih;