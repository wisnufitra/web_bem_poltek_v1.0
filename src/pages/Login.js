// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          
          if (userData.role === 'admin' || userData.role === 'master') {
            navigate("/admin");
          } else if (userData.role === 'panitia') {
            if (userData.eventId) {
              navigate(`/panitia/${userData.eventId}/ringkasan`);
            } else {
              await signOut(auth);
              setError("Akun panitia Anda belum terhubung ke event manapun.");
            }
          } else {
            await signOut(auth);
            setError("Akun Anda belum disetujui atau bukan akun admin/panitia.");
          }
        } else {
          await signOut(auth);
          setError("Akun tidak ditemukan atau telah dihapus.");
        }
      })
      .catch((error) => {
        setError("Email atau password salah.");
      })
      .finally(() => { setLoading(false); });
  };

  // --- Styles Diperbarui ---
  const containerStyle = { maxWidth: "400px", margin: "80px auto", padding: "30px", border: "1px solid #ddd", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" };
  const inputStyle = { width: "calc(100% - 24px)", padding: "12px", marginBottom: "15px", borderRadius: "6px", border: "1px solid #ccc" };
  const buttonStyle = { width: "100%", padding: "12px", backgroundColor: "#00092f", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 'bold' };
  const linkStyle = { color: '#00092f', fontWeight: 'bold' };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", color: "#00092f" }}>Login Admin / Panitia</h2>
      <form onSubmit={handleLogin}>
        {error && <div style={{ color: "red", marginBottom: "15px", textAlign: "center" }}>{error}</div>}
        <div><label>Email:</label><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required /></div>
        <div><label>Password:</label><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required /></div>
        <div style={{textAlign: 'right', marginBottom: '15px'}}><Link to="/lupa-sandi" style={{...linkStyle, fontSize: '14px'}}>Lupa Password?</Link></div>
        <button type="submit" style={buttonStyle} disabled={loading}>{loading ? 'Memproses...' : 'Login'}</button>
      </form>
      <div style={{textAlign: 'center', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
        <p style={{margin: 0}}>Ingin mendaftar sebagai Admin BEM? <Link to="/register" style={linkStyle}>Daftar di sini</Link></p>
        <p style={{margin: 0}}>Ingin mendaftar sebagai Panitia E-Voting? <Link to="/register-panitia" style={linkStyle}>Daftar di sini</Link></p>
      </div>
    </div>
  );
};

export default Login;