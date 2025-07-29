import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/firebaseConfig";
import { collection, addDoc, deleteDoc, onSnapshot, doc, query, orderBy, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { logActivity } from "../utils/logActivity"; // Import logActivity

const AdminLayanan = () => {
  const [layanan, setLayanan] = useState([]);
  const [judul, setJudul] = useState("");
  const [link, setLink] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const emojiList = ["📮", "📅", "🏢", "🗓️", "🕓", "📋", "📄", "✨", "🎉", "📢", "💡", "🔗"];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
    });
    const q = query(collection(db, "layanan"), orderBy("judul"));
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
    await addDoc(collection(db, "layanan"), { judul, link, emoji, tipe: "iframe" });
    await logActivity(`Menambahkan layanan: "${judul}"`);
    setJudul(""); setLink(""); setEmoji("✨");
  };

  const handleHapus = async (id) => {
    const itemToDelete = layanan.find(item => item.id === id);
    if (window.confirm("Apakah Anda yakin ingin menghapus layanan ini?")) {
      await deleteDoc(doc(db, "layanan", id));
      if(itemToDelete) {
        await logActivity(`Menghapus layanan: "${itemToDelete.judul}"`);
      }
    }
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

  const emojiPickerStyle = { position: 'absolute', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10 };
  const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 };
  const modalContentStyle = { backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "500px" };
  const inputStyle = { padding: "10px", border: "1px solid #ccc", borderRadius: "6px", width: "100%", boxSizing: "border-box" };
  const buttonStyle = { padding: "10px 20px", backgroundColor: "#004d40", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" };

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
      <h1 style={{ color: "#004d40", textAlign: "center", marginBottom: "30px" }}>Kelola Layanan</h1>
      <form onSubmit={handleTambah} style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "30px", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: '24px', width: '60px', height: '60px' }}>{emoji}</button>
          {showEmojiPicker && (<div style={emojiPickerStyle}>{emojiList.map(em => (<button key={em} type="button" onClick={() => selectEmoji(em)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '24px', padding: '5px' }}>{em}</button>))}</div>)}
        </div>
        <input type="text" placeholder="Judul layanan" value={judul} onChange={(e) => setJudul(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
        <input type="text" placeholder="Link Embed" value={link} onChange={(e) => setLink(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
        <button type="submit" style={{ padding: "10px 16px", backgroundColor: "#004d40", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Tambah</button>
      </form>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {layanan.map((item) => (
          <li key={item.id} style={{ marginBottom: "15px", padding: "14px", border: "1px solid #ddd", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{item.emoji} <strong>{item.judul}</strong></span>
            <div>
              <button onClick={() => openEditModal(item)} style={{ padding: "6px 12px", backgroundColor: "#1e88e5", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", marginRight: '10px' }}>Edit</button>
              <button onClick={() => handleHapus(item.id)} style={{ padding: "6px 12px", backgroundColor: "#d32f2f", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>Hapus</button>
            </div>
          </li>
        ))}
      </ul>
      {showEditModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ color: "#004d40" }}>Edit Layanan</h2>
            <div style={{ display: "grid", gap: "15px" }}>
              <div style={{ position: 'relative' }}>
                <label>Emoji:</label>
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: '24px', width: '60px', height: '60px', marginLeft: '10px' }}>{editData.emoji}</button>
                {showEmojiPicker && (<div style={emojiPickerStyle}>{emojiList.map(em => (<button key={em} type="button" onClick={() => selectEmoji(em, true)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '24px', padding: '5px' }}>{em}</button>))}</div>)}
              </div>
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
      <button onClick={() => navigate("/admin")} style={{ marginTop: "30px", backgroundColor: "#6c757d", color: "white", padding: "10px 20px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Kembali ke Dashboard</button>
    </div>
  );
};

export default AdminLayanan;