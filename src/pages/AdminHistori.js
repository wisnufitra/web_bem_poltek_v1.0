// src/pages/AdminHistori.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logActivity } from '../utils/logActivity';

const AdminHistori = () => {
    const navigate = useNavigate();
    const [histori, setHistori] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [userRole, setUserRole] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]); // State baru untuk item yang dicentang
    const itemsPerPage = 10;

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserRole(docSnap.data().role);
                    }
                });
            } else {
                navigate('/login');
            }
        });

        const q = query(collection(db, 'histori'), orderBy('timestamp', 'desc'));
        const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHistori(list);
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeFirestore();
        };
    }, [navigate]);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Waktu tidak tersedia';
        return new Date(timestamp.seconds * 1000).toLocaleString('id-ID', {
            dateStyle: 'full',
            timeStyle: 'short'
        });
    };

    // --- FUNGSI BARU UNTUK SISTEM CENTANG ---
    const handleSelectItem = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleSelectAllOnPage = () => {
        const allItemIdsOnPage = currentItems.map(item => item.id);
        const allSelected = allItemIdsOnPage.every(id => selectedItems.includes(id));
        
        if (allSelected) {
            // Jika semua sudah terpilih, batalkan pilihan
            setSelectedItems(prev => prev.filter(id => !allItemIdsOnPage.includes(id)));
        } else {
            // Jika belum, pilih semua
            setSelectedItems(prev => [...new Set([...prev, ...allItemIdsOnPage])]);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;
        if (window.confirm(`Anda yakin ingin menghapus ${selectedItems.length} log aktivitas yang dipilih?`)) {
            setLoading(true);
            const batch = writeBatch(db);
            selectedItems.forEach(id => {
                const docRef = doc(db, 'histori', id);
                batch.delete(docRef);
            });
            await batch.commit();
            await logActivity(`Menghapus ${selectedItems.length} log aktivitas`);
            setSelectedItems([]); // Kosongkan pilihan setelah dihapus
            setLoading(false);
        }
    };

    const handleClearAll = async () => {
        if (window.confirm("ANDA YAKIN ingin menghapus SEMUA histori aktivitas? Tindakan ini tidak dapat diurungkan.")) {
            setLoading(true);
            const historiCollectionRef = collection(db, 'histori');
            const snapshot = await getDocs(historiCollectionRef);
            const batch = writeBatch(db);
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            await logActivity("Menghapus semua histori aktivitas");
            setLoading(false);
        }
    };

    // --- LOGIKA PAGINASI LANJUTAN ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = histori.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(histori.length / itemsPerPage);

    const renderPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
        } else {
            pageNumbers.push(1);
            if (currentPage > 3) pageNumbers.push('...');
            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);
            for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
            if (currentPage < totalPages - 2) pageNumbers.push('...');
            pageNumbers.push(totalPages);
        }
        return pageNumbers;
    };

    const paginate = (pageNumber) => {
        if (typeof pageNumber === 'number') setCurrentPage(pageNumber);
    };

    // --- STYLES ---
    const containerStyle = { maxWidth: '900px', margin: '40px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
    const itemStyle = { borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', alignItems: 'center', gap: '15px' };
    const paginationContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '30px', flexWrap: 'wrap' };
    const pageButtonStyle = { margin: '0 5px', padding: '8px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px' };
    const activePageButtonStyle = { ...pageButtonStyle, backgroundColor: '#004d40', color: 'white', borderColor: '#004d40' };
    const ellipsisStyle = { ...pageButtonStyle, border: 'none', cursor: 'default' };
    const arrowButtonStyle = { ...pageButtonStyle, fontWeight: 'bold' };
    const controlsContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #ddd' };

    return (
        <div style={{padding: '20px'}}>
            <div style={containerStyle}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                    <h1 style={{ color: '#004d40', textAlign: 'center' }}>Histori Aktivitas Admin</h1>
                    {userRole === 'master' && (
                        <button onClick={handleClearAll} style={{padding: '8px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px'}}>
                            Bersihkan Semua Histori
                        </button>
                    )}
                </div>

                {loading ? <p style={{textAlign: 'center'}}>Memuat histori...</p> : (
                    <div>
                        <div style={controlsContainerStyle}>
                            <div>
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAllOnPage}
                                    checked={currentItems.length > 0 && currentItems.every(item => selectedItems.includes(item.id))}
                                    style={{marginRight: '10px'}}
                                />
                                <label>Pilih Semua di Halaman Ini</label>
                            </div>
                            {selectedItems.length > 0 && (
                                <button onClick={handleDeleteSelected} style={{padding: '6px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px'}}>
                                    Hapus ({selectedItems.length}) yang Dipilih
                                </button>
                            )}
                        </div>
                        {currentItems.map(item => (
                            <div key={item.id} style={itemStyle}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedItems.includes(item.id)}
                                    onChange={() => handleSelectItem(item.id)}
                                />
                                <div>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{item.action}</p>
                                    <small style={{ color: '#666' }}>Oleh: {item.oleh} - {formatTimestamp(item.timestamp)}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div style={paginationContainerStyle}>
                        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} style={arrowButtonStyle}>&lt;</button>
                        {renderPageNumbers().map((number, index) => (
                            number === '...' ? 
                            <span key={index} style={ellipsisStyle}>...</span> :
                            <button key={index} onClick={() => paginate(number)} style={currentPage === number ? activePageButtonStyle : pageButtonStyle}>
                                {number}
                            </button>
                        ))}
                        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} style={arrowButtonStyle}>&gt;</button>
                    </div>
                )}

                <button onClick={() => navigate("/admin")} style={{ marginTop: "30px", padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Kembali ke Dashboard
                </button>
            </div>
        </div>
    );
};

export default AdminHistori;
