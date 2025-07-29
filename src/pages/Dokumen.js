// src/pages/Dokumen.js
import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const Dokumen = () => {
  const [dokumen, setDokumen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // State baru untuk pencarian

  useEffect(() => {
    const q = query(collection(db, "dokumen"), orderBy("judul"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dokumenList = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      setDokumen(dokumenList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Logika untuk memfilter dokumen berdasarkan pencarian
  const filteredDokumen = useMemo(() => {
      return dokumen.filter(doc => 
          doc.judul.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [dokumen, searchTerm]);

  // --- Styles Diperbarui ---
  const pageStyle = {
    maxWidth: "800px",
    margin: "40px auto",
    padding: "20px",
  };
  const headingStyle = {
    color: "#00092f", // Warna baru
    fontSize: "32px",
    borderBottom: "3px solid #ffd700", // Aksen emas
    paddingBottom: "10px",
    marginBottom: "30px",
    textAlign: "center",
  };
  const searchInputStyle = {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      borderRadius: '8px',
      border: '1px solid #ccc',
      marginBottom: '30px',
      boxSizing: 'border-box'
  };
  const listStyle = {
    listStyleType: "none",
    paddingLeft: 0,
  };
  const itemStyle = {
    backgroundColor: "#ffffff",
    padding: "15px 20px",
    borderRadius: "8px",
    marginBottom: "15px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.08)",
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px'
  };
  const linkStyle = {
    color: "#00092f", // Warna baru
    fontWeight: "bold",
    textDecoration: "none",
    fontSize: "18px",
  };
  const buttonStyle = {
      padding: '8px 16px',
      backgroundColor: '#00092f',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '6px',
      fontWeight: 'bold',
      whiteSpace: 'nowrap' // Mencegah teks tombol terpotong
  };

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Pusat Dokumen BEM</h1>
      
      <input 
        type="text"
        placeholder="🔍 Cari dokumen..."
        style={searchInputStyle}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <p style={{textAlign: 'center'}}>Memuat dokumen...</p>
      ) : (
        <ul style={listStyle}>
          {filteredDokumen.length > 0 ? (
            filteredDokumen.map((doc) => (
              <li key={doc.id} style={itemStyle}>
                <span style={linkStyle}>
                  📄 {doc.judul}
                </span>
                <a
                  href={doc.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={buttonStyle}
                >
                  Buka Dokumen
                </a>
              </li>
            ))
          ) : (
            <p style={{textAlign: 'center', color: '#666'}}>
              {searchTerm ? 'Dokumen tidak ditemukan.' : 'Belum ada dokumen yang diunggah.'}
            </p>
          )}
        </ul>
      )}
    </div>
  );
};

export default Dokumen;
