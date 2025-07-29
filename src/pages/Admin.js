// src/pages/Admin.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { collection, getDocs, doc, onSnapshot, query, orderBy, limit } from "firebase/firestore";

const Admin = () => {
  const navigate = useNavigate();
  const [profil, setProfil] = useState(null);
  const [stats, setStats] = useState({ anggota: 0, dokumen: 0, layanan: 0, berita: 0 });
  const [histori, setHistori] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfil(docSnap.data());
          }
        });

        const fetchStats = async () => {
          try {
            const [strukturSnap, dokumenSnap, layananSnap, beritaSnap] = await Promise.all([
              getDocs(collection(db, 'struktur')),
              getDocs(collection(db, 'dokumen')),
              getDocs(collection(db, 'layanan')),
              getDocs(collection(db, 'berita'))
            ]);
            const totalAnggota = strukturSnap.docs.reduce((acc, doc) => acc + (doc.data().anggota?.length || 0), 0);
            setStats({
              anggota: totalAnggota,
              dokumen: dokumenSnap.size,
              layanan: layananSnap.size,
              berita: beritaSnap.size,
            });
          } catch (error) {
            console.error("Gagal memuat statistik:", error);
          }
        };
        fetchStats();

        const historiQuery = query(collection(db, 'histori'), orderBy('timestamp', 'desc'), limit(5));
        const unsubscribeHistori = onSnapshot(historiQuery, (snapshot) => {
          const historiList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setHistori(historiList);
        });
        
        return () => {
          unsubscribeHistori();
          unsubProfile();
        };
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/login"));
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleString('id-ID');
  };

  // --- Styles Diperbarui ---
  const managementButtonStyle = { display: "block", width: "100%", padding: "12px", marginTop: "10px", backgroundColor: "#00092f", color: "white", border: "none", borderRadius: "6px", textAlign: "center", textDecoration: "none", cursor: "pointer", fontSize: '16px', transition: 'background-color 0.3s' };
  const gridContainerStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" };
  const cardStyle = { backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" };
  const cardTitleStyle = { fontSize: "20px", fontWeight: "bold", color: "#00092f", marginBottom: "16px", borderBottom: "2px solid #f0f0f0", paddingBottom: "8px" };
  const cardContentStyle = { fontSize: "16px", color: "#333" };
  const contentWrapperStyle = { maxWidth: '1200px', margin: '0 auto' };
  
  const headerStyle = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    gap: isMobile ? '20px' : '0',
  };
  const titleStyle = {
    color: "#00092f",
    fontSize: isMobile ? "28px" : "32px",
    fontWeight: "bold",
    margin: 0,
    textAlign: 'center'
  };
  const headerButtonsStyle = {
    display: 'flex',
    gap: '10px'
  }

  return (
    <div style={{ backgroundColor: "#f4f7f6", minHeight: "calc(100vh - 60px)", padding: isMobile ? "20px" : "40px" }}>
      <div style={contentWrapperStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>Dashboard Admin</h1>
          <div style={headerButtonsStyle}>
            <button onClick={() => navigate('/admin/profil')} style={{ padding: "10px 20px", backgroundColor: "#1e88e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Profil</button>
            <button onClick={handleLogout} style={{ padding: "10px 20px", backgroundColor: "#d32f2f", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Logout</button>
          </div>
        </header>
        <div style={gridContainerStyle}>
          <div style={{...cardStyle, gridColumn: "1 / -1", backgroundColor: '#e3f2fd' }}>
            <h2 style={cardTitleStyle}>Selamat Datang, {profil ? profil.namaTampilan || profil.email : 'Admin'}!</h2>
            <p style={cardContentStyle}>Anda telah berhasil login. Gunakan panel ini untuk mengelola konten website BEM Poltek Nuklir.</p>
          </div>
          
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Statistik Cepat</h2>
            <p style={cardContentStyle}><strong>Total Anggota:</strong> {stats.anggota}</p>
            <p style={cardContentStyle}><strong>Total Dokumen:</strong> {stats.dokumen}</p>
            <p style={cardContentStyle}><strong>Total Layanan:</strong> {stats.layanan}</p>
            <p style={cardContentStyle}><strong>Total Berita:</strong> {stats.berita}</p>
          </div>
          
          <div style={{...cardStyle, gridColumn: isMobile ? "1 / -1" : "span 2"}}>
              <h2 style={cardTitleStyle}>Aktivitas Terbaru</h2>
              {histori.length > 0 ? (
                histori.map(item => (
                  <div key={item.id} style={{ borderBottom: '1px solid #f0f0f0', padding: '8px 0' }}>
                    <p style={{ margin: 0 }}><strong>{item.action}</strong></p>
                    <small style={{ color: '#666' }}>Oleh: {item.oleh} - {formatTimestamp(item.timestamp)}</small>
                  </div>
                ))
              ) : <p>Belum ada aktivitas.</p>}
          </div>

          <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
            <h2 style={cardTitleStyle}>Manajemen Konten</h2>
            <div style={gridContainerStyle}>
              <button style={managementButtonStyle} onClick={() => navigate('/admin/struktur')}>Kelola Struktur</button>
              <button style={managementButtonStyle} onClick={() => navigate("/admin/dokumen")}>Kelola Dokumen</button>
              <button style={managementButtonStyle} onClick={() => navigate("/admin/layanan")}>Kelola Layanan</button>
              <button style={managementButtonStyle} onClick={() => navigate("/admin/kelola-berita")}>Kelola Berita</button>
              <button style={{...managementButtonStyle, backgroundColor: '#673ab7'}} onClick={() => navigate('/admin/kelola-tentang')}>Kelola Halaman Tentang</button>
              
              {profil && profil.role === 'master' && (
                <button 
                  style={{...managementButtonStyle, backgroundColor: '#ffd700', color: '#00092f', gridColumn: '1 / -1'}} 
                  onClick={() => navigate("/admin-master/voting")}>
                  Kelola Permintaan E-Voting
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;