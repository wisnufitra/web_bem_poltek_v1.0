// src/pages/Layanan.js
import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const Layanan = () => {
  const [layanan, setLayanan] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "layanan"), orderBy("judul"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLayanan(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleLayanan = (index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };
  
  const createDirectLink = (embedLink) => {
    if (embedLink.includes('?embedded=true')) {
      return embedLink.replace('?embedded=true', '');
    }
    return embedLink;
  };

  // --- Styles Diperbarui ---
  const pageStyle = {
    padding: "40px 20px",
    maxWidth: "800px",
    margin: "0 auto",
  };
  const titleStyle = {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "30px",
    textAlign: "center",
    color: "#00092f", // Warna baru
  };
  const accordionContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  };
  const itemStyle = {
    border: "1px solid #ddd", // Border lebih soft
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
    overflow: "hidden",
    transition: "box-shadow 0.3s ease",
  };
  const buttonStyle = {
    width: "100%",
    textAlign: "left",
    padding: "16px 20px",
    backgroundColor: "#00092f", // Warna baru
    color: "white",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };
  const contentStyle = {
    padding: "20px",
    backgroundColor: "white",
  };
  const iframeStyle = {
    width: "100%",
    height: "500px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  };
  const linkBukaStyle = {
      color: '#00092f', // Warna baru
      fontWeight: 'bold',
      textDecoration: 'underline'
  };

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>Layanan BEM Poltek Nuklir</h1>
      {loading ? <p style={{textAlign: 'center'}}>Memuat layanan...</p> : (
        <div style={accordionContainerStyle}>
          {layanan.map((item, index) => (
            <div key={item.id} style={itemStyle}>
              <button onClick={() => toggleLayanan(index)} style={buttonStyle}>
                <span>{item.emoji} {item.judul}</span>
                <span>{activeIndex === index ? '−' : '+'}</span>
              </button>
              {activeIndex === index && (
                <div style={contentStyle}>
                  <iframe
                    src={item.link}
                    title={item.judul}
                    style={iframeStyle}
                    allowFullScreen
                  ></iframe>
                  <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
                    Jika formulir tidak muncul,{' '}
                    <a 
                      href={createDirectLink(item.link)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={linkBukaStyle}
                    >
                      buka di tab baru
                    </a>.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Layanan;