// src/pages/panitia/PanitiaPengaturan.js
import React, { useState, useEffect } from 'react';
import { useEvent } from '../../layouts/PanitiaLayout';
import { db } from '../../firebase/firebaseConfig';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '../../utils/logActivity';

const PanitiaPengaturan = () => {
    const { event, eventId } = useEvent();
    const [countdown, setCountdown] = useState('');
    const [jadwalMulai, setJadwalMulai] = useState('');
    const [jadwalSelesai, setJadwalSelesai] = useState('');
    const [pengumuman, setPengumuman] = useState('');

    useEffect(() => {
        if (event) {
            setJadwalMulai(event.jadwalMulai || '');
            setJadwalSelesai(event.jadwalSelesai || '');
        }
    }, [event]);

    // Efek untuk hitung mundur (sekarang hanya untuk tampilan)
    useEffect(() => {
        if (event.status !== 'berlangsung' || !event.jadwalSelesai) {
            setCountdown("Voting tidak sedang berlangsung.");
            return;
        }

        const interval = setInterval(() => {
            const targetDate = new Date(event.jadwalSelesai);
            const now = new Date();
            const distance = targetDate - now;

            if (distance < 0) {
                setCountdown("Waktu telah berakhir.");
                clearInterval(interval);
                return;
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setCountdown(`${days}h ${hours}j ${minutes}m ${seconds}d`);
        }, 1000);

        return () => clearInterval(interval);
    }, [event.status, event.jadwalSelesai]);

    // Efek untuk pengecekan jadwal otomatis (satu-satunya yang mengubah status)
    useEffect(() => {
        if (!event || !event.jadwalMulai || !event.jadwalSelesai) return;

        const checkAndUpdateStatus = async () => {
            const now = new Date();
            const startTime = new Date(event.jadwalMulai);
            const endTime = new Date(event.jadwalSelesai);
            const eventDocRef = doc(db, 'pemilihan_events', eventId);

            if (event.status === 'setup' && now >= startTime && now < endTime) {
                await updateDoc(eventDocRef, { status: 'berlangsung' });
                await logActivity(`Voting untuk "${event.namaEvent}" dibuka secara otomatis.`);
            } else if (event.status === 'berlangsung' && now >= endTime) {
                await updateDoc(eventDocRef, { status: 'selesai' });
                await logActivity(`Voting untuk "${event.namaEvent}" ditutup secara otomatis.`);
            }
        };

        const statusCheckInterval = setInterval(checkAndUpdateStatus, 30000); // Cek setiap 30 detik
        return () => clearInterval(statusCheckInterval);
    }, [event, eventId]);

    const handleEventUpdate = async (field, value) => {
        const eventDocRef = doc(db, 'pemilihan_events', eventId);
        await updateDoc(eventDocRef, { [field]: value });
        await logActivity(`Mengubah ${field} event "${event.namaEvent}"`);
    };
    
    const handleSimpanJadwal = async () => {
        const eventDocRef = doc(db, 'pemilihan_events', eventId);
        await updateDoc(eventDocRef, { 
            jadwalMulai: jadwalMulai,
            jadwalSelesai: jadwalSelesai 
        });
        await logActivity(`Memperbarui jadwal untuk event "${event.namaEvent}"`);
        alert("Jadwal berhasil disimpan!");
    };
    
    const handleKirimPengumuman = async () => {
        if (!pengumuman.trim()) {
            return alert("Teks pengumuman tidak boleh kosong.");
        }
        const eventDocRef = doc(db, 'pemilihan_events', eventId);
        await updateDoc(eventDocRef, {
            pengumuman: {
                teks: pengumuman,
                timestamp: serverTimestamp()
            }
        });
        await logActivity(`Mengirim pengumuman untuk event "${event.namaEvent}"`);
        alert("Pengumuman berhasil dikirim ke semua pemilih.");
        setPengumuman("");
    };

    const handleHapusPengumuman = async () => {
        if (window.confirm("Yakin ingin menghapus pengumuman saat ini?")) {
            const eventDocRef = doc(db, 'pemilihan_events', eventId);
            await updateDoc(eventDocRef, {
                pengumuman: null
            });
            await logActivity(`Menghapus pengumuman dari event "${event.namaEvent}"`);
            alert("Pengumuman berhasil dihapus.");
        }
    };

    const handleStatusUpdate = async (status) => {
        if(window.confirm(`Anda yakin ingin mengubah status pemilihan menjadi "${status}" secara manual?`)) {
            const eventDocRef = doc(db, 'pemilihan_events', eventId);
            await updateDoc(eventDocRef, { status: status });
            await logActivity(`Mengubah status event "${event.namaEvent}" menjadi ${status}`);
        }
    };

    const handleResetSuara = async () => {
        if (window.confirm("PERINGATAN: Tindakan ini akan MENGATUR ULANG SEMUA SUARA. Lanjutkan?")) {
            const updatedKandidat = event.kandidat.map(k => ({ ...k, suara: 0 }));
            const updatedPemilih = event.pemilih.map(p => ({ ...p, sudahMemilih: false }));
            const eventDocRef = doc(db, 'pemilihan_events', eventId);
            await updateDoc(eventDocRef, { kandidat: updatedKandidat, pemilih: updatedPemilih });
            await logActivity(`MERESET SEMUA SUARA di event "${event.namaEvent}"`);
            alert("Semua suara berhasil direset.");
        }
    };

    const sectionStyle = { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
    const buttonStyle = { padding: '10px 16px', backgroundColor: '#004d40', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' };
    const statusBadgeStyle = { padding: '5px 10px', borderRadius: '12px', color: 'white', fontWeight: 'bold' };

    const getStatusComponent = () => {
        switch(event.status) {
            case 'berlangsung': return <span style={{...statusBadgeStyle, backgroundColor: 'green'}}>Berlangsung</span>;
            case 'selesai': return <span style={{...statusBadgeStyle, backgroundColor: 'red'}}>Selesai</span>;
            default: return <span style={{...statusBadgeStyle, backgroundColor: 'orange'}}>Setup</span>;
        }
    };

    return (
        <div>
            <div style={sectionStyle}>
                <h3>Detail Event</h3>
                <div><label>Nama Event:</label><input style={inputStyle} value={event.namaEvent} onChange={(e) => handleEventUpdate('namaEvent', e.target.value)} /></div>
                <div><label>Deskripsi:</label><textarea style={{...inputStyle, minHeight: '80px'}} value={event.deskripsi} onChange={(e) => handleEventUpdate('deskripsi', e.target.value)} /></div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}>
                    <label htmlFor="abstainToggle">Aktifkan Opsi Abstain (Kotak Kosong)?</label>
                    <input 
                        type="checkbox" 
                        id="abstainToggle"
                        checked={event.allowAbstain || false}
                        onChange={(e) => handleEventUpdate('allowAbstain', e.target.checked)}
                    />
                </div>
            </div>
            <div style={sectionStyle}>
                <h3>Jadwal Pemilihan (Otomatis)</h3>
                <p>Sistem akan membuka & menutup voting secara otomatis sesuai jadwal. Tombol di bawah hanya untuk override manual.</p>
                <div><label>Jadwal Mulai:</label><input type="datetime-local" style={inputStyle} value={jadwalMulai} onChange={(e) => setJadwalMulai(e.target.value)} /></div>
                <div><label>Jadwal Selesai:</label><input type="datetime-local" style={inputStyle} value={jadwalSelesai} onChange={(e) => setJadwalSelesai(e.target.value)} /></div>
                <button onClick={handleSimpanJadwal} style={buttonStyle}>Simpan Jadwal</button>
                <p><strong>Hitung Mundur:</strong> {countdown}</p>
            </div>
            
            <div style={sectionStyle}>
                <h3>Kirim Pengumuman ke Pemilih</h3>
                {event.pengumuman && (
                    <div style={{marginBottom: '15px', padding: '10px', background: '#fff', borderRadius: '6px'}}>
                        <p><strong>Pengumuman Saat Ini:</strong> {event.pengumuman.teks}</p>
                        <button onClick={handleHapusPengumuman} style={{...buttonStyle, backgroundColor: 'orange', marginLeft: 0}}>Hapus Pengumuman</button>
                    </div>
                )}
                <p>Pengumuman ini akan muncul di dashboard semua pemilih yang terdaftar di event ini.</p>
                <textarea style={{...inputStyle, minHeight: '100px'}} value={pengumuman} onChange={(e) => setPengumuman(e.target.value)} placeholder="Tulis pengumuman baru di sini..."></textarea>
                <button onClick={handleKirimPengumuman} style={{...buttonStyle, backgroundColor: '#1e88e5'}}>Kirim Pengumuman</button>
            </div>

            <div style={sectionStyle}>
                <h3>Status & Tindakan</h3>
                <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px'}}>
                    <h4>Status Saat Ini:</h4> {getStatusComponent()}
                </div>
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                    <button onClick={() => handleStatusUpdate('berlangsung')} style={{...buttonStyle, backgroundColor: 'green'}}>Buka Voting Manual</button>
                    <button onClick={() => handleStatusUpdate('selesai')} style={{...buttonStyle, backgroundColor: 'red'}}>Tutup Voting Manual</button>
                </div>
            </div>

            {event.status === 'selesai' && (
                 <div style={sectionStyle}>
                    <h3>Publikasi Hasil</h3>
                    <p>Setelah pemilihan selesai, Anda dapat memilih untuk mempublikasikan hasilnya agar bisa dilihat oleh semua pengunjung.</p>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <label htmlFor="publishToggle">Izinkan publik melihat hasil?</label>
                        <input 
                            type="checkbox" 
                            id="publishToggle"
                            checked={event.publishResults || false}
                            onChange={(e) => handleEventUpdate('publishResults', e.target.checked)}
                        />
                    </div>
                </div>
            )}

            <div style={{...sectionStyle, border: '2px solid red'}}>
                <h3>Zona Berbahaya</h3>
                <p>Tindakan di bawah ini tidak dapat diurungkan.</p>
                <button onClick={() => handleStatusUpdate('setup')} style={{...buttonStyle, backgroundColor: '#ff9800', marginRight: '10px'}}>Kembalikan ke Setup</button>
                <button onClick={handleResetSuara} style={{...buttonStyle, backgroundColor: '#c62828'}}>Reset Semua Suara</button>
            </div>
        </div>
    );
};
export default PanitiaPengaturan;