import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logActivity } from '../utils/logActivity';

const KelolaTentang = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [sections, setSections] = useState([]);

    const docRef = doc(db, 'halaman', 'tentang');

    const titleOptions = [
        'Deskripsi Awal', 'Visi', 'Misi', 'Tujuan', 'Fungsi dan Tugas', 
        'Sejarah Singkat', 'Kontak Kami', 'Struktur Pimpinan', 'Lainnya'
    ];
    
    const contactOptions = [
        'Email', 'WhatsApp', 'Telepon', 'Instagram', 'X (Twitter)', 'Facebook', 'Website', 'Lainnya'
    ];

    const placeholderMap = {
        'Deskripsi Awal': 'Tuliskan paragraf pengenalan singkat tentang BEM...',
        'Visi': 'Tuliskan visi organisasi...',
        'Misi': '- Misi pertama...\n- Misi kedua...',
        'Tujuan': 'Jelaskan tujuan utama BEM...',
        'Fungsi dan Tugas': '- Fungsi pertama...\n- Tugas utama...',
        'Kontak Kami': 'Masukkan username, nomor, atau alamat email...',
        'default': 'Tuliskan konten untuk bagian ini...'
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            if (!user) navigate('/login');
        });

        const fetchData = async () => {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().sections) {
                setSections(docSnap.data().sections);
            } else {
                setSections([{ id: Date.now(), judul: 'Deskripsi Awal', isi: '', contactType: 'Email' }]);
            }
            setLoading(false);
        };

        fetchData();
        return () => unsubscribeAuth();
    }, [navigate]);

    const handleInputChange = (id, field, value) => {
        setSections(prevSections => 
            prevSections.map(section => 
                section.id === id ? { ...section, [field]: value } : section
            )
        );
    };

    const handleTambahBagian = () => {
        setSections(prev => [...prev, { id: Date.now(), judul: 'Lainnya', isi: '', contactType: 'Email' }]);
    };

    const handleHapusBagian = (id) => {
        if (window.confirm("Yakin ingin menghapus bagian ini?")) {
            setSections(prev => prev.filter(section => section.id !== id));
        }
    };

    const handleSimpan = async (e) => {
        e.preventDefault();
        setMessage('Menyimpan...');
        try {
            await setDoc(docRef, { sections: sections });
            await logActivity('Memperbarui halaman "Tentang BEM"');
            setMessage('Halaman "Tentang" berhasil diperbarui!');
        } catch (error) {
            console.error("Error updating page:", error);
            setMessage('Gagal memperbarui halaman.');
        }
    };

    if (loading) {
        return <p style={{ textAlign: 'center', marginTop: '40px' }}>Memuat editor...</p>;
    }

    const containerStyle = { maxWidth: '900px', margin: '40px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '5px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px' };
    const textareaStyle = { ...inputStyle, minHeight: '100px', fontFamily: 'inherit' };
    const buttonStyle = { padding: '12px 24px', backgroundColor: '#004d40', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
    const sectionStyle = { border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', marginBottom: '20px' };

    return (
        <div style={containerStyle}>
            <h1 style={{ color: '#004d40', textAlign: 'center' }}>Kelola Halaman "Tentang BEM"</h1>
            <p style={{textAlign: 'center', color: '#666'}}>Anda bisa menambah, mengedit, dan menghapus setiap bagian konten di halaman "Tentang".</p>
            <form onSubmit={handleSimpan} style={{ display: 'grid', gap: '20px', marginTop: '30px' }}>
                {sections.map((section) => (
                    <div key={section.id} style={sectionStyle}>
                        <label style={{fontWeight: 'bold'}}>Judul Bagian</label>
                        <select 
                            value={section.judul} 
                            onChange={(e) => handleInputChange(section.id, 'judul', e.target.value)} 
                            style={inputStyle}
                        >
                            {titleOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                        
                        {section.judul === 'Kontak Kami' ? (
                            <>
                                <label style={{fontWeight: 'bold'}}>Jenis Kontak</label>
                                <select 
                                    value={section.contactType} 
                                    onChange={(e) => handleInputChange(section.id, 'contactType', e.target.value)} 
                                    style={inputStyle}
                                >
                                    {contactOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                </select>
                                <label style={{fontWeight: 'bold'}}>Isi Kontak</label>
                                <input 
                                    value={section.isi} 
                                    onChange={(e) => handleInputChange(section.id, 'isi', e.target.value)} 
                                    style={inputStyle} 
                                    placeholder={placeholderMap[section.judul] || placeholderMap.default}
                                />
                            </>
                        ) : (
                            <>
                                <label style={{fontWeight: 'bold'}}>Isi Konten</label>
                                <textarea 
                                    value={section.isi} 
                                    onChange={(e) => handleInputChange(section.id, 'isi', e.target.value)} 
                                    style={textareaStyle} 
                                    placeholder={placeholderMap[section.judul] || placeholderMap.default}
                                ></textarea>
                            </>
                        )}
                        <button type="button" onClick={() => handleHapusBagian(section.id)} style={{...buttonStyle, backgroundColor: '#f44336', fontSize: '12px', padding: '5px 10px', marginTop: '10px'}}>Hapus Bagian Ini</button>
                    </div>
                ))}
                
                <button type="button" onClick={handleTambahBagian} style={{...buttonStyle, backgroundColor: '#1e88e5'}}>+ Tambah Bagian Baru</button>
                <hr />
                <button type="submit" style={buttonStyle}>Simpan Semua Perubahan</button>
                {message && <p style={{ textAlign: 'center', marginTop: '15px' }}>{message}</p>}
            </form>
            <button onClick={() => navigate("/admin")} style={{ ...buttonStyle, marginTop: "30px", backgroundColor: "#6c757d" }}>Kembali ke Dashboard</button>
        </div>
    );
};

export default KelolaTentang;