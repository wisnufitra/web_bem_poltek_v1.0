// src/pages/panitia/PanitiaKelolaKandidat.js
import React, { useState } from 'react';
import { useEvent } from '../../layouts/PanitiaLayout';
import { db } from '../../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { logActivity } from '../../utils/logActivity';

const PanitiaKelolaKandidat = () => {
    const { event, eventId } = useEvent();
    const [editData, setEditData] = useState(null);
    const [showKandidatModal, setShowKandidatModal] = useState(false);
    const [showVisiMisiModal, setShowVisiMisiModal] = useState(false);
    const [detailKandidat, setDetailKandidat] = useState(null);

    const placeholderFoto = 'https://placehold.co/400x400/004d40/FFFFFF?text=Foto';

    const openKandidatModal = (kandidat = null) => {
        setEditData(kandidat || { id: Date.now(), nama: '', visiMisi: '', fotoUrl: '', suara: 0 });
        setShowKandidatModal(true);
    };

    const openVisiMisiModal = (kandidat) => {
        setDetailKandidat(kandidat);
        setShowVisiMisiModal(true);
    };

    const handleSaveKandidat = async () => {
        if (!editData.nama || !editData.visiMisi) {
            return alert("Nama dan Visi & Misi tidak boleh kosong.");
        }
        
        // Pastikan fotoUrl tidak kosong, jika ya, gunakan placeholder
        const dataToSave = {
            ...editData,
            fotoUrl: editData.fotoUrl || placeholderFoto
        };

        let kandidatBaru = [...(event.kandidat || [])];
        const isEditing = event.kandidat && event.kandidat.some(k => k.id === dataToSave.id);

        if (isEditing) {
            kandidatBaru = kandidatBaru.map(k => k.id === dataToSave.id ? dataToSave : k);
            await logActivity(`Mengedit kandidat "${dataToSave.nama}"`);
        } else {
            kandidatBaru.push(dataToSave);
            await logActivity(`Menambah kandidat "${dataToSave.nama}"`);
        }

        const eventDocRef = doc(db, 'pemilihan_events', eventId);
        await updateDoc(eventDocRef, { kandidat: kandidatBaru });
        setShowKandidatModal(false);
    };
    
    const handleHapusKandidat = async (kandidatId) => {
        if(window.confirm(`Yakin ingin menghapus kandidat ini?`)) {
            const kandidatDihapus = event.kandidat.find(k => k.id === kandidatId);
            const kandidatBaru = event.kandidat.filter(k => k.id !== kandidatId);
            const eventDocRef = doc(db, 'pemilihan_events', eventId);
            await updateDoc(eventDocRef, { kandidat: kandidatBaru });
            await logActivity(`Menghapus kandidat "${kandidatDihapus.nama}"`);
        }
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
                const MAX_WIDTH = 400;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                setEditData(prev => ({ ...prev, fotoUrl: compressedBase64 }));
            };
        };
    };

    const sectionStyle = { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' };
    const buttonStyle = { padding: '10px 16px', backgroundColor: '#004d40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' };
    const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 };
    const modalContentStyle = { backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "500px", maxHeight: '90vh', overflowY: 'auto' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
    const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' };
    const cardStyle = { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden', textAlign: 'center' };

    return (
        <div style={sectionStyle}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
                <h3>Kelola Kandidat ({event.kandidat?.length || 0})</h3>
                <button onClick={() => openKandidatModal()} style={buttonStyle}>+ Tambah Kandidat</button>
            </div>
            
            {(!event.kandidat || event.kandidat.length === 0) ? (
                <p style={{textAlign: 'center', marginTop: '30px', color: '#666'}}>Belum ada kandidat yang ditambahkan.</p>
            ) : (
                <div style={gridStyle}>
                    {event.kandidat.map((k) => (
                        <div key={k.id} style={cardStyle}>
                            <img src={k.fotoUrl || placeholderFoto} alt={k.nama} style={{width: '100%', height: '200px', objectFit: 'cover'}} />
                            <div style={{padding: '15px'}}>
                                <h4 style={{margin: '0 0 10px'}}>{k.nama}</h4>
                                <button onClick={() => openVisiMisiModal(k)} style={{...buttonStyle, fontSize: '12px', padding: '5px 10px', backgroundColor: '#f0f0f0', color: '#333', width: '100%', marginBottom: '10px'}}>Lihat Visi & Misi</button>
                                <div style={{display: 'flex', justifyContent: 'space-around'}}>
                                    <button onClick={() => openKandidatModal(k)} style={{...buttonStyle, backgroundColor: '#1e88e5', fontSize: '12px', padding: '5px 10px'}}>Edit</button>
                                    <button onClick={() => handleHapusKandidat(k.id)} style={{...buttonStyle, backgroundColor: 'red', fontSize: '12px', padding: '5px 10px'}}>Hapus</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showKandidatModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2>{editData.id > Date.now()-1000 ? 'Tambah' : 'Edit'} Kandidat</h2>
                        <div style={{display: 'grid', gap: '15px'}}>
                            <input style={inputStyle} value={editData.nama} onChange={(e) => setEditData(prev => ({ ...prev, nama: e.target.value }))} placeholder="Nama Kandidat"/>
                            <textarea style={{...inputStyle, minHeight: '120px'}} value={editData.visiMisi} onChange={(e) => setEditData(prev => ({ ...prev, visiMisi: e.target.value }))} placeholder="Visi & Misi"/>
                            <label>Foto Kandidat:</label>
                            <input type="file" accept="image/*" onChange={handleFotoChange} />
                            <img src={editData.fotoUrl || placeholderFoto} alt="Preview" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}}/>
                            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                                <button onClick={handleSaveKandidat} style={buttonStyle}>Simpan</button>
                                <button onClick={() => setShowKandidatModal(false)} style={{...buttonStyle, backgroundColor: '#6c757d'}}>Batal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {showVisiMisiModal && (
                 <div style={modalOverlayStyle} onClick={() => setShowVisiMisiModal(false)}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{color: '#004d40'}}>{detailKandidat.nama}</h2>
                        <h4 style={{borderBottom: '1px solid #ddd', paddingBottom: '5px'}}>Visi & Misi</h4>
                        <p style={{whiteSpace: 'pre-wrap', textAlign: 'left'}}>{detailKandidat.visiMisi}</p>
                        <button onClick={() => setShowVisiMisiModal(false)} style={{...buttonStyle, backgroundColor: '#6c757d', marginTop: '20px'}}>Tutup</button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default PanitiaKelolaKandidat;