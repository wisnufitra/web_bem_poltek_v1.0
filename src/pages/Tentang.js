// src/pages/Tentang.js
import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

const SmartContentRenderer = ({ section }) => {
    // Warna link diubah sesuai tema baru
    const linkStyle = { color: "#00092f", fontWeight: "bold", textDecoration: 'underline' };

    if (section.judul === 'Kontak Kami') {
        let href = '';
        let display_text = section.isi;
        switch (section.contactType) {
            case 'Email':
                href = `mailto:${section.isi}`;
                break;
            case 'WhatsApp':
                const phone_wa = section.isi.replace(/\D/g, '');
                href = `https://wa.me/${phone_wa}`;
                break;
            case 'Telepon':
                href = `tel:${section.isi.replace(/\D/g, '')}`;
                break;
            case 'Instagram':
                href = `https://instagram.com/${section.isi.replace('@', '')}`;
                display_text = `@${section.isi.replace('@', '')}`;
                break;
            case 'X (Twitter)':
                href = `https://x.com/${section.isi.replace('@', '')}`;
                display_text = `@${section.isi.replace('@', '')}`;
                break;
            case 'Facebook':
                href = `https://facebook.com/${section.isi}`;
                break;
            case 'Website':
                href = section.isi;
                break;
            default:
                return <span>{section.isi}</span>;
        }
        return <p><strong>{section.contactType}:</strong> <a href={href} target="_blank" rel="noopener noreferrer" style={linkStyle}>{display_text}</a></p>;
    }

    return <p style={{ whiteSpace: 'pre-wrap', textAlign: 'justify', lineHeight: '1.8' }}>{section.isi}</p>;
};

const Tentang = () => {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(db, 'halaman', 'tentang');
        
        const unsubscribe = onSnapshot(docRef, 
            (docSnap) => {
                if (docSnap.exists() && docSnap.data().sections) {
                    setSections(docSnap.data().sections);
                } else {
                    setSections([]);
                }
                setLoading(false);
            },
            (error) => {
                console.error("Gagal memuat halaman Tentang:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // --- Styles Diperbarui ---
    const pageStyle = {
        padding: "40px 20px"
    };
    const containerStyle = { 
        maxWidth: "800px", 
        margin: "0 auto", 
        padding: "30px", 
        backgroundColor: '#fff', 
        borderRadius: '12px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
    };
    const headingStyle = { 
        color: "#00092f", // Warna baru
        fontSize: "28px", 
        borderBottom: "3px solid #ffd700", // Aksen emas
        paddingBottom: "10px", 
        marginTop: "40px" 
    };

    if (loading) {
        return <p style={{ textAlign: 'center', marginTop: '40px' }}>Memuat halaman...</p>;
    }

    const contactSections = sections.filter(s => s.judul === 'Kontak Kami');
    const otherSections = sections.filter(s => s.judul !== 'Kontak Kami');

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                <h1 style={{ textAlign: "center", fontSize: "32px", marginBottom: "30px", color: "#00092f" }}>
                    Tentang BEM Poltek Nuklir
                </h1>

                {sections.length === 0 && !loading ? (
                    <p style={{textAlign: 'center', color: '#666', marginTop: '50px'}}>
                        Konten untuk halaman ini sedang disiapkan oleh admin. Silakan kembali lagi nanti.
                    </p>
                ) : (
                    <>
                        {otherSections.map((section, index) => (
                            <div key={index}>
                                <h2 style={headingStyle}>{section.judul}</h2>
                                <SmartContentRenderer section={section} />
                            </div>
                        ))}

                        {contactSections.length > 0 && (
                            <div>
                                <h2 style={headingStyle}>Kontak Kami</h2>
                                {contactSections.map((section, index) => (
                                    <SmartContentRenderer key={index} section={section} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Tentang;
