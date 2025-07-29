// src/pages/panitia/PanitiaRingkasan.js
import React, { useMemo } from 'react';
import { useEvent } from '../../layouts/PanitiaLayout';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PanitiaRingkasan = () => {
    const { event, eventId } = useEvent(); // Ambil eventId juga
    const navigate = useNavigate();

    const stats = useMemo(() => {
        const totalPemilih = event?.pemilih?.length || 0;
        const terverifikasi = event?.pemilih?.filter(p => p.statusVerifikasi === 'terverifikasi').length || 0;
        const sudahMemilih = event?.pemilih?.filter(p => p.sudahMemilih).length || 0;
        const partisipasi = terverifikasi > 0 ? ((sudahMemilih / terverifikasi) * 100).toFixed(1) : 0;
        const totalSuaraMasuk = event?.kandidat?.reduce((acc, curr) => acc + (curr.suara || 0), 0) || 0;

        const partisipasiProdi = event?.pemilih
            ?.filter(p => p.sudahMemilih)
            .reduce((acc, curr) => {
                const prodi = curr.prodi || 'Lainnya';
                acc[prodi] = (acc[prodi] || 0) + 1;
                return acc;
            }, {});
        
        const prodiChartData = partisipasiProdi ? Object.keys(partisipasiProdi).map(prodi => ({
            name: prodi,
            value: partisipasiProdi[prodi],
        })) : [];

        return { totalPemilih, terverifikasi, sudahMemilih, partisipasi, totalSuaraMasuk, prodiChartData };
    }, [event]);
    
    const handleExportPDF = () => {
        if (!event) return;
        const doc = new jsPDF();
        const sortedKandidat = [...(event.kandidat || [])].sort((a, b) => b.suara - a.suara);
        
        const totalPemilihTerdaftar = event.pemilih?.length || 0;
        const sudahMemilih = event.pemilih?.filter(p => p.sudahMemilih).length || 0;
        const partisipasi = totalPemilihTerdaftar > 0 ? ((sudahMemilih / totalPemilihTerdaftar) * 100).toFixed(1) : 0;

        // --- Header Dokumen ---
        doc.setFont('times', 'bold');
        doc.setFontSize(16);
        doc.text(`BERITA ACARA REKAPITULASI HASIL PENGHITUNGAN SUARA`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
        doc.setFontSize(14);
        doc.text(event.namaEvent.toUpperCase(), doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Diselenggarakan oleh: ${event.ormawa}`, 14, 45);
        doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 51);
        
        // --- Ringkasan Statistik ---
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont('times', 'bold');
        doc.text("A. Ringkasan Partisipasi", 14, 65);
        autoTable(doc, {
            body: [
                ['Total Pemilih Terdaftar', totalPemilihTerdaftar],
                ['Total Suara Masuk', sudahMemilih],
                ['Tingkat Partisipasi', `${partisipasi}%`],
            ],
            startY: 70,
            theme: 'grid',
            styles: { font: 'times' }
        });

        // --- Tabel Perolehan Suara Kandidat ---
        doc.text("B. Rincian Perolehan Suara Kandidat", 14, doc.lastAutoTable.finalY + 15);
        const kandidatTableColumn = ["Peringkat", "Nama Kandidat", "Jumlah Suara"];
        const kandidatTableRows = sortedKandidat.map((kandidat, index) => [
            index + 1,
            kandidat.nama,
            kandidat.suara || 0,
        ]);
        autoTable(doc, {
            head: [kandidatTableColumn],
            body: kandidatTableRows,
            startY: doc.lastAutoTable.finalY + 20,
            theme: 'striped',
            headStyles: { fillColor: [0, 9, 47], font: 'times', fontStyle: 'bold' },
            styles: { font: 'times' }
        });
        
        // --- Pernyataan dan Tanda Tangan ---
        let finalY = doc.lastAutoTable.finalY;
        doc.setFont('times', 'normal');
        doc.setFontSize(12);
        const statement = `Demikian Berita Acara ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya. Hasil yang tercantum dalam dokumen ini adalah sah dan mengikat.`;
        const splitStatement = doc.splitTextToSize(statement, 180);
        doc.text(splitStatement, 14, finalY + 15);
        
        finalY = finalY + 35;
        
        doc.text(`Yogyakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, doc.internal.pageSize.getWidth() - 70, finalY + 10);
        doc.text("Disahkan oleh:", doc.internal.pageSize.getWidth() - 70, finalY + 20);
        
        doc.text("  Ketua Pemilihan", 14, finalY + 50);
        doc.text("(___________________)", 14, finalY + 51);
        
        doc.text("  Perwakilan Saksi", doc.internal.pageSize.getWidth() - 70, finalY + 50);
        doc.text("(___________________)", doc.internal.pageSize.getWidth() - 70, finalY + 51);
        
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont('times', 'italic');
            doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
        }
        
        doc.save(`Berita_Acara_Hasil_${event.namaEvent.replace(/ /g, "_")}.pdf`);
    };

    const sectionStyle = { backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' };
    const statsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' };
    const statCardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
    const chartContainerStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' };
    const gridDuaKolom = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div style={sectionStyle}>
            <h3>Ringkasan Event</h3>
            <div style={statsGridStyle}>
                <div style={statCardStyle}><h4>Total Kandidat</h4><p style={{fontSize: '24px', fontWeight: 'bold'}}>{event.kandidat?.length || 0}</p></div>
                <div style={statCardStyle}><h4>Total Pemilih</h4><p style={{fontSize: '24px', fontWeight: 'bold'}}>{stats.totalPemilih}</p></div>
                <div style={statCardStyle}><h4>Suara Masuk</h4><p style={{fontSize: '24px', fontWeight: 'bold'}}>{stats.totalSuaraMasuk}</p></div>
                <div style={statCardStyle}><h4>Partisipasi</h4><p style={{fontSize: '24px', fontWeight: 'bold'}}>{stats.partisipasi}%</p></div>
            </div>
            
            <div style={chartContainerStyle}>
                <h4>Perolehan Suara Langsung</h4>
                {event.kandidat && event.kandidat.length > 0 ? (
                    <div style={{width: '100%', height: 300}}>
                        <ResponsiveContainer>
                            <BarChart data={event.kandidat} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nama" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="suara" fill="#00092f" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : <p>Belum ada kandidat atau data suara.</p>}
            </div>

            <div style={gridDuaKolom}>
                <div style={chartContainerStyle}>
                    <h4>Demografi Partisipasi (Prodi)</h4>
                    {stats.prodiChartData.length > 0 ? (
                        <div style={{width: '100%', height: 300}}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={stats.prodiChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {stats.prodiChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <p>Belum ada data partisipasi.</p>}
                </div>

                <div style={chartContainerStyle}>
                    <h4>Papan Peringkat</h4>
                    <ol style={{paddingLeft: '20px'}}>
                        {[...(event.kandidat || [])].sort((a, b) => b.suara - a.suara).map(k => (
                            <li key={k.id} style={{marginBottom: '10px'}}><strong>{k.nama}:</strong> {k.suara} suara</li>
                        ))}
                    </ol>
                </div>
            </div>

            <div style={{...chartContainerStyle, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '15px'}}>
                <button 
                    onClick={() => navigate(`/hasil/${eventId}`)}
                    style={{padding: '10px 20px', backgroundColor: '#1e88e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
                >
                    Lihat Halaman Hasil Publik
                </button>
                <button 
                    onClick={handleExportPDF}
                    style={{padding: '10px 20px', backgroundColor: '#ffd700', color: '#00092f', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Unduh Berita Acara (PDF)
                </button>
            </div>
        </div>
    );
};

export default PanitiaRingkasan;