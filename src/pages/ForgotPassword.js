import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Email untuk reset password telah dikirim! Silakan cek inbox Anda.');
        } catch (error) {
            console.error("Password reset error:", error);
            setError('Gagal mengirim email. Pastikan email yang Anda masukkan benar.');
        } finally {
            setLoading(false);
        }
    };
    
    const containerStyle = { maxWidth: '450px', margin: '40px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
    const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#004d40', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };

    return (
        <div style={containerStyle}>
            <h2 style={{ textAlign: 'center', color: '#004d40' }}>Lupa Password</h2>
            <form onSubmit={handleReset}>
                {message && <p style={{ color: 'green', textAlign: 'center' }}>{message}</p>}
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                <p style={{textAlign: 'center', color: '#666'}}>Masukkan email Anda untuk menerima link reset password.</p>
                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email terdaftar" required />
                <button type="submit" style={buttonStyle} disabled={loading}>{loading ? 'Mengirim...' : 'Kirim Link Reset'}</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/login" style={{ color: '#004d40' }}>Kembali ke Login</Link>
            </p>
        </div>
    );
};

export default ForgotPassword;