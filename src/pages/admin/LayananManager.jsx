import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    TrashIcon, PlusIcon, CheckIcon, ChevronUpDownIcon,
    ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon,
    DocumentTextIcon, TagIcon, ListBulletIcon
} from '@heroicons/react/24/solid';
import {
    Listbox, Transition, ListboxButton, ListboxOptions, ListboxOption,
    Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions,
    Dialog, DialogPanel, DialogTitle, TransitionChild
} from '@headlessui/react';

export default function LayananManager() {
    const [layanan, setLayanan] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');

    const [form, setForm] = useState({
        title: '',
        description: '',
        kategori: 'Kependudukan',
        template: '',
        syarat: [''] // Array of syarat
    });

    const [editingId, setEditingId] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const [feedback, setFeedback] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    const KATEGORI_OPTIONS = [
        "Kependudukan",
        "Perpindahan Penduduk",
        "Pelayanan Umum",
        "Pertanahan & Waris",
        "Pernikahan",
        "Warga Negara Asing",
        "Pajak & Aset",
        "Pekerjaan & Usaha"
    ];

    useEffect(() => {
        fetchLayanan();
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const { data } = await supabase
            .from('items')
            .select('*')
            .eq('type', 'dokument_template')
            .order('created_at', { ascending: false });
        setTemplates(data || []);
    };

    const fetchLayanan = async () => {
        const { data } = await supabase
            .from('items')
            .select('*')
            .eq('type', 'layanan')
            .order('created_at', { ascending: false });
        setLayanan(data || []);
    };

    const showFeedback = (type, title, message) => {
        setFeedback({ isOpen: true, type, title, message });
    };

    const closeFeedback = () => {
        setFeedback(prev => ({ ...prev, isOpen: false }));
    };

    const handleAddSyarat = () => {
        setForm(prev => ({ ...prev, syarat: [...prev.syarat, ''] }));
    };

    const handleRemoveSyarat = (index) => {
        if (form.syarat.length === 1) return;
        const newSyarat = form.syarat.filter((_, i) => i !== index);
        setForm(prev => ({ ...prev, syarat: newSyarat }));
    };

    const handleSyaratChange = (index, value) => {
        const newSyarat = [...form.syarat];
        newSyarat[index] = value;
        setForm(prev => ({ ...prev, syarat: newSyarat }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            type: 'layanan',
            title: form.title,
            description: form.description,
            data: {
                kategori: form.kategori,
                template: form.template,
                syarat: form.syarat.filter(s => s.trim() !== '')
            }
        };

        let error;
        if (editingId) {
            const { error: updateError } = await supabase
                .from('items')
                .update(payload)
                .eq('id', editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('items')
                .insert([payload]);
            error = insertError;
        }

        if (!error) {
            showFeedback('success', editingId ? 'Berhasil Diperbarui' : 'Berhasil!', 'Data layanan telah diperbarui.');
            resetForm();
            fetchLayanan();
        } else {
            showFeedback('error', 'Terjadi Kesalahan', error.message);
        }
        setLoading(false);
    };

    const resetForm = () => {
        setForm({ title: '', description: '', kategori: 'Kependudukan', template: '', syarat: [''] });
        setEditingId(null);
    };

    const handleEdit = (item) => {
        setForm({
            title: item.title,
            description: item.description,
            kategori: item.data?.kategori || 'Kependudukan',
            template: item.data?.template || '',
            syarat: item.data?.syarat?.length > 0 ? item.data.syarat : ['']
        });
        setEditingId(item.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openDeleteModal = (id) => {
        setDeleteTargetId(id);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        const { error } = await supabase.from('items').delete().eq('id', deleteTargetId);

        setDeleteTargetId(null);
        setIsDeleteOpen(false);

        if (!error) {
            fetchLayanan();
            showFeedback('success', 'Dihapus', 'Layanan berhasil dihapus.');
        } else {
            showFeedback('error', 'Gagal Hapus', error.message);
        }
    };

    const getCategoryColor = (cat) => {
        switch (cat) {
            case 'Kependudukan': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'Perpindahan Penduduk': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'Pelayanan Umum': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'Pertanahan & Waris': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            case 'Pernikahan': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            case 'Warga Negara Asing': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
            case 'Pajak & Aset': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            case 'Pekerjaan & Usaha': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
            default: return 'bg-gray-500/20 text-gray-300';
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 font-sans">

            {/* FORM CARD GLASS */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 md:p-6 rounded-2xl shadow-xl relative z-20">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                        {editingId ? <DocumentTextIcon className="h-5 w-5 text-amber-300" /> : <PlusIcon className="h-5 w-5 text-blue-300" />}
                    </div>
                    {editingId ? 'Edit Layanan' : 'Tambah Layanan & Syarat'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {/* Input Nama Layanan */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest pl-1">Nama Layanan</label>
                                <input
                                    type="text" placeholder="Contoh: Perekaman KTP-el Baru"
                                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                />
                            </div>

                            {/* Select Kategori */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest pl-1">Kategori</label>
                                <Listbox value={form.kategori} onChange={(val) => setForm({ ...form, kategori: val })}>
                                    <div className="relative">
                                        <ListboxButton className="relative w-full cursor-pointer bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-left text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                                            <span className="block truncate">{form.kategori}</span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </span>
                                        </ListboxButton>
                                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                            <ListboxOptions className="absolute mt-2 max-h-60 w-full overflow-auto rounded-xl bg-[#1e293b] border border-white/10 py-1 text-base shadow-2xl z-50 focus:outline-none text-sm">
                                                {KATEGORI_OPTIONS.map((kategori, idx) => (
                                                    <ListboxOption key={idx} className={({ active }) => `relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors ${active ? 'bg-blue-600/40 text-white' : 'text-gray-300'}`} value={kategori}>
                                                        {({ selected }) => (
                                                            <>
                                                                <span className={`block truncate ${selected ? 'font-medium text-blue-200' : 'font-normal'}`}>{kategori}</span>
                                                                {selected ? (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>) : null}
                                                            </>
                                                        )}
                                                    </ListboxOption>
                                                ))}
                                            </ListboxOptions>
                                        </Transition>
                                    </div>
                                </Listbox>
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest pl-1">Informasi Tambahan (Opsional)</label>
                                <textarea
                                    placeholder="Keterangan singkat mengenai layanan ini..." rows="3"
                                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                ></textarea>
                            </div>

                            {/* Template Registry Combobox (Searchable) */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest pl-1">Pilih Dokumen Template (Opsional)</label>
                                <Combobox value={form.template} onChange={(val) => setForm({ ...form, template: val })}>
                                    <div className="relative mt-1">
                                        <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-black/40 border border-white/10 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white/10 transition sm:text-sm">
                                            <DocumentTextIcon className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 z-10" />
                                            <ComboboxInput
                                                className="w-full border-none py-3 pl-10 pr-10 text-sm leading-5 text-white bg-transparent focus:ring-0 placeholder-gray-500"
                                                displayValue={(template) =>
                                                    templates.find(t => t.data?.url === template || t.data?.fileName === template)?.title || (template ? `Legacy: ${template}` : '')
                                                }
                                                onChange={(event) => setQuery(event.target.value)}
                                                placeholder="Cari atau pilih template..."
                                            />
                                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </ComboboxButton>
                                        </div>
                                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setQuery('')}>
                                            <ComboboxOptions className="absolute mt-2 max-h-60 w-full overflow-auto rounded-xl bg-[#1e293b] border border-white/10 py-1 text-base shadow-2xl z-50 focus:outline-none text-sm custom-scrollbar">
                                                <ComboboxOption className={({ active }) => `relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors ${active ? 'bg-red-600/20 text-red-100' : 'text-gray-400'}`} value="">
                                                    <span className="block truncate">Tanpa Template / Hapus Template</span>
                                                </ComboboxOption>

                                                {templates.filter(t => t.title.toLowerCase().includes(query.toLowerCase())).length === 0 && query !== '' ? (
                                                    <div className="relative cursor-default select-none py-2 px-4 text-gray-500 italic">
                                                        Tidak ada dokumen ditemukan.
                                                    </div>
                                                ) : (
                                                    templates
                                                        .filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
                                                        .map((temp) => (
                                                            <ComboboxOption key={temp.id} className={({ active }) => `relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors ${active ? 'bg-blue-600/40 text-white' : 'text-gray-300'}`} value={temp.data?.url}>
                                                                {({ selected }) => (
                                                                    <>
                                                                        <span className={`block truncate ${selected ? 'font-medium text-blue-200' : 'font-normal'}`}>{temp.title}</span>
                                                                        {selected ? (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>) : null}
                                                                    </>
                                                                )}
                                                            </ComboboxOption>
                                                        ))
                                                )}
                                            </ComboboxOptions>
                                        </Transition>
                                    </div>
                                </Combobox>
                                <p className="text-[10px] text-gray-500 px-1 italic">*Ketik untuk mencari dokumen yang sudah di-upload.</p>
                            </div>



                        </div>

                        {/* SYARAT LIST EDITOR */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-blue-300 uppercase tracking-widest pl-1 flex justify-between items-center">
                                Daftar Persyaratan
                                <button type="button" onClick={handleAddSyarat} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-md flex items-center gap-1 transition">
                                    <PlusIcon className="h-3 w-3" /> Tambah
                                </button>
                            </label>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {form.syarat.map((syarat, index) => (
                                    <div key={index} className="flex gap-2 animate-in slide-in-from-right-2 duration-200">
                                        <input
                                            type="text" placeholder={`Syarat ke-${index + 1}`}
                                            className="flex-1 bg-black/20 border border-white/5 p-2 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                                            value={syarat} onChange={e => handleSyaratChange(index, e.target.value)}
                                        />
                                        <button type="button" onClick={() => handleRemoveSyarat(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        {editingId && (
                            <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition">
                                Batal
                            </button>
                        )}
                        <button disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50">
                            {loading ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Terbitkan Layanan'}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- LIST SECTION --- */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h4 className="text-white font-bold flex items-center gap-2">
                        <ListBulletIcon className="h-5 w-5 text-blue-400" />
                        Daftar Layanan Aktif
                    </h4>
                    <span className="text-xs text-blue-300/50 uppercase tracking-widest font-bold">{layanan.length} Layanan</span>
                </div>

                {/* MOBILE CARD VIEW (Visible on small screens only) */}
                <div className="md:hidden divide-y divide-white/5">
                    {layanan.map((item) => (
                        <div key={item.id} className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-white text-base leading-tight mb-1">{item.title}</p>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap ${getCategoryColor(item.data?.kategori)}`}>
                                        {item.data?.kategori || 'Umum'}
                                    </span>
                                    {item.data?.template && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold text-blue-400 uppercase">
                                            <DocumentTextIcon className="h-3 w-3" /> Template
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(item)} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition border border-blue-500/10">
                                        <DocumentTextIcon className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => openDeleteModal(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition border border-red-500/10">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {item.description && (
                                <p className="text-xs text-gray-400 line-clamp-2 italic">"{item.description}"</p>
                            )}

                            <div className="bg-black/20 rounded-lg p-3 space-y-1.5">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-blue-300/50">Syarat:</p>
                                {item.data?.syarat?.map((s, idx) => (
                                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-gray-400">
                                        <CheckCircleIcon className="h-3 w-3 text-green-500/50 mt-0.5" />
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {layanan.length === 0 && (
                        <div className="p-10 text-center text-gray-500 italic text-sm">Belum ada layanan yang ditambahkan.</div>
                    )}
                </div>

                {/* DESKTOP TABLE VIEW (Hidden on mobile) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-black/20 text-blue-200 uppercase text-[10px] tracking-wider border-b border-white/5">
                            <tr>
                                <th className="p-5 font-bold">Layanan</th>
                                <th className="p-5 font-bold">Kategori</th>
                                <th className="p-5 font-bold">Syarat</th>
                                <th className="p-5 font-bold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {layanan.map((item) => (
                                <tr key={item.id} className="hover:bg-white/5 transition duration-150 group">
                                    <td className="p-5 align-top">
                                        <p className="font-bold text-white text-base mb-1">{item.title}</p>
                                        <p className="text-xs text-gray-400 line-clamp-1">{item.description || '-'}</p>
                                    </td>
                                    <td className="p-5 align-top">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getCategoryColor(item.data?.kategori)}`}>
                                            {item.data?.kategori || 'Umum'}
                                        </span>
                                        {item.data?.template && (
                                            <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-400 font-bold uppercase">
                                                <DocumentTextIcon className="h-3.5 w-3.5" /> Ada Template
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-5 align-top">
                                        <div className="flex flex-col gap-1">
                                            {item.data?.syarat?.slice(0, 2).map((s, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                                    <CheckCircleIcon className="h-3 w-3 text-green-500/50" />
                                                    <span className="line-clamp-1">{s}</span>
                                                </div>
                                            ))}
                                            {item.data?.syarat?.length > 2 && (
                                                <span className="text-[10px] text-blue-400 font-medium pl-4">+{item.data.syarat.length - 2} syarat lainnya</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-5 align-top text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(item)} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition border border-blue-500/10">
                                                <DocumentTextIcon className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => openDeleteModal(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition border border-red-500/10">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {layanan.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center text-gray-500 italic">Belum ada layanan yang ditambahkan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODALS (Reused style from BeritaManager) --- */}
            <Transition appear show={isDeleteOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsDeleteOpen(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#0f172a] border border-white/10 p-6 text-left align-middle shadow-2xl transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                            <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                                        </div>
                                        <DialogTitle as="h3" className="text-lg font-bold text-white">Konfirmasi Hapus</DialogTitle>
                                    </div>
                                    <div className="mt-4"><p className="text-sm text-gray-300">Yakin hapus layanan <b>{layanan.find(l => l.id === deleteTargetId)?.title}</b>? Data persyaratan juga akan ikut terhapus.</p></div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10" onClick={() => setIsDeleteOpen(false)}>Batal</button>
                                        <button className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500 transition-all font-bold" onClick={confirmDelete}>Ya, Hapus</button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={feedback.isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeFeedback}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className={`w-full max-w-sm transform overflow-hidden rounded-2xl border backdrop-blur-xl p-6 text-center align-middle shadow-2xl transition-all bg-[#0f172a]/95 ${feedback.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'
                                    }`}>
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                                        {feedback.type === 'success' ? <CheckCircleIcon className="h-12 w-12 text-green-400" /> : <XCircleIcon className="h-12 w-12 text-red-400" />}
                                    </div>
                                    <DialogTitle as="h3" className={`text-xl font-bold ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{feedback.title}</DialogTitle>
                                    <div className="mt-2"><p className="text-sm text-gray-300">{feedback.message}</p></div>
                                    <div className="mt-6">
                                        <button type="button" className={`inline-flex justify-center rounded-xl border border-transparent px-6 py-2 text-sm font-bold text-white shadow-lg transition-all ${feedback.type === 'success' ? 'bg-green-600 hover:bg-green-500 shadow-green-500/20' : 'bg-red-600 hover:bg-red-500 shadow-red-500/20'}`} onClick={closeFeedback}>Oke</button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

        </div>
    );
}
