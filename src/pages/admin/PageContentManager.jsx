import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    CheckIcon, ChevronUpDownIcon,
    CheckCircleIcon, XCircleIcon,
    PencilSquareIcon, GlobeAltIcon,
    DocumentTextIcon
} from '@heroicons/react/24/solid';
import {
    Dialog, DialogPanel, DialogTitle, Transition, TransitionChild,
    Listbox, ListboxButton, ListboxOptions, ListboxOption
} from '@headlessui/react';

export default function PageContentManager() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSlug, setSelectedSlug] = useState(null); // Use slug for selection
    const [editContent, setEditContent] = useState({});
    const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    // Map slugs to human-readable names and manageable fields
    const PAGE_MAP = {
        'home': {
            name: 'Beranda / Header',
            fields: {
                hero_title_part1: 'Judul Utama (Bagian 1)',
                hero_title_accent: 'Judul Utama (Aksen Berwarna)',
                hero_description: 'Deskripsi Singkat Header',
                stats_title: 'Judul Statistik Wilayah'
            }
        },
        'profil-geografis': {
            name: 'Geografis',
            fields: {
                hero_title: 'Judul Halaman',
                hero_description: 'Deskripsi Geografis',
                map_title: 'Judul Peta Wilayah'
            }
        },
        'visi-misi': {
            name: 'Visi & Misi',
            fields: {
                hero_title: 'Judul Halaman',
                hero_description: 'Deskripsi Singkat',
                visi_text: 'Teks Visi',
                misi_intro: 'Pengantar Misi',
                misi_quote: 'Kutipan Misi (Quote)'
            }
        },
        'sejarah': {
            name: 'Sejarah',
            fields: {
                hero_title: 'Judul Halaman Sejarah',
                hero_description: 'Deskripsi Hero',
                asal_usul_title: 'Judul Asal Usul',
                asal_usul_text: 'Teks Sejarah Asal Usul',
                luas_wilayah: 'Info Luas Wilayah',
                kecamatan: 'Nama Kecamatan',
                kota_administrasi: 'Nama Kota',
                kode_pos: 'Kode Pos'
            }
        },
        'rt-rw': {
            name: 'Halaman RT/RW',
            fields: {
                hero_title: 'Judul Halaman RT/RW',
                hero_description: 'Keterangan Lembaga RT/RW'
            }
        },
        'lmk': {
            name: 'Halaman LMK',
            fields: {
                hero_title: 'Judul Halaman LMK',
                hero_description: 'Deskripsi Lembaga LMK'
            }
        },
        'fkdm': {
            name: 'Halaman FKDM',
            fields: {
                hero_title: 'Judul Halaman FKDM',
                hero_description: 'Deskripsi Lembaga FKDM'
            }
        },
        'layanan-tanah': { name: 'Layanan Pertanahan', fields: { hero_title: 'Judul Layanan', hero_description: 'Syarat & Ketentuan' } },
        'layanan-nikah': { name: 'Layanan Pernikahan', fields: { hero_title: 'Judul Layanan', hero_description: 'Syarat & Ketentuan' } },
        'layanan-wna': { name: 'Layanan WNA', fields: { hero_title: 'Judul Layanan', hero_description: 'Syarat & Ketentuan' } },
        'layanan-pajak-aset': { name: 'Layanan Pajak & Aset', fields: { hero_title: 'Judul Layanan', hero_description: 'Syarat & Ketentuan' } },
        'layanan-waris': { name: 'Layanan Hukum & Waris', fields: { hero_title: 'Judul Layanan', hero_description: 'Syarat & Ketentuan' } },
        'layanan-kependudukan-detail': { name: 'Keterangan Kependudukan', fields: { hero_title: 'Judul Layanan', hero_description: 'Syarat & Ketentuan' } },
        'layanan-usaha': { name: 'Layanan Pekerjaan & Usaha', fields: { hero_title: 'Judul Layanan', hero_description: 'Syarat & Ketentuan' } },
        'kegiatan-ekbang': { name: 'Kegiatan Ekbang', fields: { hero_title: 'Judul Halaman', hero_description: 'Deskripsi Kegiatan' } },
        'dasawisma': { name: 'Halaman Dasawisma', fields: { hero_title: 'Judul Halaman', hero_description: 'Deskripsi Dasawisma' } },
        'pelatihan': { name: 'Halaman Pelatihan', fields: { hero_title: 'Judul Halaman', hero_description: 'Daftar Pelatihan Lurah' } },
        'bencana': { name: 'Halaman Info Bencana', fields: { hero_title: 'Judul Halaman', hero_description: 'Info Kewaspadaan Bencana' } },
        'fasilitas': { name: 'Halaman Fasilitas', fields: { hero_title: 'Judul Halaman', hero_description: 'Daftar Fasilitas Umum' } }
    };

    useEffect(() => { fetchPages(); }, []);

    const fetchPages = async () => {
        const { data } = await supabase.from('page_content').select('*');
        setPages(data || []);
    };

    const handleSelectPage = (slug) => {
        setSelectedSlug(slug);

        // Find all rows that belong to this page slug
        const relatedRows = pages.filter(p => p.page_slug === slug);

        // Map section_key to content value
        const content = {};
        relatedRows.forEach(row => {
            content[row.section_key] = row.content;
        });

        setEditContent(content);
    };

    const handleFieldChange = (key, value) => {
        setEditContent(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!selectedSlug) return;
        setLoading(true);

        const rowsToUpsert = Object.entries(editContent).map(([key, value]) => {
            // Find existing row to get its UUID
            const existing = pages.find(p => p.page_slug === selectedSlug && p.section_key === key);

            const row = {
                page_slug: selectedSlug,
                section_key: key,
                content: value
            };

            // If we have an existing ID (UUID), include it to ensure update instead of insert.
            // If not, generate a new one to satisfy NOT NULL constraint on id column.
            if (existing) {
                row.id = existing.id;
            } else {
                row.id = crypto.randomUUID();
            }

            return row;
        });

        const { error } = await supabase
            .from('page_content')
            .upsert(rowsToUpsert);

        if (!error) {
            setFeedback({
                isOpen: true,
                type: 'success',
                title: 'Berhasil!',
                message: `Konten ${PAGE_MAP[selectedSlug]?.name || selectedSlug} telah disimpan.`
            });
            fetchPages();
        } else {
            setFeedback({ isOpen: true, type: 'error', title: 'Gagal', message: error.message });
        }
        setLoading(false);
    };

    const getPageLabel = (id) => PAGE_MAP[id]?.name || id;

    return (
        <div className="space-y-8 font-sans pb-20">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Konten Halaman</h2>
                    <p className="text-blue-300/50 text-sm mt-1 uppercase tracking-widest font-bold">Edit Teks Statis & Hero Section</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* LEFT COLUMN: PAGE LIST */}
                <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-4 bg-black/20 border-b border-white/10 flex items-center gap-2">
                        <GlobeAltIcon className="h-5 w-5 text-blue-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Daftar Halaman</span>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {Object.keys(PAGE_MAP).map((slug) => {
                            const related = pages.filter(p => p.page_slug === slug);
                            const hasData = related.length > 0;
                            return (
                                <button
                                    key={slug}
                                    onClick={() => handleSelectPage(slug)}
                                    className={`w-full p-4 text-left flex items-center justify-between transition-all group ${selectedSlug === slug ? 'bg-blue-600/40 shadow-inner border-l-4 border-blue-500' : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div className="min-w-0">
                                        <p className={`font-bold transition-colors ${selectedSlug === slug ? 'text-blue-200' : 'text-gray-300 group-hover:text-white'}`}>
                                            {PAGE_MAP[slug].name}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{slug}</p>
                                    </div>
                                    {!hasData && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">Empty</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT COLUMN: EDITOR */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedSlug ? (
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                                        <PencilSquareIcon className="h-6 w-6 text-blue-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{PAGE_MAP[selectedSlug]?.name}</h3>
                                        <p className="text-xs text-blue-300/50">ID Halaman: {selectedSlug}</p>
                                    </div>
                                </div>
                                <button
                                    disabled={loading}
                                    onClick={handleSave}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-all text-sm flex items-center gap-2"
                                >
                                    {loading ? 'Menyimpan...' : (
                                        <><CheckIcon className="h-5 w-5" /> Simpan Perubahan</>
                                    )}
                                </button>
                            </div>

                            <div className="space-y-6">
                                {Object.entries(PAGE_MAP[selectedSlug]?.fields || {}).map(([field, label]) => (
                                    <div key={field} className="space-y-2">
                                        <label className="text-xs font-bold text-blue-300 uppercase tracking-widest pl-1 block">
                                            {label}
                                        </label>
                                        {field.includes('text') || field.includes('description') || field.includes('intro') || field.includes('isi') ? (
                                            <textarea
                                                className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-400 outline-none transition text-sm leading-relaxed"
                                                rows={field.includes('text') || field.includes('isi') ? 6 : 3}
                                                value={editContent[field] || ''}
                                                onChange={(e) => handleFieldChange(field, e.target.value)}
                                                placeholder={`Masukkan ${label}...`}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-400 outline-none transition text-sm"
                                                value={editContent[field] || ''}
                                                onChange={(e) => handleFieldChange(field, e.target.value)}
                                                placeholder={`Masukkan ${label}...`}
                                            />
                                        )}
                                    </div>
                                ))}

                                {/* JSON PREVIEW (Optional but helpful for dev) */}
                                <div className="mt-10 p-4 bg-black/40 rounded-xl border border-white/5">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Editor State (Preview)</p>
                                    <pre className="text-[10px] text-gray-400 overflow-x-auto">
                                        {JSON.stringify(editContent, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/5 border-dashed p-20 rounded-2xl flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <DocumentTextIcon className="h-8 w-8 text-gray-600" />
                            </div>
                            <h3 className="text-gray-400 font-bold">Pilih Halaman</h3>
                            <p className="text-sm text-gray-500 max-w-xs mt-2">Silakan pilih halaman di sebelah kiri untuk mulai menyesuaikan konten teks dan tampilan.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* FEEDBACK MODAL */}
            <Transition appear show={feedback.isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setFeedback({ ...feedback, isOpen: false })}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/60 backdrop-blur-sm" /></TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className={`bg-[#0f172a] border p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl ${feedback.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'}`}>
                                    {feedback.type === 'success' ? <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-4" /> : <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />}
                                    <DialogTitle className={`font-bold text-xl mb-2 ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{feedback.title}</DialogTitle>
                                    <p className="text-gray-400 text-sm mb-6">{feedback.message}</p>
                                    <button onClick={() => setFeedback({ ...feedback, isOpen: false })} className={`px-6 py-2 rounded-xl font-bold text-white shadow-lg ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>Tutup</button>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

        </div>
    );
}
