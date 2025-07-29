import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/firebaseConfig";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { logActivity } from "../utils/logActivity";

const AdminDokumen = () => {
  const [dokumen, setDokumen] = useState([]);
  const [judul, setJudul] = useState("");
  const [link, setLink] = useState("");
  const navigate = useNavigate();

  // State baru untuk fitur edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
    });

    const q = query(collection(db, "dokumen"), orderBy("judul"));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDokumen(data);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, [navigate]);

  const tambahDokumen = async (e) => {
    e.preventDefault();
    if (!judul || !link) return alert("Judul dan link tidak boleh kosong.");
    
    try {
      await addDoc(collection(db, "dokumen"), { judul, link });
      await logActivity(`Menambahkan dokumen: "${judul}"`);
      setJudul("");
      setLink("");
    } catch (err) {
      console.error("Gagal menambahkan dokumen:", err);
    }
  };

  const hapusDokumen = async (id) => {
    const itemToDelete = dokumen.find(item => item.id === id);
    if (window.confirm("Yakin ingin menghapus dokumen ini?")) {
      try {
        await deleteDoc(doc(db, "dokumen", id));
        if (itemToDelete) {
          await logActivity(`Menghapus dokumen: "${itemToDelete.judul}"`);
        }
      } catch (err) {
        console.error("Gagal menghapus dokumen:", err);
      }
    }
  };

  // --- FUNGSI BARU UNTUK FITUR EDIT ---
  const openEditModal = (item) => {
    setEditData(item);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editData || !editData.id) return;
    const { id, ...dataToUpdate } = editData;
    const docRef = doc(db, "dokumen", id);
    await updateDoc(docRef, dataToUpdate);
    await logActivity(`Mengedit dokumen: "${editData.judul}"`);
    setShowEditModal(false);
  };
  
  // --- Styles ---
  const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 };
  const modalContentStyle = { backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "500px" };
  const inputStyle = { padding: "10px", border: "1px solid #ccc", borderRadius: "6px", width: "100%", boxSizing: "border-box" };
  const buttonStyle = { padding: "10px 20px", backgroundColor: "#004d40", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" };

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
      <h1 style={{ color: "#004d40", textAlign: "center", marginBottom: "30px" }}>Kelola Dokumen</h1>
      <form onSubmit={tambahDokumen} style={{ display: "flex", gap: "10px", marginBottom: "30px", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
        <input type="text" placeholder="Judul dokumen" value={judul} onChange={(e) => setJudul(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
        <input type="text" placeholder="Link Google Drive" value={link} onChange={(e) => setLink(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
        <button type="submit" style={{ padding: "10px 16px", backgroundColor: "#004d40", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Tambah</button>
      </form>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {dokumen.map((item) => (
          <li key={item.id} style={{ marginBottom: "15px", padding: "14px", border: "1px solid #ddd", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><strong>{item.judul}</strong> — <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: "#004d40" }}>Lihat Dokumen</a></span>
            <div>
              <button onClick={() => openEditModal(item)} style={{ padding: "6px 12px", backgroundColor: "#1e88e5", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", marginRight: '10px' }}>Edit</button>
              <button onClick={() => hapusDokumen(item.id)} style={{ padding: "6px 12px", backgroundColor: "#d32f2f", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>Hapus</button>
            </div>
          </li>
        ))}
      </ul>

      {/* MODAL EDIT BARU */}
      {showEditModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ color: "#004d40" }}>Edit Dokumen</h2>
            <div style={{ display: "grid", gap: "15px" }}>
              <div>
                <label>Judul:</label>
                <input style={inputStyle} value={editData.judul} onChange={(e) => setEditData(prev => ({ ...prev, judul: e.target.value }))} />
              </div>
              <div>
                <label>Link Google Drive:</label>
                <input style={inputStyle} value={editData.link} onChange={(e) => setEditData(prev => ({ ...prev, link: e.target.value }))} />
              </div>
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

export default AdminDokumen;