// src/pages/AdminStruktur.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/firebaseConfig";
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { logActivity } from "../utils/logActivity";

// Data terpusat untuk jabatan di setiap divisi
const jabatanMap = {
    "Pengurus Harian": ["Presiden Mahasiswa", "Wakil Presiden Mahasiswa"],
    "Inspektorat Jenderal": ["Anggota"],
    "Sekretariat Jenderal": ["Sekretaris Jendral", "Wakil Sekretaris Jendral", "Staff Sekretaris Jendral"],
    "Kementerian Keuangan": ["Kepala Menteri", "Wakil Menteri", "Staff Menteri"],
    "Kementerian Dalam Negeri": ["Kepala Menteri", "Wakil Menteri", "Staff Menteri"],
    "Kementerian Luar Negeri": ["Kepala Menteri", "Wakil Menteri", "Staff Menteri"],
    "Kementerian Pemuda dan Olahraga (PORA)": ["Kepala Menteri", "Wakil Menteri", "Staff Menteri"],
    "Kementerian PSDM": ["Kepala Menteri", "Wakil Menteri", "Staff Menteri"],
    "Kementerian Komunikasi dan Informasi (KOMINFO)": ["Kepala Menteri", "Wakil Menteri", "Staff Menteri"],
    "Kementerian Ekonomi Kreatif": ["Kepala Menteri", "Wakil Menteri", "Staff Menteri"],
};

const prodiOptions = ["Teknokimia Nuklir", "Elektronika Instrumentasi", "Elektromekanika"];

// Komponen Modal Konfirmasi
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000 };
    const modalContentStyle = { backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "400px", textAlign: 'center' };
    const buttonStyle = { padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 'bold', margin: '0 10px' };
    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <p style={{marginBottom: '30px'}}>{message}</p>
                <div>
                    <button onClick={onConfirm} style={{...buttonStyle, backgroundColor: '#d32f2f', color: 'white'}}>Ya, Lanjutkan</button>
                    <button onClick={onCancel} style={{...buttonStyle, backgroundColor: '#ccc'}}>Batal</button>
                </div>
            </div>
        </div>
    );
};

const AdminStruktur = () => {
  const navigate = useNavigate();
  const [struktur, setStruktur] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [namaBaru, setNamaBaru] = useState("");
  const [divisiDipilih, setDivisiDipilih] = useState("");
  const [jabatanBaru, setJabatanBaru] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [confirmProps, setConfirmProps] = useState({ show: false, message: '', onConfirm: () => {} });

  const strukturRef = collection(db, "struktur");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
    });

    const q = query(strukturRef);
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      const predefinedOrder = Object.keys(jabatanMap);
      const sortedData = data.sort((a, b) => {
          return predefinedOrder.indexOf(a.divisi) - predefinedOrder.indexOf(b.divisi);
      });

      setStruktur(sortedData);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, [navigate]);

  const confirmAction = (message, onConfirm) => {
    setConfirmProps({ show: true, message, onConfirm });
  };

  const handleTambahAnggota = async (e) => {
    e.preventDefault();
    if (!namaBaru || !jabatanBaru || !divisiDipilih) return alert("Semua field wajib diisi.");
    
    let targetDivisiDoc = struktur.find((item) => item.divisi === divisiDipilih);

    if (!targetDivisiDoc) {
        const newDivisiRef = await addDoc(strukturRef, {
            divisi: divisiDipilih,
            anggota: []
        });
        targetDivisiDoc = { id: newDivisiRef.id, anggota: [] };
    }

    const newAnggota = {
      nama: namaBaru, jabatan: jabatanBaru, nim: "", prodi: "", email: "", instagram: "", nohp: "",
      foto: "https://placehold.co/150x150/004d40/FFFFFF?text=Foto",
    };
    const updatedAnggota = [...(targetDivisiDoc.anggota || []), newAnggota];
    await updateDoc(doc(db, "struktur", targetDivisiDoc.id), { anggota: updatedAnggota });
    await logActivity(`Menambahkan anggota "${namaBaru}" ke divisi "${divisiDipilih}"`);
    setNamaBaru("");
    setJabatanBaru("");
  };

  // --- FUNGSI YANG DIPERBARUI ---
  const hapusAnggota = (divisiId, anggotaIndex) => {
    const divisiDoc = struktur.find((d) => d.id === divisiId);
    const anggotaDihapus = divisiDoc.anggota[anggotaIndex];
    confirmAction(`Yakin ingin menghapus anggota "${anggotaDihapus.nama}"?`, async () => {
        const anggotaBaru = [...divisiDoc.anggota];
        anggotaBaru.splice(anggotaIndex, 1);

        // Jika ini adalah anggota terakhir, hapus seluruh divisi
        if (anggotaBaru.length === 0) {
            await deleteDoc(doc(db, "struktur", divisiId));
            await logActivity(`Menghapus anggota terakhir dan divisi "${divisiDoc.divisi}"`);
        } else {
            // Jika tidak, hanya update daftar anggota
            await updateDoc(doc(db, "struktur", divisiId), { anggota: anggotaBaru });
            await logActivity(`Menghapus anggota "${anggotaDihapus.nama}" dari divisi "${divisiDoc.divisi}"`);
        }
        setConfirmProps({ show: false });
    });
  };
  
  const handleUpdate = async () => {
    if (!editData) return;
    const { divisiId, anggotaIndex, ...anggotaData } = editData;
    for (const key in anggotaData) {
      if (anggotaData[key] === undefined) anggotaData[key] = null;
    }
    const divisiDoc = struktur.find((d) => d.id === divisiId);
    const updatedAnggota = [...divisiDoc.anggota];
    updatedAnggota[anggotaIndex] = anggotaData;
    await updateDoc(doc(db, "struktur", divisiId), { anggota: updatedAnggota });
    await logActivity(`Mengedit data anggota "${anggotaData.nama}"`);
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

  const handleHapusFoto = () => {
    if (editData) {
      setEditData(prev => ({ ...prev, foto: "https://placehold.co/150x150/004d40/FFFFFF?text=Foto" }));
    }
  };

  const openEditModal = (divisiId, anggotaIndex, anggota) => {
    setEditData({ ...anggota, divisiId, anggotaIndex });
    setShowModal(true);
  };

  const containerStyle = { maxWidth: "1000px", margin: "40px auto", padding: "20px" };
  const inputStyle = { padding: "10px", border: "1px solid #ccc", borderRadius: "6px", width: "100%", boxSizing: "border-box" };
  const buttonStyle = { padding: "10px 20px", backgroundColor: "#004d40", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" };
  const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 };
  const modalContentStyle = { backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "500px", maxHeight: '90vh', overflowY: 'auto' };
  const sectionStyle = { backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "30px" };

  return (
    <div style={containerStyle}>
      {confirmProps.show && <ConfirmationModal message={confirmProps.message} onConfirm={confirmProps.onConfirm} onCancel={() => setConfirmProps({ show: false })} />}
      <h1 style={{ color: "#004d40", textAlign: "center" }}>Kelola Anggota Struktur Organisasi</h1>
      
      <div style={sectionStyle}>
        <h2>Tambah Anggota</h2>
        <form onSubmit={handleTambahAnggota} style={{ display: "grid", gap: "10px" }}>
          <input placeholder="Nama Lengkap" value={namaBaru} onChange={(e) => setNamaBaru(e.target.value)} style={inputStyle} required/>
          <div>
            <label>Pilih Divisi:</label>
            <select value={divisiDipilih} onChange={(e) => setDivisiDipilih(e.target.value)} style={inputStyle} required>
              <option value="" disabled>-- Pilih Divisi --</option>
              {Object.keys(jabatanMap).map(divisi => <option key={divisi} value={divisi}>{divisi}</option>)}
            </select>
          </div>
          <div>
            <label>Pilih Jabatan:</label>
            <select value={jabatanBaru} onChange={(e) => setJabatanBaru(e.target.value)} style={inputStyle} disabled={!divisiDipilih} required>
              <option value="" disabled>-- Pilih Jabatan --</option>
              {(jabatanMap[divisiDipilih] || []).map(jabatan => <option key={jabatan} value={jabatan}>{jabatan}</option>)}
            </select>
          </div>
          <button type="submit" style={buttonStyle}>Tambah Anggota</button>
        </form>
      </div>

      {loading ? <p>Loading...</p> : struktur.map((divisi) => (
        <div key={divisi.id} style={{marginBottom: '20px'}}>
          <h3 style={{ color: "#004d40", margin: 0, borderBottom: '2px solid #004d40', paddingBottom: '5px' }}>{divisi.divisi}</h3>
          {divisi.anggota && divisi.anggota.map((anggota, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #eee", padding: "10px 0" }}>
              <span><strong>{anggota.nama}</strong> ({anggota.jabatan})</span>
              <div>
                <button onClick={() => openEditModal(divisi.id, idx, anggota)} style={{ ...buttonStyle, backgroundColor: "#1e88e5", marginRight: "10px" }}>Edit</button>
                <button onClick={() => hapusAnggota(divisi.id, idx)} style={{ ...buttonStyle, backgroundColor: "#e53935" }}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>Edit Anggota</h2>
            <div style={{ display: "grid", gap: "15px" }}>
              <input style={inputStyle} placeholder="Nama" value={editData.nama} onChange={(e) => setEditData(prev => ({ ...prev, nama: e.target.value }))} />
              <div>
                <label>Jabatan:</label>
                <select style={inputStyle} value={editData.jabatan} onChange={(e) => setEditData(prev => ({ ...prev, jabatan: e.target.value }))}>
                    {(jabatanMap[struktur.find(d => d.id === editData.divisiId)?.divisi] || []).map(jabatan => (
                        <option key={jabatan} value={jabatan}>{jabatan}</option>
                    ))}
                </select>
              </div>
              <input style={inputStyle} placeholder="NIM" value={editData.nim || ''} onChange={(e) => setEditData(prev => ({ ...prev, nim: e.target.value }))} />
              <div>
                <label>Program Studi:</label>
                <select style={inputStyle} value={editData.prodi || ''} onChange={(e) => setEditData(prev => ({ ...prev, prodi: e.target.value }))}>
                    <option value="">-- Pilih Prodi --</option>
                    {prodiOptions.map(prodi => <option key={prodi} value={prodi}>{prodi}</option>)}
                </select>
              </div>
              <input style={inputStyle} placeholder="Email" value={editData.email || ''} onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))} />
              <input style={inputStyle} placeholder="Instagram (tanpa @)" value={editData.instagram || ''} onChange={(e) => setEditData(prev => ({ ...prev, instagram: e.target.value }))} />
              <input style={inputStyle} placeholder="No. HP" value={editData.nohp || ''} onChange={(e) => setEditData(prev => ({ ...prev, nohp: e.target.value }))} />
              <label>Ganti Foto:</label>
              <input type="file" accept="image/*" onChange={handleFotoChange} />
              <button type="button" onClick={handleHapusFoto} style={{...buttonStyle, backgroundColor: '#f44336', width: 'fit-content'}}>Hapus Foto</button>
              {editData.foto && <img src={editData.foto} alt="Preview" style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: 'cover' }} />}
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button onClick={handleUpdate} style={buttonStyle}>Simpan Perubahan</button>
                <button onClick={() => setShowModal(false)} style={{ ...buttonStyle, backgroundColor: "#6c757d" }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/admin")} style={{ ...buttonStyle, backgroundColor: "#6c757d", marginTop: "30px" }}>Kembali ke Dashboard</button>
    </div>
  );
};

export default AdminStruktur;