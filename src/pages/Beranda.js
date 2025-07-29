// src/pages/Beranda.js
import React from "react";
import { Link } from "react-router-dom";
import BeritaTerbaru from "../components/BeritaTerbaru";
import heroImage from "../assets/hero-image.JPG"; // Pastikan Anda memiliki gambar ini di folder assets

const Beranda = () => {
  // --- Styles ---
  const heroStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: 'white',
    minHeight: '60vh',
    padding: '40px 20px',
    backgroundImage: `linear-gradient(rgba(0, 9, 47, 0.7), rgba(0, 9, 47, 0.7)), url(${heroImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const heroContentStyle = {
    maxWidth: '800px',
  };

  const titleStyle = {
    fontSize: "48px",
    fontWeight: "bold",
    color: "#FFFFFF", // Putih agar kontras dengan latar belakang
    marginBottom: "16px",
    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
  };

  const subtitleStyle = {
    fontSize: "22px",
    lineHeight: "1.6",
    marginBottom: "40px",
    color: '#c9caca', // Abu-abu muda
  };

  const buttonGroupStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    flexWrap: "wrap",
  };

  const buttonStyle = {
    padding: "12px 24px",
    backgroundColor: "#00092f", // Biru dongker
    color: "#fff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    border: "2px solid #ffd700", // Aksen emas
    transition: "background-color 0.3s, color 0.3s",
  };

  const buttonHoverStyle = {
    backgroundColor: "#ffd700",
    color: "#00092f",
  };

  return (
    <div>
      <div style={heroStyle}>
        <div style={heroContentStyle}>
          <h1 style={titleStyle}>Selamat Datang di Website Resmi BEM KM Poltek Nuklir</h1>
          <p style={subtitleStyle}>
            Mengabdi dengan Aksi, Berkarya untuk Negeri. Bersama membangun KM Poltek Nuklir yang lebih baik.
          </p>
          <div style={buttonGroupStyle}>
            <Link 
              to="/tentang" 
              style={buttonStyle}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
            >
              Tentang Kami
            </Link>
            <Link 
              to="/struktur" 
              style={{...buttonStyle, backgroundColor: 'transparent'}}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Lihat Struktur
            </Link>
          </div>
        </div>
      </div>
      <BeritaTerbaru />
    </div>
  );
};

export default Beranda;
