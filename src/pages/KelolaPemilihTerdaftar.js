import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logActivity } from '../utils/logActivity';

const prodiOptions = ["Semua", "Teknokimia Nuklir", "Elektronika Instrumentasi", "Elektromekanika"];

const KelolaPemilihTerdaftar = () => {
    const navigate = useNavigate();
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua'); // 'Semua', 'Terverifikasi', 'Menunggu'
    const [prodiFilter, setProdiFilter] = useState('Semua');

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            if (!user) navigate('/login');
        });

        const q = query(collection(db, 'voters'));
        const unsubscribeVoters = onSnapshot(q, (snapshot) => {
            setVoters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeVoters();
        };
    }, [navigate]);

    const filteredVoters = useMemo(() => {
        return voters.filter(voter => {
            const matchesSearch = voter.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  voter.nim.includes(searchTerm) ||
                                  voter.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'Semua' || (statusFilter === 'Terverifikasi' && voter.isVerified) || (statusFilter === 'Menunggu' && !voter.isVerified);
            const matchesProdi = prodiFilter === 'Semua' || voter.prodi === prodiFilter;
            return matchesSearch && matchesStatus && matchesProdi;
        });
    }, [voters, searchTerm, statusFilter, prodiFilter]);

    const handleVerify = async (voterId, voterName, status) => {
        const voterDocRef = doc(db, 'voters', voterId);
        await updateDoc(voterDocRef, { isVerified: status });
        await logActivity(`Mengubah status verifikasi akun untuk ${voterName} menjadi ${status}`);
    };
    
    const handleDelete = async (voterId, voterName) => {
        if (window.confirm(`Yakin ingin menghapus akun pemilih ${voterName}?`)) {
            const voterDocRef = doc(db, 'voters', voterId);
            await deleteDoc(voterDocRef);
            await logActivity(`Menghapus akun pemilih: ${voterName}`);
        }
    };

    const handleVerifyAllFiltered = async () => {
        const votersToVerify = filteredVoters.filter(v => !v.isVerified);
        if (votersToVerify.length === 0) {
            alert("Tidak ada pemilih dengan status 'Menunggu' pada hasil filter saat ini.");
            return;
        }
        if (window.confirm(`Yakin ingin memverifikasi ${votersToVerify.length} akun pemilih yang ditampilkan?`)) {
            const batch = writeBatch(db);
            votersToVerify.forEach(voter => {
                const docRef = doc(db, 'voters', voter.id);
                batch.update(docRef, { isVerified: true });
            });
            await batch.commit();
            await logActivity(`Memverifikasi ${votersToVerify.length} akun pemilih secara massal`);
        }
    };

    const containerStyle = { maxWidth: '1000px', margin: '40px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
    const cardStyle = { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px' };
    const buttonStyle = { border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', color: 'white', marginLeft: '10px' };
    const filterContainerStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' };
    const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' };

    return (
        <div style={{padding: '20px'}}>
            <div style={containerStyle}>
                <h1 style={{ color: '#004d40', textAlign: 'center' }}>Verifikasi Akun Pemilih</h1>
                <p style={{textAlign: 'center', color: '#666'}}>Setujui atau tolak akun pemilih yang baru mendaftar.</p>
                
                <div style={filterContainerStyle}>
                    <input style={inputStyle} placeholder="Cari nama, NIM, atau email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <select style={inputStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="Semua">Semua Status</option>
                        <option value="Terverifikasi">Terverifikasi</option>
                        <option value="Menunggu">Menunggu</option>
                    </select>
                    <select style={inputStyle} value={prodiFilter} onChange={(e) => setProdiFilter(e.target.value)}>
                        {prodiOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'flex-end'}}>
                    <button onClick={handleVerifyAllFiltered} style={{...buttonStyle, backgroundColor: 'green'}}>Verifikasi Semua Hasil Filter</button>
                </div>

                {loading ? <p>Memuat...</p> : filteredVoters.map(voter => (
                    <div key={voter.id} style={{...cardStyle, borderLeft: `5px solid ${voter.isVerified ? '#4CAF50' : '#FF9800'}`}}>
                        <p><strong>{voter.namaLengkap}</strong> ({voter.nim})</p>
                        <small>{voter.prodi} | {voter.email}</small><br/>
                        <small>Status: 
                            <span style={{fontWeight: 'bold', color: voter.isVerified ? '#4CAF50' : '#FF9800'}}>
                                {voter.isVerified ? ' Terverifikasi' : ' Menunggu Persetujuan'}
                            </span>
                        </small>
                        <div style={{marginTop: '10px'}}>
                            {!voter.isVerified && <button onClick={() => handleVerify(voter.id, voter.namaLengkap, true)} style={{...buttonStyle, backgroundColor: '#4CAF50'}}>Verifikasi</button>}
                            {voter.isVerified && <button onClick={() => handleVerify(voter.id, voter.namaLengkap, false)} style={{...buttonStyle, backgroundColor: '#FF9800'}}>Batalkan</button>}
                            <button onClick={() => handleDelete(voter.id, voter.namaLengkap)} style={{...buttonStyle, backgroundColor: '#f44336'}}>Hapus</button>
                        </div>
                    </div>
                ))}
                <button onClick={() => navigate(-1)} style={{ marginTop: "30px", padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px' }}>
                    Kembali
                </button>
            </div>
        </div>
    );
};

export default KelolaPemilihTerdaftar;