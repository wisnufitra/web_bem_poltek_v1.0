// src/App.js
import React, { useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { auth } from "./firebase/firebaseConfig"; // Pastikan path ini benar
import { onAuthStateChanged, signOut } from "firebase/auth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Import halaman utama
import Beranda from "./pages/Beranda";
import Layanan from "./pages/Layanan";
import Struktur from "./pages/Struktur"; 
import Dokumen from "./pages/Dokumen";
import Tentang from "./pages/Tentang";
import Berita from "./pages/Berita";

// Import halaman autentikasi
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import RegisterPanitia from './pages/RegisterPanitia';
import RegisterPemilih from './pages/RegisterPemilih';

// Import halaman admin utama
import Admin from "./pages/Admin";
import AdminProfil from "./pages/AdminProfil";
import AdminHistori from "./pages/AdminHistori";
import KelolaAdmin from "./pages/KelolaAdmin";
import AdminStruktur from "./pages/AdminStruktur";
import AdminDokumen from "./pages/AdminDokumen";
import AdminLayanan from "./pages/AdminLayanan";
import KelolaBerita from "./pages/KelolaBerita";
import KelolaTentang from "./pages/KelolaTentang";

// Import halaman E-Voting
import DaftarPemilihan from "./pages/DaftarPemilihan";
import RequestPemilihan from "./pages/RequestPemilihan";
import AdminMasterVoting from "./pages/AdminMasterVoting";
import LoginPemilih from './pages/LoginPemilih';
import DashboardPemilih from './pages/DashboardPemilih';
import BilikSuara from './pages/BilikSuara';
import HasilPemilihan from './pages/HasilPemilihan';

// Import layout dan halaman panitia
import PanitiaLayout from "./layouts/PanitiaLayout";
import PanitiaRingkasan from "./pages/panitia/PanitiaRingkasan";
import PanitiaPengaturan from "./pages/panitia/PanitiaPengaturan";
import PanitiaKelolaKandidat from "./pages/panitia/PanitiaKelolaKandidat";
import PanitiaKelolaPemilih from "./pages/panitia/PanitiaKelolaPemilih";
import KelolaPemilihTerdaftar from './pages/KelolaPemilihTerdaftar'; // Import baru

// Komponen baru untuk menangani logika utama aplikasi, termasuk logout otomatis
const AppContent = () => {
  const navigate = useNavigate();

  // --- LOGIKA BARU UNTUK LOGOUT OTOMATIS ---
  const idleTimer = useRef(null);
  const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 menit dalam milidetik

  const resetIdleTimer = () => {
    // Hapus timer yang lama
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    // Set timer baru
    idleTimer.current = setTimeout(() => {
      // Cek apakah masih ada user yang login sebelum logout
      if (auth.currentUser) {
        signOut(auth).then(() => {
          alert("Anda telah logout secara otomatis karena tidak ada aktivitas.");
          navigate('/login');
        });
      }
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    // Listener untuk status login
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Jika user login, mulai timer dan dengarkan aktivitas
        resetIdleTimer();
        window.addEventListener('mousemove', resetIdleTimer);
        window.addEventListener('mousedown', resetIdleTimer);
        window.addEventListener('keydown', resetIdleTimer);
      } else {
        // Jika user logout, hapus timer dan listener
        if (idleTimer.current) {
          clearTimeout(idleTimer.current);
        }
        window.removeEventListener('mousemove', resetIdleTimer);
        window.removeEventListener('mousedown', resetIdleTimer);
        window.removeEventListener('keydown', resetIdleTimer);
      }
    });

    // Cleanup saat komponen ditutup
    return () => {
      unsubscribe();
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('mousedown', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
    };
  }, [navigate]);
  // --- AKHIR LOGIKA BARU ---

  return (
    <main style={{ flex: 1, paddingTop: "80px" }}>
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<Beranda />} />
        <Route path="/struktur" element={<Struktur />} />
        <Route path="/layanan" element={<Layanan />} />
        <Route path="/berita" element={<Berita />} />
        <Route path="/dokumen" element={<Dokumen />} />
        <Route path="/tentang" element={<Tentang />} />
        
        {/* Rute Autentikasi */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-panitia" element={<RegisterPanitia />} />
        <Route path="/register-pemilih" element={<RegisterPemilih />} />
        <Route path="/lupa-sandi" element={<ForgotPassword />} />

        {/* Rute Admin Utama */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/profil" element={<AdminProfil />} />
        <Route path="/admin/histori" element={<AdminHistori />} />
        <Route path="/admin/kelola-admin" element={<KelolaAdmin />} />
        <Route path="/admin/struktur" element={<AdminStruktur />} />
        <Route path="/admin/dokumen" element={<AdminDokumen />} />
        <Route path="/admin/layanan" element={<AdminLayanan />} />
        <Route path="/admin/kelola-berita" element={<KelolaBerita />} />
        <Route path="/admin/kelola-tentang" element={<KelolaTentang />} />

        {/* Rute E-Voting */}
        <Route path="/pemilihan" element={<DaftarPemilihan />} />
        <Route path="/request-pemilihan" element={<RequestPemilihan />} />
        <Route path="/admin-master/voting" element={<AdminMasterVoting />} />
        <Route path="/login-pemilih" element={<LoginPemilih />} />
        <Route path="/dashboard-pemilih" element={<DashboardPemilih />} />
        <Route path="/voting/:eventId" element={<BilikSuara />} />
        <Route path="/admin/kelola-pemilih-terdaftar" element={<KelolaPemilihTerdaftar />} /> {/* <-- RUTE BARU */}
        <Route path="/hasil/:eventId" element={<HasilPemilihan />} /> {/* <-- RUTE BARU */}
        {/* Rute Bersarang untuk Dashboard Panitia */}
        <Route path="/panitia/:eventId" element={<PanitiaLayout />}>
          <Route index element={<Navigate to="ringkasan" replace />} />
          <Route path="ringkasan" element={<PanitiaRingkasan />} />
          <Route path="pengaturan" element={<PanitiaPengaturan />} />
          <Route path="kandidat" element={<PanitiaKelolaKandidat />} />
          <Route path="pemilih" element={<PanitiaKelolaPemilih />} />
        </Route>
      </Routes>
    </main>
  );
}

function App() {
  return (
    <Router>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />
        <AppContent />
        <Footer />
      </div>
    </Router>
  );
}

export default App;
