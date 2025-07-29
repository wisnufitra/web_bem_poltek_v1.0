import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/firebaseConfig";
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { logActivity } from "../utils/logActivity";

const KelolaBerita = () => {
  const [beritaList, setBeritaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [gambarList, setGambarList] = useState([]);
  const [kategori, setKategori] = useState("Umum");
  const [tanggalKegiatan, setTanggalKegiatan] = useState("");
  const [linkInstagram, setLinkInstagram] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dibuatPada");

  const beritaCollectionRef = collection(db, "berita");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/login");
    });
    const q = query(beritaCollectionRef, orderBy("dibuatPada", "desc"));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBeritaList(list);
      setLoading(false);
    });
    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, [navigate]);

  const filteredAndSortedBerita = useMemo(() => {
    return beritaList
      .filter(item => item.judul.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'judul') {
          return a.judul.localeCompare(b.judul);
        }
        return (b.dibuatPada?.seconds || 0) - (a.dibuatPada?.seconds || 0);
      });
  }, [beritaList, searchTerm, sortBy]);

  const handleFotoChange = (e, isEditing = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const compressAndAddImages = (fileList) => {
        Array.from(fileList).forEach(file => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    
                    if (isEditing) {
                        setEditData(prev => ({ ...prev, gambarList: [...(prev.gambarList || []), compressedBase64] }));
                    } else {
                        setGambarList(prev => [...prev, compressedBase64]);
                    }
                };
            };
        });
    };
    compressAndAddImages(files);
  };

  const handleHapusFoto = (index, isEditing = false) => {
    if (isEditing) {
        setEditData(prev => ({ ...prev, gambarList: prev.gambarList.filter((_, i) => i !== index) }));
    } else {
        setGambarList(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleTambah = async (e) => {
    e.preventDefault();
    if (!judul || !deskripsi) return alert("Judul dan Deskripsi harus diisi!");
    
    const user = auth.currentUser;
    let kementerianPublikasi = "BEM";
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        kementerianPublikasi = userDocSnap.data().kementerian || "BEM";
      }
    }

    await addDoc(beritaCollectionRef, {
      judul, deskripsi, gambarList, kategori, tanggalKegiatan, linkInstagram,
      dibuatPada: serverTimestamp(),
      dibuatOleh: kementerianPublikasi,
    });
    await logActivity(`Menambahkan berita: "${judul}"`);
    setJudul(""); setDeskripsi(""); setGambarList([]); setKategori("Umum"); setTanggalKegiatan(""); setLinkInstagram("");
  };

  const handleUpdate = async () => {
    if (!editData) return;
    const { id, ...dataToUpdate } = editData;
    const user = auth.currentUser;
    let kementerianEditor = "BEM";
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        kementerianEditor = userDocSnap.data().kementerian || "BEM";
      }
    }
    const docRef = doc(db, "berita", id);
    await updateDoc(docRef, {
      ...dataToUpdate,
      dieditPada: serverTimestamp(),
      dieditOleh: kementerianEditor,
    });
    await logActivity(`Mengedit berita: "${editData.judul}"`);
    setShowModal(false);
  };

  const handleHapus = async (id) => {
    const itemToDelete = beritaList.find(item => item.id === id);
    if (window.confirm("Yakin ingin menghapus berita ini?")) {
      await deleteDoc(doc(db, "berita", id));
      if (itemToDelete) {
        await logActivity(`Menghapus berita: "${itemToDelete.judul}"`);
      }
    }
  };
    
  const openEditModal = (item) => {
    setEditData(item);
    setShowModal(true);
  };

  const inputStyle = { padding: "10px", border: "1px solid #ccc", borderRadius: "6px", width: "100%", boxSizing: "border-box" };
  const buttonStyle = { padding: "10px 20px", backgroundColor: "#004d40", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" };
  const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 };
  const modalContentStyle = { backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "600px", maxHeight: '90vh', overflowY: 'auto' };

  return (
    <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "20px" }}>
      <h1 style={{ color: "#004d40", textAlign: "center" }}>Kelola Berita & Kegiatan</h1>
      <div style={{ backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
        <h2>Tambah Berita Baru</h2>
        <form onSubmit={handleTambah} style={{ display: "grid", gap: "15px" }}>
          <input style={inputStyle} placeholder="Judul Berita" value={judul} onChange={(e) => setJudul(e.target.value)} />
          <textarea style={{...inputStyle, minHeight: '100px'}} placeholder="Isi Berita" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
          <select style={inputStyle} value={kategori} onChange={(e) => setKategori(e.target.value)}>
            <option value="Umum">Umum</option>
            <option value="Kegiatan">Kegiatan</option>
            <option value="Informasi">Informasi</option>
            <option value="Pengumuman">Pengumuman</option>
          </select>
          <label>Unggah Gambar:</label>
          <input type="file" accept="image/*" multiple onChange={(e) => handleFotoChange(e, false)} />
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            {gambarList.map((img, index) => (
                <div key={index} style={{position: 'relative'}}>
                    <img src={img} alt={`Preview ${index}`} style={{ width: "100px", height: "75px", objectFit: 'cover' }} />
                    <button type="button" onClick={() => handleHapusFoto(index, false)} style={{position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer'}}>X</button>
                </div>
            ))}
          </div>
          <button type="submit" style={buttonStyle}>Tambah Berita</button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Cari berdasarkan judul..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{...inputStyle, width: 'auto', flexGrow: 1}}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{...inputStyle, width: 'auto'}}>
          <option value="dibuatPada">Urutkan: Terbaru</option>
          <option value="judul">Urutkan: Judul (A-Z)</option>
        </select>
      </div>

      <div>
        <h2>Daftar Berita</h2>
        {loading ? <p>Memuat data...</p> : filteredAndSortedBerita.map((item) => (
          <div key={item.id} style={{ borderBottom: '1px solid #ddd', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4>{item.judul}</h4>
              <p style={{margin: 0, color: '#666'}}>Kategori: {item.kategori}</p>
            </div>
            <div>
              <button onClick={() => openEditModal(item)} style={{...buttonStyle, backgroundColor: '#1e88e5', marginRight: '10px'}}>Edit</button>
              <button onClick={() => handleHapus(item.id)} style={{...buttonStyle, backgroundColor: '#e53935'}}>Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
          <div style={modalOverlayStyle}>
              <div style={modalContentStyle}>
                  <h2>Edit Berita</h2>
                  {/* ... Konten modal Anda ... */}
              </div>
          </div>
      )}
      <button onClick={() => navigate("/admin")} style={{ ...buttonStyle, backgroundColor: "#6c757d", marginTop: "30px" }}>Kembali ke Dashboard</button>
    </div>
  );
};

export default KelolaBerita;