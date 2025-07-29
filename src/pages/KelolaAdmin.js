// src/pages/KelolaAdmin.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { logActivity } from '../utils/logActivity';

const KelolaAdmin = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]); // State baru untuk daftar event
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
                    if(docSnap.exists() && docSnap.data().role === 'master') {
                        setCurrentUserRole('master');
                    } else {
                        setCurrentUserRole('admin');
                    }
                });
                return () => unsubscribeProfile();
            } else {
                navigate('/login');
            }
        });

        const qUsers = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        // Listener baru untuk mengambil daftar event pemilihan
        const qEvents = query(collection(db, 'pemilihan_events'));
        const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
            setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeAuth();
            unsubscribeUsers();
            unsubscribeEvents(); // Jangan lupa cleanup listener baru
        };
    }, [navigate]);
    
    // --- FUNGSI PERSETUJUAN PANITIA YANG DISEMPURNAKAN ---
    const handleApprovePanitia = async (userId, userName) => {
        const eventId = prompt("PENTING: Masukkan ID Event yang akan dikelola oleh panitia ini:", "");
        
        if (!eventId) {
            alert("Proses dibatalkan. ID Event tidak boleh kosong.");
            return;
        }

        // Validasi apakah eventId yang dimasukkan ada di database
        if (events.some(e => e.id === eventId)) {
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, { 
                role: 'panitia',
                eventId: eventId // Simpan eventId ke profil panitia
            });
            await logActivity(`Menyetujui panitia "${userName}" untuk event ID ${eventId}`);
            alert(`Panitia "${userName}" berhasil disetujui dan dihubungkan ke event.`);
        } else {
            alert("ID Event tidak valid atau tidak ditemukan. Pastikan event sudah dibuat terlebih dahulu.");
        }
    };

    const handleUpdateRole = async (userId, userName, newRole) => {
        const userDocRef = doc(db, 'users', userId);
        const updateData = { role: newRole };
        // Hapus eventId jika peran bukan lagi panitia
        if (newRole !== 'panitia') {
            updateData.eventId = null;
        }
        await updateDoc(userDocRef, updateData);
        await logActivity(`Mengubah peran untuk "${userName}" menjadi ${newRole}`);
    };

    const handleDelete = async (userId, userName, actionType = 'Menghapus') => {
        const confirmationMessage = actionType === 'Menolak'
            ? `Anda yakin ingin menolak pendaftaran untuk ${userName}? Ini akan menghapus data mereka.`
            : `Anda yakin ingin menghapus data admin untuk ${userName}?`;

        if(window.confirm(confirmationMessage)) {
            const userDocRef = doc(db, 'users', userId);
            await deleteDoc(userDocRef);
            await logActivity(`${actionType} akun: "${userName}"`);
        }
    };

    const openEditModal = (user) => {
        setEditData(user);
        setShowModal(true);
    };

    const handleUpdate = async () => {
        if (!editData) return;
        const { id, ...dataToUpdate } = editData;
        const userDocRef = doc(db, 'users', id);
        await updateDoc(userDocRef, dataToUpdate);
        await logActivity(`Mengedit profil untuk: "${editData.namaTampilan}"`);
        setShowModal(false);
    };
    
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
                setEditData(prev => ({ ...prev, foto: compressedBase64 }));
            };
        };
    };

    const handleSendResetPassword = async (email) => {
        if(window.confirm(`Kirim email reset password ke ${email}?`)) {
            try {
                await sendPasswordResetEmail(auth, email);
                alert(`Email reset password berhasil dikirim ke ${email}.`);
                await logActivity(`Mengirim reset password ke: "${email}"`);
            } catch (error) {
                console.error("Gagal mengirim email reset:", error);
                alert("Gagal mengirim email reset.");
            }
        }
    };
    
    // --- Styles ---
    const containerStyle = { maxWidth: '900px', margin: '40px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
    const cardStyle = { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' };
    const buttonStyle = { border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', color: 'white', marginLeft: '10px', fontSize: '14px' };
    const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 };
    const modalContentStyle = { backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "500px", maxHeight: '90vh', overflowY: 'auto' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };

    return (
        <div style={{padding: '20px'}}>
            <div style={containerStyle}>
                <h1 style={{ color: '#004d40', textAlign: 'center' }}>Kelola Admin</h1>
                <p style={{textAlign: 'center', color: '#666'}}>Setujui, tolak, edit, atau hapus data admin dari sistem.</p>
                
                {loading ? <p style={{textAlign: 'center'}}>Memuat data admin...</p> : (
                    <div style={{marginTop: '30px'}}>
                        {users.map(user => {
                            if (user.role === 'master' && auth.currentUser?.uid !== user.id) return null;

                            return (
                                <div key={user.id} style={cardStyle}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>{user.namaTampilan} <span style={{fontWeight: 'normal'}}>({user.kementerian})</span></p>
                                        <small style={{ color: '#666' }}>{user.email} - Status: <strong>{user.role}</strong></small>
                                        {user.eventId && <small style={{display: 'block', color: 'blue'}}>Event ID: {user.eventId}</small>}
                                    </div>
                                    <div style={{marginTop: '10px'}}>
                                        <button onClick={() => openEditModal(user)} style={{...buttonStyle, backgroundColor: '#1e88e5'}}>Edit</button>
                                        
                                        {user.role === 'pending' && (
                                            <>
                                                <button onClick={() => handleUpdateRole(user.id, user.namaTampilan, 'admin')} style={{...buttonStyle, backgroundColor: '#4CAF50'}}>Setujui Admin</button>
                                                <button onClick={() => handleDelete(user.id, user.namaTampilan, 'Menolak')} style={{...buttonStyle, backgroundColor: '#f44336'}}>Tolak</button>
                                            </>
                                        )}
                                        {user.role === 'pending_panitia' && (
                                            <>
                                                <button onClick={() => handleApprovePanitia(user.id, user.namaTampilan)} style={{...buttonStyle, backgroundColor: '#2196F3'}}>Setujui Panitia</button>
                                                <button onClick={() => handleDelete(user.id, user.namaTampilan, 'Menolak')} style={{...buttonStyle, backgroundColor: '#f44336'}}>Tolak</button>
                                            </>
                                        )}
                                        {user.role === 'admin' && (
                                            <>
                                                <button onClick={() => handleUpdateRole(user.id, user.namaTampilan, 'pending')} style={{...buttonStyle, backgroundColor: '#ff9800'}}>Jadikan Pending</button>
                                                <button onClick={() => handleDelete(user.id, user.namaTampilan, 'Menghapus')} style={{...buttonStyle, backgroundColor: '#f44336'}}>Hapus</button>
                                            </>
                                        )}
                                        {user.role === 'panitia' && (
                                            <>
                                                <button onClick={() => handleUpdateRole(user.id, user.namaTampilan, 'pending_panitia')} style={{...buttonStyle, backgroundColor: '#ff9800'}}>Jadikan Pending</button>
                                                <button onClick={() => handleDelete(user.id, user.namaTampilan, 'Menghapus')} style={{...buttonStyle, backgroundColor: '#f44336'}}>Hapus</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                 <button onClick={() => navigate("/admin")} style={{ marginTop: "30px", padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Kembali ke Dashboard
                </button>
            </div>

            {showModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{color: '#004d40'}}>Edit Profil Admin</h2>
                        <div style={{ display: "grid", gap: "15px" }}>
                            <div><label>Nama Tampilan:</label><input style={inputStyle} value={editData.namaTampilan} onChange={(e) => setEditData(prev => ({ ...prev, namaTampilan: e.target.value }))} /></div>
                            <div><label>Kementerian/Ormawa:</label><input style={inputStyle} value={editData.kementerian} onChange={(e) => setEditData(prev => ({ ...prev, kementerian: e.target.value }))} /></div>
                            <div>
                                <label>Foto Profil:</label>
                                <input type="file" accept="image/*" onChange={handleFotoChange} style={{display: 'block', margin: '5px 0'}} />
                                {editData.foto && <img src={editData.foto} alt="Preview" style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: 'cover' }} />}
                            </div>
                            <hr />
                            <div>
                                <label>Tindakan Akun:</label>
                                <button onClick={() => handleSendResetPassword(editData.email)} style={{...buttonStyle, backgroundColor: '#ff9800', width: '100%', marginTop: '5px'}}>Kirim Link Reset Password</button>
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                <button onClick={handleUpdate} style={buttonStyle}>Simpan Perubahan</button>
                                <button onClick={() => setShowModal(false)} style={{ ...buttonStyle, backgroundColor: "#6c757d" }}>Batal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KelolaAdmin;