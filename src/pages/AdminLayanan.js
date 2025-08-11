// src/pages/AdminLayanan.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/firebaseConfig";
import { collection, addDoc, deleteDoc, onSnapshot, doc, query, orderBy, updateDoc, writeBatch } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { logActivity } from "../utils/logActivity";

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

const AdminLayanan = () => {
  const [layanan, setLayanan] = useState([]);
  const [judul, setJudul] = useState("");
  const [link, setLink] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmProps, setConfirmProps] = useState({ show: false });

  // --- State Baru untuk Drag and Drop ---
  const draggedItem = useRef(null);
  const draggedOverItem = useRef(null);
  const [dragging, setDragging] = useState(false);

  const emojiList = ["📮", "📅", "🏢", "🗓️", "🕓", "📋", "📄", "✨", "🎉", "📢", "💡", "🔗"];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
    });
    const q = query(collection(db, "layanan"), orderBy("urutan", "asc"));
    const unsubFirestore = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLayanan(data);
    });
    return () => {
      unsubscribeAuth();
      unsubFirestore();
    };
  }, [navigate]);

  const handleTambah = async (e) => {
    e.preventDefault();
    if (!judul || !link) return alert("Judul dan Link tidak boleh kosong.");
    const urutanBaru = layanan.length > 0 ? Math.max(...layanan.map(l => l.urutan || 0)) + 1 : 1;
    await addDoc(collection(db, "layanan"), { judul, link, emoji, tipe: "iframe", urutan: urutanBaru });
    await logActivity(`Menambahkan layanan: "${judul}"`);
    setJudul(""); setLink(""); setEmoji("✨");
  };

  const handleHapus = (id, judulLayanan) => {
    setConfirmProps({
        show: true,
        message: `Apakah Anda yakin ingin menghapus layanan "${judulLayanan}"?`,
        onConfirm: async () => {
            await deleteDoc(doc(db, "layanan", id));
            await logActivity(`Menghapus layanan: "${judulLayanan}"`);
            setConfirmProps({ show: false });
        }
    });
  };

  const openEditModal = (item) => {
    setEditData(item);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editData || !editData.id) return;
    const { id, ...dataToUpdate } = editData;
    const docRef = doc(db, "layanan", id);
    await updateDoc(docRef, dataToUpdate);
    await logActivity(`Mengedit layanan: "${editData.judul}"`);
    setShowEditModal(false);
  };
  
  const selectEmoji = (selectedEmoji, isEditing = false) => {
    if (isEditing) {
      setEditData(prev => ({ ...prev, emoji: selectedEmoji }));
    } else {
      setEmoji(selectedEmoji);
    }
    setShowEmojiPicker(false);
  };

  // --- FUNGSI BARU UNTUK MENGURUTKAN ---
  const handleSort = async () => {
    const layananClone = [...layanan];
    const temp = layananClone[draggedItem.current];
    layananClone.splice(draggedItem.current, 1);
    layananClone.splice(draggedOverItem.current, 0, temp);

    // Update urutan di Firestore
    const batch = writeBatch(db);
    layananClone.forEach((item, index) => {
        const docRef = doc(db, "layanan", item.id);
        batch.update(docRef, { urutan: index });
    });
    await batch.commit();
    
    draggedItem.current = null;
    draggedOverItem.current = null;
    setDragging(false);
  };

  const containerStyle = { maxWidth: "1000px", margin: "40px auto", padding: "20px" };
  const inputStyle = { padding: "10px", border: "1px solid #ccc", borderRadius: "6px", width: "100%", boxSizing: "border-box" };
  const buttonStyle = { padding: "10px 20px", backgroundColor: "#00092f", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 'bold' };
  const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 };
  const modalContentStyle = { backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "500px" };
  const sectionStyle = { backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "30px" };
  const cardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', cursor: 'move' };

  return (
    <div style={containerStyle}>
      {confirmProps.show && <ConfirmationModal message={confirmProps.message} onConfirm={confirmProps.onConfirm} onCancel={() => setConfirmProps({ show: false })} />}
      <h1 style={{ color: "#00092f", textAlign: "center", marginBottom: "30px" }}>Kelola Layanan</h1>
      
      <div style={sectionStyle}>
        <h2>Tambah Layanan Baru</h2>
        <form onSubmit={handleTambah} style={{ display: "grid", gridTemplateColumns: 'auto 1fr 1fr auto', gap: "10px", alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: '24px', width: '60px', height: '60px' }}>{emoji}</button>
            {showEmojiPicker && (<div style={{ position: 'absolute', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10 }}>{emojiList.map(em => (<button key={em} type="button" onClick={() => selectEmoji(em)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '24px', padding: '5px' }}>{em}</button>))}</div>)}
          </div>
          <input type="text" placeholder="Judul layanan" value={judul} onChange={(e) => setJudul(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="Link Embed Google Forms" value={link} onChange={(e) => setLink(e.target.value)} style={inputStyle} />
          <button type="submit" style={buttonStyle}>Tambah</button>
        </form>
      </div>

      <div>
        <h2>Daftar Layanan</h2>
        {layanan.map((item, index) => (
          <div 
            key={item.id} 
            style={{...cardStyle, opacity: dragging && draggedItem.current === index ? 0.5 : 1}}
            draggable
            onDragStart={() => { draggedItem.current = index; setDragging(true); }}
            onDragEnter={() => (draggedOverItem.current = index)}
            onDragEnd={handleSort}
            onDragOver={(e) => e.preventDefault()}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <span>{item.emoji} <strong>{item.judul}</strong></span>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <button onClick={() => openEditModal(item)} style={{ ...buttonStyle, backgroundColor: "#1e88e5", padding: '8px 12px' }}>Edit</button>
              <button onClick={() => handleHapus(item.id, item.judul)} style={{ ...buttonStyle, backgroundColor: "#d32f2f", padding: '8px 12px' }}>Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {showEditModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ color: "#00092f" }}>Edit Layanan</h2>
            <div style={{ display: "grid", gap: "15px" }}>
              <div><label>Judul:</label><input style={inputStyle} value={editData.judul} onChange={(e) => setEditData(prev => ({ ...prev, judul: e.target.value }))} /></div>
              <div><label>Link Embed:</label><input style={inputStyle} value={editData.link} onChange={(e) => setEditData(prev => ({ ...prev, link: e.target.value }))} /></div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button onClick={handleUpdate} style={buttonStyle}>Simpan Perubahan</button>
                <button onClick={() => setShowEditModal(false)} style={{ ...buttonStyle, backgroundColor: "#6c757d" }}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => navigate("/admin")} style={{ ...buttonStyle, backgroundColor: "#6c757d", marginTop: "30px" }}>Kembali ke Dashboard</button>
    </div>
  );
};

export default AdminLayanan;
