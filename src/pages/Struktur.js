// src/pages/Struktur.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, onSnapshot, query } from "firebase/firestore";
import StrukturCard from "../components/StrukturCard";

const Struktur = () => {
  const [struktur, setStruktur] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "struktur"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      const predefinedOrder = [
        "Pengurus Harian", "Inspektorat Jenderal", "Sekretariat Jenderal",
        "Kementerian Keuangan", "Kementerian Dalam Negeri", "Kementerian Luar Negeri",
        "Kementerian Pemuda dan Olahraga (PORA)", "Kementerian PSDM",
        "Kementerian Komunikasi dan Informasi (KOMINFO)", "Kementerian Ekonomi Kreatif"
      ];

      const sortedData = data.sort((a, b) => {
          return predefinedOrder.indexOf(a.divisi) - predefinedOrder.indexOf(b.divisi);
      });

      setStruktur(sortedData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const jabatanPimpinan = ["Presiden Mahasiswa", "Wakil Presiden Mahasiswa", "Sekretaris Jendral", "Wakil Sekretaris Jendral", "Kepala Menteri", "Wakil Menteri"];

  // --- STYLES DIPERBARUI ---
  const pageStyle = { padding: "40px 20px", maxWidth: "1200px", margin: "0 auto", backgroundColor: '#f9f9f9', borderRadius: '12px' };
  const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "24px", padding: "20px 0" };
  const divisiTitleStyle = { 
      textAlign: "center", 
      fontSize: "28px", 
      fontWeight: "bold", 
      color: "#00092f", // Warna baru
      marginTop: "40px", 
      marginBottom: "20px", 
      borderBottom: "3px solid #ffd700", // Aksen emas
      paddingBottom: "10px", 
      display: "inline-block" 
  };
  const titleContainerStyle = { textAlign: "center" };
  const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 };
  const modalContentStyle = { 
      backgroundColor: "white", 
      padding: "30px", 
      borderRadius: "10px", 
      width: "90%", 
      maxWidth: "400px", 
      textAlign: 'center',
      borderTop: '5px solid #00092f' // Aksen biru dongker
  };

  return (
    <div style={{padding: '20px'}}>
        <div style={pageStyle}>
        <h1 style={{ textAlign: "center", fontSize: "32px", marginBottom: "40px", color: "#00092f" }}>Struktur Organisasi BEM Poltek Nuklir</h1>

        {loading ? (
            <p style={{textAlign: 'center'}}>Memuat struktur organisasi...</p>
        ) : (
            struktur.map((divisiData) => {
            if (!divisiData.anggota || divisiData.anggota.length === 0) {
                return null;
            }

            const pimpinan = divisiData.anggota.filter(p => jabatanPimpinan.includes(p.jabatan));
            const staff = divisiData.anggota.filter(p => !pimpinan.includes(p));

            return (
                <div key={divisiData.id}>
                <div style={titleContainerStyle}><h2 style={divisiTitleStyle}>{divisiData.divisi}</h2></div>
                <div style={gridStyle}>
                    {pimpinan.map((item, idx) => <StrukturCard key={idx} anggota={item} onCardClick={() => setSelectedMember(item)} />)}
                </div>
                {staff.length > 0 && (
                    <div style={gridStyle}>
                    {staff.map((item, idx) => <StrukturCard key={idx} anggota={item} onCardClick={() => setSelectedMember(item)} />)}
                    </div>
                )}
                </div>
            );
            })
        )}

        {selectedMember && (
            <div style={modalOverlayStyle} onClick={() => setSelectedMember(null)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <img src={selectedMember.foto} alt={selectedMember.nama} style={{ width: "150px", height: "150px", borderRadius: "50%", objectFit: 'cover', border: '4px solid #00092f', margin: '0 auto 20px' }} />
                <h2 style={{color: '#00092f', margin: '0 0 5px'}}>{selectedMember.nama}</h2>
                <p style={{fontWeight: 'bold', margin: '0 0 20px'}}>{selectedMember.jabatan}</p>
                {selectedMember.nim && <p><strong>NIM:</strong> {selectedMember.nim}</p>}
                {selectedMember.prodi && <p><strong>Prodi:</strong> {selectedMember.prodi}</p>}
                {selectedMember.email && <p><strong>Email:</strong> {selectedMember.email}</p>}
                {selectedMember.instagram && <p><strong>Instagram:</strong> @{selectedMember.instagram}</p>}
                {selectedMember.nohp && <p><strong>No. HP:</strong> {selectedMember.nohp}</p>}
                <button onClick={() => setSelectedMember(null)} style={{marginTop: '20px', padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px' }}>Tutup</button>
            </div>
            </div>
        )}
        </div>
    </div>
  );
};

export default Struktur;