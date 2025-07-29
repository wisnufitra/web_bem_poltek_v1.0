import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const prodiOptions = ["Teknokimia Nuklir", "Elektronika Instrumentasi", "Elektromekanika"];

// Peta untuk validasi NIM
const prodiPrefixMap = {
    "Teknokimia Nuklir": "01",
    "Elektronika Instrumentasi": "02",
    "Elektromekanika": "03"
};

const RegisterPemilih = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [namaLengkap, setNamaLengkap] = useState('');
    const [nim, setNim] = useState('');
    const [prodi, setProdi] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // Validasi client-side
        if (!prodi) {
            return setError('Silakan pilih Program Studi Anda.');
        }
        if (nim.length !== 9 || !/^\d+$/.test(nim)) {
            return setError('NIM harus terdiri dari tepat 9 digit angka.');
        }
        const expectedPrefix = prodiPrefixMap[prodi];
        const nimPrefix = nim.substring(0, 2);
        if (expectedPrefix !== nimPrefix) {
            return setError(`NIM tidak sesuai dengan Program Studi yang dipilih. Awalan NIM untuk ${prodi} seharusnya ${expectedPrefix}.`);
        }

        setLoading(true);
        try {
            // --- VALIDASI BARU: Cek apakah NIM sudah ada di database ---
            const votersRef = collection(db, 'voters');
            const q = query(votersRef, where("nim", "==", nim));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setLoading(false);
                return setError('NIM ini sudah terdaftar. Silakan gunakan NIM lain atau hubungi panitia.');
            }
            // --- AKHIR VALIDASI BARU ---

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'voters', user.uid), {
                email: user.email,
                namaLengkap: namaLengkap,
                nim: nim,
                prodi: prodi,
                isVerified: false
            });

            await sendEmailVerification(user);
            alert('Registrasi berhasil! Akun Anda akan segera ditinjau oleh Panitia Pemilihan.');
            navigate('/login-pemilih');

        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                setError('Alamat email ini sudah terdaftar. Silakan gunakan email lain.');
            } else {
                setError('Gagal mendaftar. Pastikan password minimal 6 karakter.');
            }
        } finally {
            setLoading(false);
        }
    };

    const containerStyle = { maxWidth: '450px', margin: '40px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
    const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#004d40', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };

    return (
        <div style={containerStyle}>
            <h2 style={{ textAlign: 'center', color: '#004d40' }}>Registrasi Akun Pemilih</h2>
            <form onSubmit={handleRegister}>
                {error && <p style={{ color: 'red', textAlign: 'center', background: '#ffebee', padding: '10px', borderRadius: '6px' }}>{error}</p>}
                <input style={inputStyle} type="text" value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)} placeholder="Nama Lengkap Sesuai KTM" required />
                <input style={inputStyle} type="text" value={nim} onChange={(e) => setNim(e.target.value)} placeholder="NIM (Contoh: 012200001)" required />
                <select style={inputStyle} value={prodi} onChange={(e) => setProdi(e.target.value)} required>
                    <option value="" disabled>-- Pilih Program Studi --</option>
                    {prodiOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Mahasiswa Aktif" required />
                <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 karakter)" required />
                <button type="submit" style={buttonStyle} disabled={loading}>{loading ? 'Memproses...' : 'Buat Akun Pemilih'}</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                Sudah punya akun? <Link to="/login-pemilih" style={{ color: '#004d40' }}>Login di sini</Link>
            </p>
        </div>
    );
};

export default RegisterPemilih;