// src/pages/Register.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const PasswordStrengthBar = ({ score }) => {
    const getBarColor = () => {
        if (score >= 80) return 'green';
        if (score >= 40) return 'orange';
        return 'red';
    };

    const getStrengthText = () => {
        if (score >= 80) return 'Sangat Kuat';
        if (score >= 60) return 'Kuat';
        if (score >= 40) return 'Cukup';
        return 'Lemah';
    };

    return (
        <div style={{marginTop: '-10px', marginBottom: '15px'}}>
            <div style={{ height: '5px', backgroundColor: '#e0e0e0', borderRadius: '5px' }}>
                <div style={{ height: '100%', width: `${score}%`, backgroundColor: getBarColor(), borderRadius: '5px', transition: 'width 0.3s ease' }} />
            </div>
            <p style={{ margin: '5px 0 0', fontSize: '12px', color: getBarColor(), textAlign: 'right' }}>
                Kekuatan: {getStrengthText()}
            </p>
        </div>
    );
};

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [namaTampilan, setNamaTampilan] = useState('');
    const [kementerian, setKementerian] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const kementerianOptions = [
        "Pengurus Harian", "Inspektorat Jenderal", "Sekretariat Jenderal", "Kementerian Keuangan",
        "Kementerian Dalam Negeri", "Kementerian Luar Negeri", "Kementerian Pemuda dan Olahraga (PORA)",
        "Kementerian PSDM", "Kementerian Komunikasi dan Informasi (KOMINFO)", "Kementerian Ekonomi Kreatif",
    ];

    useEffect(() => {
        let score = 0;
        if (password.length > 7) score += 20;
        if (/\d/.test(password)) score += 20;
        if (/[a-z]/.test(password)) score += 20;
        if (/[A-Z]/.test(password)) score += 20;
        if (/[^A-Za-z0-9]/.test(password)) score += 20;
        setPasswordStrength(score > 100 ? 100 : score);
    }, [password]);

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Password dan Konfirmasi Password tidak cocok.');
            return;
        }
        if (!kementerian) {
            setError('Silakan pilih kementerian/divisi Anda.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                namaTampilan: namaTampilan,
                kementerian: kementerian,
                role: 'pending',
                foto: ''
            });
            
            await sendEmailVerification(user);

            alert('Registrasi berhasil! Silakan verifikasi email Anda dan tunggu persetujuan dari Master Admin.');
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
    const passwordContainerStyle = { position: 'relative', display: 'flex', alignItems: 'center' };
    const passwordInputStyle = { ...inputStyle, paddingRight: '40px', marginBottom: 0 };
    const eyeIconStyle = { position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 };
    const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#00092f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
    const disabledButtonStyle = { ...buttonStyle, backgroundColor: '#ccc', cursor: 'not-allowed' };
    const linkStyle = { color: '#00092f', fontWeight: 'bold' };

    return (
        <div style={containerStyle}>
            <h2 style={{ textAlign: 'center', color: '#00092f' }}>Registrasi Admin BEM</h2>
            <form onSubmit={handleRegister}>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                <input style={inputStyle} type="text" value={namaTampilan} onChange={(e) => setNamaTampilan(e.target.value)} placeholder="Nama Lengkap" required />
                
                <select style={inputStyle} value={kementerian} onChange={(e) => setKementerian(e.target.value)} required>
                    <option value="" disabled>-- Pilih Kementerian/Divisi --</option>
                    {kementerianOptions.map(option => (<option key={option} value={option}>{option}</option>))}
                </select>

                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
                
                <div style={{...passwordContainerStyle, marginBottom: '5px'}}>
                    <input style={passwordInputStyle} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 karakter)" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeIconStyle}>
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                    </button>
                </div>
                <PasswordStrengthBar score={passwordStrength} />

                <div style={{...passwordContainerStyle, marginBottom: '15px'}}>
                    <input style={passwordInputStyle} type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Konfirmasi Password" required />
                </div>
                
                <div style={{ margin: '15px 0', display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ marginRight: '10px' }} />
                    <label htmlFor="terms" style={{ fontSize: '14px' }}>Saya menyetujui syarat & ketentuan.</label>
                </div>

                <button type="submit" style={!termsAccepted || loading ? disabledButtonStyle : buttonStyle} disabled={!termsAccepted || loading}>
                    {loading ? 'Memproses...' : 'Daftar'}
                </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                Sudah punya akun? <Link to="/login" style={linkStyle}>Login di sini</Link>
            </p>
        </div>
    );
};

export default Register;