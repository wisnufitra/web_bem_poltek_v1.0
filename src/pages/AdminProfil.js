// src/pages/AdminProfil.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig'; // Pastikan path ini benar
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const AdminProfil = () => {
  const navigate = useNavigate();
  const [namaTampilan, setNamaTampilan] = useState('');
  const [kementerian, setKementerian] = useState('');
  const [foto, setFoto] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Ambil data profil yang sudah ada dari Firestore
        const fetchProfil = async () => {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setNamaTampilan(data.namaTampilan || '');
            setKementerian(data.kementerian || '');
            setFoto(data.foto || ''); // Ambil foto dari database
          }
          setLoading(false);
        };
        fetchProfil();
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setFoto(compressedBase64); // Update state foto dengan hasil kompresi
      };
    };
  };

  const handleHapusFoto = () => {
    setFoto(''); // Kembalikan ke string kosong untuk menggunakan placeholder
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!user) return;
    setMessage('Menyimpan...');
    const docRef = doc(db, 'users', user.uid);
    try {
      await setDoc(docRef, {
        namaTampilan,
        kementerian,
        foto, // Simpan foto ke database
        email: user.email,
      }, { merge: true }); // merge: true agar tidak menimpa data lain
      setMessage('Profil berhasil diperbarui!');
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage('Gagal memperbarui profil.');
    }
  };

  if (loading) {
    return <p style={{textAlign: 'center', marginTop: '40px'}}>Memuat profil...</p>;
  }

  const containerStyle = { maxWidth: '600px', margin: '40px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
  const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
  const buttonStyle = { padding: '10px 20px', backgroundColor: '#004d40', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#004d40', textAlign: 'center' }}>Profil Admin</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>Informasi ini akan ditampilkan sebagai nama "Publikasi" atau "Editor" pada postingan berita.</p>
      <form onSubmit={handleSimpan}>
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <img src={foto || 'https://placehold.co/150x150/004d40/FFFFFF?text=Foto'} alt="Profil" style={{width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover'}} />
          <input type="file" accept="image/*" onChange={handleFotoChange} style={{display: 'block', margin: '10px auto'}}/>
          <button type="button" onClick={handleHapusFoto} style={{...buttonStyle, backgroundColor: '#f44336', fontSize: '12px', padding: '5px 10px'}}>Hapus Foto</button>
        </div>
        <div>
          <label>Email (tidak bisa diubah):</label>
          <input style={inputStyle} type="email" value={user.email} disabled />
        </div>
        <div>
          <label>Nama Tampilan:</label>
          <input style={inputStyle} type="text" value={namaTampilan} onChange={(e) => setNamaTampilan(e.target.value)} placeholder="Contoh: John Doe" />
        </div>
        <div>
          <label>Kementerian/Divisi:</label>
          <input style={inputStyle} type="text" value={kementerian} onChange={(e) => setKementerian(e.target.value)} placeholder="Contoh: Kementerian Kominfo" />
        </div>
        <button type="submit" style={buttonStyle}>Simpan Profil</button>
        {message && <p style={{ marginTop: '15px', textAlign: 'center' }}>{message}</p>}
      </form>
       <button onClick={() => navigate("/admin")} style={{ ...buttonStyle, marginTop: "30px", backgroundColor: "#6c757d" }}>Kembali ke Dashboard</button>
    </div>
  );
};

export default AdminProfil;