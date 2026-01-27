import { useState, useEffect, Fragment, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    TrashIcon, PlusIcon, DocumentIcon, CheckIcon,
    ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon,
    ArrowDownTrayIcon, CloudArrowUpIcon, XMarkIcon
} from '@heroicons/react/24/solid';
import {
    Dialog, DialogPanel, DialogTitle, Transition, TransitionChild
} from '@headlessui/react';

export default function TemplateManager() {
    const [templates, setTemplates] = useState([]);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [feedback, setFeedback] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('type', 'dokument_template')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching templates:', error);
        } else {
            setTemplates(data || []);
        }
    };

    const showFeedback = (type, title, message) => {
        setFeedback({ isOpen: true, type, title, message });
    };

    const closeFeedback = () => {
        setFeedback(prev => ({ ...prev, isOpen: false }));
    };

    // --- DRAG & DROP HANDLERS ---
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
    };

    const addFiles = (newFiles) => {
        const validFiles = newFiles.filter(f =>
            f.type === 'application/pdf' ||
            f.name.endsWith('.doc') ||
            f.name.endsWith('.docx')
        );

        if (validFiles.length < newFiles.length) {
            showFeedback('error', 'Format Tidak Sesuai', 'Hanya file PDF dan Word yang diperbolehkan.');
        }

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadAll = async () => {
        if (files.length === 0) return;

        setUploading(true);
        let successCount = 0;
        let failCount = 0;
        let overwriteCount = 0;

        for (const file of files) {
            try {
                // 1. Check for existing record
                const { data: existing, error: checkError } = await supabase
                    .from('items')
                    .select('*')
                    .eq('type', 'dokument_template')
                    .eq('title', file.name)
                    .single();

                if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is code for "no rows found"
                    throw checkError;
                }

                const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                const filePath = `templates/${fileName}`;

                // 2. If exists, delete old storage file first
                if (existing && existing.data?.path) {
                    await supabase.storage
                        .from('images')
                        .remove([existing.data.path]);
                }

                // 3. Upload new file to Storage
                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 4. Get Public URL
                const { data: urlData } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                // 5. Update or Insert Database Record
                const itemData = {
                    type: 'dokument_template',
                    title: file.name,
                    description: `Ukuran: ${(file.size / 1024).toFixed(1)} KB`,
                    data: {
                        url: urlData.publicUrl,
                        path: filePath,
                        fileName: fileName,
                        originalName: file.name,
                        size: file.size
                    }
                };

                if (existing) {
                    const { error: updateError } = await supabase
                        .from('items')
                        .update(itemData)
                        .eq('id', existing.id);
                    if (updateError) throw updateError;
                    overwriteCount++;
                } else {
                    const { error: dbError } = await supabase
                        .from('items')
                        .insert([itemData]);
                    if (dbError) throw dbError;
                    successCount++;
                }
            } catch (error) {
                console.error(`Gagal upload ${file.name}:`, error);
                failCount++;
            }
        }

        if (failCount === 0) {
            const msg = overwriteCount > 0
                ? `${successCount} baru, ${overwriteCount} diperbarui.`
                : `${successCount} file berhasil diunggah.`;
            showFeedback('success', 'Berhasil', msg);
        } else {
            showFeedback('error', 'Selesai dengan error', `${successCount + overwriteCount} berhasil, ${failCount} gagal.`);
        }

        setFiles([]);
        setUploading(false);
        fetchTemplates();
    };

    const confirmDelete = (template) => {
        setDeleteTarget(template);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget.data?.path) {
                await supabase.storage
                    .from('images')
                    .remove([deleteTarget.data.path]);
            }

            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', deleteTarget.id);

            if (error) throw error;

            showFeedback('success', 'Dihapus', 'Template berhasil dihapus.');
            fetchTemplates();
        } catch (error) {
            showFeedback('error', 'Gagal Hapus', error.message);
        } finally {
            setIsDeleteOpen(false);
            setDeleteTarget(null);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 font-sans pb-20">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Manajer Template</h2>
                    <p className="text-gray-400 text-sm">Kelola dokumen surat resmi kelurahan</p>
                </div>
            </div>

            {/* UPLOAD BOX (DRAG & DROP) */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative group transition-all duration-300
                    bg-white/5 backdrop-blur-xl border-2 border-dashed rounded-3xl p-8 md:p-12
                    flex flex-col items-center justify-center text-center
                    ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' : 'border-white/10 hover:border-white/20'}
                `}
            >
                <div className={`
                    p-6 rounded-full transition-transform duration-500
                    ${isDragging ? 'bg-blue-500 scale-110' : 'bg-white/5'}
                `}>
                    <CloudArrowUpIcon className={`h-12 w-12 ${isDragging ? 'text-white' : 'text-blue-400'}`} />
                </div>

                <div className="mt-6">
                    <h4 className="text-xl font-bold text-white">Tarik & Lepas file di sini</h4>
                    <p className="text-gray-400 mt-2 text-sm max-w-xs mx-auto">
                        Mendukung PDF, Word (.doc, .docx). Anda bisa pilih banyak file sekaligus.
                    </p>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <label className="cursor-pointer bg-white text-gray-950 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-50 transition active:scale-95">
                        Pilih File
                        <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx" onChange={handleFileSelect} />
                    </label>
                </div>

                {/* FILE QUEUE */}
                {files.length > 0 && (
                    <div className="mt-10 w-full max-w-2xl bg-black/30 rounded-2xl p-4 border border-white/5 text-left">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">{files.length} File terpilih</span>
                            <button onClick={() => setFiles([])} className="text-[10px] text-red-400 hover:text-red-300 transition">Hapus Semua</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {files.map((f, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 group/item">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <DocumentIcon className="h-5 w-5 text-gray-400 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm text-white font-medium truncate">{f.name}</p>
                                            <p className="text-[10px] text-gray-500">{(f.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFile(idx)} className="p-1 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition">
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            disabled={uploading}
                            onClick={handleUploadAll}
                            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-600/20"
                        >
                            {uploading ? 'Sedang Mengunggah...' : `Gunakan & Upload ${files.length} File`}
                        </button>
                    </div>
                )}
            </div>

            {/* TEMPLATE LIST - RESPONSIVE DESIGN */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h4 className="text-white font-bold flex items-center gap-2">
                        <DocumentIcon className="h-5 w-5 text-blue-400" />
                        Daftar Dokumen
                    </h4>
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-500/20">
                        {templates.length} ITEMS
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-black/20 text-gray-400 uppercase text-[10px] font-bold tracking-[0.2em]">
                            <tr>
                                <th className="p-6">Nama Dokumen</th>
                                <th className="p-6 hidden md:table-cell">Ukuran & Tanggal</th>
                                <th className="p-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {templates.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-20 text-center">
                                        <div className="flex flex-col items-center opacity-30">
                                            <DocumentIcon className="h-12 w-12 mb-2" />
                                            <p>Belum ada template yang tersedia</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                templates.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition group">
                                        <td className="p-5 md:p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-blue-500/10 transition duration-300">
                                                    <DocumentIcon className="h-6 w-6 text-blue-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="block font-bold text-white truncate max-w-[150px] md:max-w-md">{item.title}</span>
                                                    <span className="block md:hidden text-[10px] text-gray-500 mt-1">{item.description} • {new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 hidden md:table-cell text-xs text-gray-400">
                                            <p className="font-medium text-gray-300">{item.description}</p>
                                            <p className="opacity-50 mt-1">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        </td>
                                        <td className="p-5 md:p-6 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <a
                                                    href={item.data?.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-3 bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-xl transition border border-white/5 hover:border-blue-500/20"
                                                    title="Download"
                                                >
                                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                                </a>
                                                <button
                                                    onClick={() => confirmDelete(item)}
                                                    className="p-3 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition border border-white/5 hover:border-red-500/20"
                                                    title="Hapus"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DELETE MODAL */}
            <Transition appear show={isDeleteOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsDeleteOpen(false)}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
                    </TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-[2.5rem] bg-[#0f172a] border border-white/10 p-10 text-left align-middle shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="p-4 bg-red-500/10 rounded-full mb-6">
                                            <TrashIcon className="h-10 w-10 text-red-500" />
                                        </div>
                                        <DialogTitle as="h3" className="text-2xl font-bold text-white mb-4">Hapus Template?</DialogTitle>
                                        <p className="text-gray-400 leading-relaxed mb-8">
                                            Dokumen <b className="text-white">{deleteTarget?.title}</b> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                        </p>
                                        <div className="flex flex-col w-full gap-3">
                                            <button
                                                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition shadow-lg shadow-red-600/20"
                                                onClick={handleDelete}
                                            >
                                                Ya, Hapus Sekarang
                                            </button>
                                            <button
                                                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition"
                                                onClick={() => setIsDeleteOpen(false)}
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* FEEDBACK MODAL */}
            <Transition appear show={feedback.isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeFeedback}>
                    <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/60" />
                    </TransitionChild>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <DialogPanel className={`w-full max-w-sm rounded-3xl border p-8 text-center shadow-2xl bg-[#0f172a] ${feedback.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'}`}>
                                    <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-6 ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {feedback.type === 'success' ? <CheckCircleIcon className="h-12 w-12" /> : <XCircleIcon className="h-12 w-12" />}
                                    </div>
                                    <DialogTitle as="h3" className={`text-2xl font-bold ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{feedback.title}</DialogTitle>
                                    <p className="mt-4 text-gray-400 leading-relaxed">{feedback.message}</p>
                                    <button onClick={closeFeedback} className="mt-8 bg-white/10 hover:bg-white/20 text-white w-full py-4 rounded-2xl font-bold transition">Tutup</button>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>

        </div>
    );
}
