import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    TrashIcon, PlusIcon, UserIcon, CheckIcon, ChevronUpDownIcon,
    ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon,
    IdentificationIcon, MapIcon, HomeModernIcon, PencilSquareIcon,
    PhotoIcon, ArrowUpTrayIcon, XMarkIcon
} from '@heroicons/react/24/solid';
import {
    Tab, TabGroup, TabList, TabPanel, TabPanels,
    Dialog, DialogPanel, DialogTitle, Transition, TransitionChild
} from '@headlessui/react';

export default function KelembagaanManager() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('rw');

    const [form, setForm] = useState({
        title: '',
        description: '',
        image_url: '',
        data: {
            jabatan: '',
            wilayah: '',
            telepon: '',
            rt_count: ''
        }
    });

    const [editingId, setEditingId] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    const TABS = [
        { id: 'rw', label: 'RW & RT', icon: MapIcon, color: 'text-blue-400' },
        { id: 'lmk', label: 'LMK', icon: HomeModernIcon, color: 'text-emerald-400' },
        { id: 'fkdm', label: 'FKDM', icon: IdentificationIcon, color: 'text-amber-400' }
    ];

    useEffect(() => {
        fetchItems();
        resetForm();
    }, [activeTab]);

    const fetchItems = async () => {
        const { data } = await supabase
            .from('items')
            .select('*')
            .eq('type', activeTab)
            .order('created_at', { ascending: false });
        setItems(data || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let imageUrl = form.image_url;

        // Handle Image Upload
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `kelembagaan/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('images').upload(fileName, imageFile);

            if (uploadError) {
                setFeedback({ isOpen: true, type: 'error', title: 'Gagal Upload', message: 'Tidak bisa mengunggah foto.' });
                setLoading(false);
                return;
            }

            const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
        }

        const payload = {
            type: activeTab,
            title: form.title,
            description: form.description,
            image_url: imageUrl,
            data: form.data
        };

        let error;
        if (editingId) {
            const { error: updateError } = await supabase.from('items').update(payload).eq('id', editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('items').insert([payload]);
            error = insertError;
        }

        if (!error) {
            setFeedback({ isOpen: true, type: 'success', title: 'Berhasil!', message: 'Data anggota berhasil disimpan.' });
            resetForm();
            fetchItems();
        } else {
            setFeedback({ isOpen: true, type: 'error', title: 'Gagal', message: error.message });
        }
        setLoading(false);
    };

    const resetForm = () => {
        setForm({ title: '', description: '', image_url: '', data: { jabatan: '', wilayah: '', telepon: '', rt_count: '' } });
        setEditingId(null);
        setImageFile(null);
        setImagePreview(null);
        setIsDeleteOpen(false);
        setDeleteTargetId(null);
    };

    const handleEdit = (item) => {
        setForm({
            title: item.title,
            description: item.description,
            image_url: item.image_url || '',
            data: {
                jabatan: item.data?.jabatan || '',
                wilayah: item.data?.wilayah || '',
                telepon: item.data?.telepon || '',
                rt_count: item.data?.rt_count || ''
            }
        });
        setEditingId(item.id);
        setImagePreview(item.image_url);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openDeleteModal = (id) => {
        setDeleteTargetId(id);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        const { error } = await supabase.from('items').delete().eq('id', deleteTargetId);
        setIsDeleteOpen(false);
        if (!error) {
            fetchItems();
            setFeedback({ isOpen: true, type: 'success', title: 'Dihapus', message: 'Data berhasil dihapus.' });
        }
    };

    const getFieldConfig = () => {
        switch (activeTab) {
            case 'rw':
                return {
                    jabatanLabel: "Jabatan (ex: Ketua RW 01)",
                    wilayahLabel: "Wilayah (ex: RT 001/01)",
                    jabatanPlaceholder: "Contoh: Ketua RW 01",
                    wilayahPlaceholder: "Contoh: RT 001/01"
                };
            case 'lmk':
                return {
                    jabatanLabel: "Jabatan (ex: Anggota LMK)",
                    wilayahLabel: "Perwakilan Wilayah (ex: RW 02)",
                    jabatanPlaceholder: "Contoh: Anggota LMK",
                    wilayahPlaceholder: "Contoh: RW 02"
                };
            case 'fkdm':
                return {
                    jabatanLabel: "Jabatan (ex: Ketua FKDM)",
                    wilayahLabel: "Bidang / Fokus",
                    jabatanPlaceholder: "Contoh: Ketua FKDM",
                    wilayahPlaceholder: "Contoh: Bidang Keamanan"
                };
            default:
                return {
                    jabatanLabel: "Jabatan",
                    wilayahLabel: "Wilayah",
                    jabatanPlaceholder: "Isi jabatan...",
                    wilayahPlaceholder: "Isi wilayah..."
                };
        }
    };

    const config = getFieldConfig();

    return (
        <div className="space-y-8 font-sans" key={activeTab}>

            {/* HEADER & TABS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Manajemen Kelembagaan</h2>
                    <p className="text-blue-300/50 text-sm mt-1 uppercase tracking-widest font-bold">RT/RW, LMK, dan FKDM</p>
                </div>

                <TabGroup
                    selectedIndex={TABS.findIndex(t => t.id === activeTab)}
                    onChange={(index) => {
                        const newTab = TABS[index].id;
                        setActiveTab(newTab);
                        resetForm();
                    }}
                >
                    <TabList className="flex p-1 space-x-1 bg-black/20 backdrop-blur-xl rounded-xl border border-white/10">
                        {TABS.map((tab) => (
                            <Tab key={tab.id} className={({ selected }) => `
                                flex items-center gap-2 px-4 py-2 text-sm font-bold leading-5 rounded-lg transition-all
                                ${selected ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            `}>
                                <tab.icon className={`h-4 w-4 ${tab.color}`} />
                                {tab.label}
                            </Tab>
                        ))}
                    </TabList>
                </TabGroup>
            </div>

            {/* FORM CARD */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                        <UserIcon className="h-5 w-5 text-blue-300" />
                    </div>
                    {editingId ? 'Edit Anggota' : 'Tambah Anggota Baru'}
                </h3>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-blue-300 uppercase tracking-widest pl-1">Nama Lengkap</label>
                        <input
                            type="text" placeholder="Contoh: Budi Santoso"
                            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-400 outline-none transition"
                            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-blue-300 uppercase tracking-widest pl-1">{config.jabatanLabel}</label>
                        <input
                            type="text" placeholder={config.jabatanPlaceholder}
                            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-400 outline-none transition"
                            value={form.data.jabatan} onChange={e => setForm({ ...form, data: { ...form.data, jabatan: e.target.value } })} required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-blue-300 uppercase tracking-widest pl-1">{config.wilayahLabel}</label>
                        <input
                            type="text" placeholder={config.wilayahPlaceholder}
                            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-400 outline-none transition"
                            value={form.data.wilayah} onChange={e => setForm({ ...form, data: { ...form.data, wilayah: e.target.value } })}
                        />
                    </div>



                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-blue-300 uppercase tracking-widest pl-1">Foto Anggota</label>
                        <div className="flex items-center gap-4">
                            {imagePreview ? (
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview(null);
                                            setForm(prev => ({ ...prev, image_url: '' }));
                                        }}
                                        className="absolute top-0 right-0 bg-red-600 p-0.5 rounded-bl-lg"
                                    >
                                        <XMarkIcon className="h-3 w-3 text-white" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                                    <PhotoIcon className="h-5 w-5 text-gray-600" />
                                </div>
                            )}
                            <label className="flex-1">
                                <span className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs px-4 py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all">
                                    <ArrowUpTrayIcon className="h-4 w-4" />
                                    {imageFile ? imageFile.name : 'Pilih Foto'}
                                </span>
                                <input
                                    key={imagePreview || 'empty'}
                                    type="file" accept="image/*" className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setImageFile(file);
                                            setImagePreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    {activeTab === 'rw' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest pl-1">Jumlah RT</label>
                            <input
                                type="number" placeholder="Contoh: 12"
                                className="w-full bg-black/40 border border-amber-500/20 p-3 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-400 outline-none transition"
                                value={form.data.rt_count} onChange={e => setForm({ ...form, data: { ...form.data, rt_count: e.target.value } })}
                            />
                        </div>
                    )}

                    <div className="flex items-end gap-3">
                        <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm">
                            {editingId ? 'Simpan Update' : 'Tambah Anggota'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="bg-white/5 border border-white/10 text-gray-400 p-3 rounded-xl hover:bg-white/10 transition">
                                Batal
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* TABLE LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                    <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-300 font-bold border border-blue-500/30 shadow-lg overflow-hidden">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                ) : item.title.charAt(0)}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(item)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"><PencilSquareIcon className="h-4 w-4" /></button>
                                <button onClick={() => openDeleteModal(item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"><TrashIcon className="h-4 w-4" /></button>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h4 className="text-white font-bold text-lg leading-tight">{item.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter border border-blue-500/30 px-2 rounded-md bg-blue-500/10">
                                    {item.data?.jabatan || 'Anggota'}
                                </span>
                                {activeTab === 'rw' && item.data?.rt_count && (
                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter bg-amber-500/10 px-2 rounded-md border border-amber-500/30">
                                        {item.data.rt_count} RT
                                    </span>
                                )}
                                {item.data?.wilayah && (
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                        {item.data.wilayah}
                                    </span>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        Belum ada data anggota untuk kategori ini.
                    </div>
                )}
            </div>

            {/* MODALS */}
            <Transition appear show={isDeleteOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsDeleteOpen(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/80 backdrop-blur-sm" /></TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="bg-[#0f172a] border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
                                    <DialogTitle className="text-white font-bold text-lg mb-2 flex items-center gap-2"><ExclamationTriangleIcon className="h-5 w-5 text-red-500" /> Konfirmasi</DialogTitle>
                                    <p className="text-gray-400 text-sm">Hapus data anggota <b>{items.find(i => i.id === deleteTargetId)?.title}</b>?</p>
                                    <div className="mt-6 flex justify-end gap-3 text-sm">
                                        <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 text-gray-400">Batal</button>
                                        <button onClick={confirmDelete} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-500 transition-all">Ya, Hapus</button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

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
