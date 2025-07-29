// src/components/Navbar.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import logo from "../assets/logo-bempoltek2.png";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        if (!event.target.closest('.mobile-hamburger')) {
            setMenuOpen(false);
        }
      }
    };
    const handleScroll = () => {
      if (menuOpen) setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    if (menuOpen) window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [menuOpen]);

  useEffect(() => {
    let unsubscribeProfile;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData(null);
          }
        });
      } else {
        setUserData(null);
        if (unsubscribeProfile) unsubscribeProfile();
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => {
      closeAllMenus();
      navigate("/login");
    }).catch((error) => console.error("Logout Error:", error));
  };

  const closeAllMenus = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // --- Styles ---
  const navStyle = { position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, padding: "5px 15px", backgroundColor: "#00092f", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" };
  const logoContainerStyle = { display: "flex", alignItems: "center", textDecoration: 'none', color: 'white' };
  const linkStyle = { color: "white", marginLeft: "20px", textDecoration: "none", fontWeight: "bold" };
  const profileContainerStyle = { position: 'relative', marginLeft: '20px' };
  const profileButtonStyle = { cursor: 'pointer', background: 'none', border: 'none', padding: '0', display: 'flex', alignItems: 'center' };
  const dropdownStyle = { position: 'absolute', top: '65px', right: 0, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1001, width: '220px', overflow: 'hidden' };
  const dropdownLinkStyle = { display: 'block', padding: '12px 20px', textDecoration: 'none', color: '#333' };
  const dropdownButtonStyle = { ...dropdownLinkStyle, background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' };
  const hamburgerStyle = { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', zIndex: 1001 };
  const mobileMenuContainerStyle = { position: 'fixed', top: '90px', right: '15px', width: '250px', backgroundColor: '#00092f', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 999 };
  const mobileLinkStyle = { color: 'white', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold' };

  const mediaQueries = `
    @media (max-width: 900px) { .desktop-links { display: none !important; } .mobile-hamburger { display: block; } }
    @media (min-width: 901px) { .desktop-links { display: flex; } .mobile-hamburger { display: none; } }
  `;

  return (
    <>
      <style>{mediaQueries}</style>
      <nav style={navStyle}>
        <Link to="/" style={logoContainerStyle} onClick={closeAllMenus}>
          <img src={logo} alt="Logo BEM" style={{ height: "80px", marginRight: "0px" }} />
          <h2 style={{ margin: 0, fontSize: "18px" }}></h2>
        </Link>
        
        <div className="desktop-links" style={{ alignItems: 'center' }}>
          <Link to="/" style={linkStyle}>Beranda</Link>
          <Link to="/struktur" style={linkStyle}>Struktur</Link>
          <Link to="/layanan" style={linkStyle}>Layanan</Link>
          <Link to="/berita" style={linkStyle}>Berita</Link>
          <Link to="/dokumen" style={linkStyle}>Dokumen</Link>
          <Link to="/tentang" style={linkStyle}>Tentang</Link>
          <Link to="/pemilihan" style={{...linkStyle, backgroundColor: '#ff9800', padding: '8px 12px', borderRadius: '6px' }}>E-Voting</Link>
          {user && userData ? (
            <div style={profileContainerStyle} ref={dropdownRef}>
              <button style={profileButtonStyle} onClick={toggleDropdown}>
                {userData.foto ? (
                  <img src={userData.foto} alt="Profil" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                )}
              </button>
              {dropdownOpen && (
                <div style={dropdownStyle}>
                  { (userData.role === 'admin' || userData.role === 'master') && (
                    <>
                      <Link to="/admin" style={dropdownLinkStyle} onClick={closeAllMenus}>Dashboard BEM</Link>
                      <Link to="/admin/profil" style={dropdownLinkStyle} onClick={closeAllMenus}>Edit Profil</Link>
                      <Link to="/admin/histori" style={dropdownLinkStyle} onClick={closeAllMenus}>Histori Aktivitas</Link>
                      {userData.role === 'master' && (
                        <Link to="/admin/kelola-admin" style={dropdownLinkStyle} onClick={closeAllMenus}>Kelola Admin</Link>
                      )}
                    </>
                  )}
                  { userData.role === 'panitia' && userData.eventId && (
                    <>
                      <Link to={`/panitia/${userData.eventId}/ringkasan`} style={dropdownLinkStyle} onClick={closeAllMenus}>Dashboard Event</Link>
                      <Link to="/admin/profil" style={dropdownLinkStyle} onClick={closeAllMenus}>Edit Profil Panitia</Link>
                    </>
                  )}
                  <button onClick={handleLogout} style={dropdownButtonStyle}>Logout</button>
                </div>
              )}
            </div>
          ) : user ? null : (
            <Link to="/login" style={linkStyle}>Login</Link>
          )}
        </div>
        
        <button className="mobile-hamburger" style={hamburgerStyle} onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </nav>

      {menuOpen && (
        <div style={mobileMenuContainerStyle} ref={mobileMenuRef}>
          <Link to="/" style={mobileLinkStyle} onClick={closeAllMenus}>Beranda</Link>
          <Link to="/struktur" style={mobileLinkStyle} onClick={closeAllMenus}>Struktur</Link>
          <Link to="/layanan" style={mobileLinkStyle} onClick={closeAllMenus}>Layanan</Link>
          <Link to="/berita" style={mobileLinkStyle} onClick={closeAllMenus}>Berita</Link>
          <Link to="/dokumen" style={mobileLinkStyle} onClick={closeAllMenus}>Dokumen</Link>
          <Link to="/tentang" style={mobileLinkStyle} onClick={closeAllMenus}>Tentang</Link>
          <Link to="/pemilihan" style={mobileLinkStyle} onClick={closeAllMenus}>E-Voting</Link>
          <hr style={{borderColor: 'rgba(255,255,255,0.2)'}} />
          {user && userData ? (
            <>
              { (userData.role === 'admin' || userData.role === 'master') && (
                <>
                  <Link to="/admin" style={mobileLinkStyle} onClick={closeAllMenus}>Dashboard BEM</Link>
                  <Link to="/admin/profil" style={mobileLinkStyle} onClick={closeAllMenus}>Edit Profil</Link>
                  <Link to="/admin/histori" style={mobileLinkStyle} onClick={closeAllMenus}>Histori Aktivitas</Link>
                  {userData.role === 'master' && (<Link to="/admin/kelola-admin" style={mobileLinkStyle} onClick={closeAllMenus}>Kelola Admin</Link>)}
                </>
              )}
              { userData.role === 'panitia' && userData.eventId && (
                <>
                  <Link to={`/panitia/${userData.eventId}/ringkasan`} style={mobileLinkStyle} onClick={closeAllMenus}>Dashboard Event</Link>
                  <Link to="/admin/profil" style={mobileLinkStyle} onClick={closeAllMenus}>Edit Profil Panitia</Link>
                </>
              )}
              <a href="#" onClick={handleLogout} style={mobileLinkStyle}>Logout</a>
            </>
          ) : (
            <Link to="/login" style={mobileLinkStyle} onClick={closeAllMenus}>Login</Link>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;