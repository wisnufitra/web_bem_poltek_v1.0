// src/pages/Berita.js
import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import ImageSlider from "../components/ImageSlider";

const Berita = () => {
  const [berita, setBerita] = useState([]);
  const [kategoriFilter, setKategoriFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dibuatPada");
  const [loading, setLoading] = useState(true); // Tambahkan state loading
  const itemsPerPage = 5;

  useEffect(() => {
    const q = query(collection(db, "berita"), orderBy("dibuatPada", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const beritaList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBerita(beritaList);
      setLoading(false); // Matikan loading setelah data diterima
    });
    return () => unsubscribe();
  }, []);

  const processedBerita = useMemo(() => {
    return berita
      .filter(item => kategoriFilter === "Semua" || item.kategori === kategoriFilter)
      .filter(item => item.judul.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'tanggalKegiatan') {
          if (a.tanggalKegiatan && !b.tanggalKegiatan) return -1;
          if (!a.tanggalKegiatan && b.tanggalKegiatan) return 1;
          return new Date(b.tanggalKegiatan) - new Date(a.tanggalKegiatan);
        }
        return (b.dibuatPada?.seconds || 0) - (a.dibuatPada?.seconds || 0);
      });
  }, [berita, kategoriFilter, searchTerm, sortBy]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedBerita.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedBerita.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- STYLES DIPERBARUI ---
  const containerStyle = { maxWidth: "900px", margin: "40px auto", padding: "20px" };
  const pageTitleStyle = { fontSize: "32px", color: "#00092f", textAlign: "center", marginBottom: "30px", borderBottom: "3px solid #ffd700", paddingBottom: "10px" };
  const cardStyle = { border: "1px solid #ddd", borderRadius: "12px", padding: "20px", marginBottom: "20px", backgroundColor: "#fff", boxShadow: "0 4px 8px rgba(0,0,0,0.05)" };
  const controlsContainerStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' };
  const inputStyle = { padding: "8px", borderRadius: '6px', border: '1px solid #ccc', minWidth: '200px' };
  const metaStyle = { fontSize: "12px", color: "#888", marginBottom: "15px", borderLeft: '3px solid #00092f', paddingLeft: '10px' };
  const deskripsiStyle = { textAlign: 'justify', whiteSpace: 'pre-wrap', lineHeight: '1.6' };
  const instagramButtonStyle = { display: 'inline-block', marginTop: '15px', padding: '10px 15px', backgroundColor: '#E1306C', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' };
  const paginationContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '30px' };
  const pageButtonStyle = { margin: '0 5px', padding: '8px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px' };
  const activePageButtonStyle = { ...pageButtonStyle, backgroundColor: '#00092f', color: 'white', borderColor: '#00092f' };

  return (
    <div style={containerStyle}>
      <h1 style={pageTitleStyle}>Arsip Berita dan Kegiatan</h1>
      <div style={controlsContainerStyle}>
        <input type="text" placeholder="Cari judul berita..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={inputStyle} />
        <div>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Kategori:</label>
          <select value={kategoriFilter} onChange={(e) => setKategoriFilter(e.target.value)} style={{ padding: "8px", borderRadius: '6px', border: '1px solid #ccc' }}>
            <option value="Semua">Semua</option>
            <option value="Umum">Umum</option>
            <option value="Kegiatan">Kegiatan</option>
            <option value="Informasi">Informasi</option>
            <option value="Pengumuman">Pengumuman</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Urutkan:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "8px", borderRadius: '6px', border: '1px solid #ccc' }}>
            <option value="dibuatPada">Terbaru</option>
            <option value="tanggalKegiatan">Tanggal Kegiatan</option>
          </select>
        </div>
      </div>

      {loading ? <p style={{textAlign: 'center'}}>Memuat berita...</p> : currentItems.map((item) => (
        <div key={item.id} style={cardStyle}>
          {item.gambarList && item.gambarList.length > 0 && (
            <ImageSlider images={item.gambarList} />
          )}
          <h2 style={{fontSize: "24px", color: "#00092f", marginBottom: "10px"}}>{item.judul}</h2>
          <div style={metaStyle}>
            <div>Dipublikasikan: {formatTimestamp(item.dibuatPada)} oleh <strong>{item.dibuatOleh}</strong></div>
            {item.dieditPada && <div>Terakhir diedit: {formatTimestamp(item.dieditPada)} oleh <strong>{item.dieditOleh}</strong></div>}
            {item.tanggalKegiatan && <div>Tanggal Kegiatan: <strong>{item.tanggalKegiatan}</strong></div>}
            <div>Kategori: {item.kategori}</div>
          </div>
          <p style={deskripsiStyle}>{item.deskripsi}</p>
          {item.linkInstagram && (
            <a href={item.linkInstagram} target="_blank" rel="noopener noreferrer" style={instagramButtonStyle}>
              Lihat di Instagram
            </a>
          )}
        </div>
      ))}

      {totalPages > 1 && (
        <div style={paginationContainerStyle}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
            <button key={number} onClick={() => paginate(number)} style={currentPage === number ? activePageButtonStyle : pageButtonStyle}>
              {number}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Berita;