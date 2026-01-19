import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  TrashIcon, PlusIcon, PhotoIcon, CheckIcon, ChevronUpDownIcon, 
  ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon 
} from '@heroicons/react/24/solid';
import { 
  Listbox, Transition, ListboxButton, ListboxOptions, ListboxOption, 
  Dialog, DialogPanel, DialogTitle, TransitionChild 
} from '@headlessui/react';

export default function BeritaManager() {
  const [berita, setBerita] = useState([]);
  
  const [form, setForm] = useState({ 
    judul: '', 
    isi: '', 
    kategori: 'Berita Kesehatan' 
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const KATEGORI_OPTIONS = [
    "Berita Kesehatan",
    "Berita Kegiatan Kesra",
    "Berita Kegiatan Ekbang"
  ];

  useEffect(() => { fetchBerita(); }, []);

  const fetchBerita = async () => {
    const { data } = await supabase.from('berita').select('*').order('created_at', { ascending: false });
    setBerita(data || []);
  };

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const closeFeedback = () => {
    setFeedback(prev => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let imageUrl = null;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `berita/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, imageFile);
      if (uploadError) { 
        showFeedback('error', 'Gagal Upload', 'Terjadi kesalahan saat mengunggah gambar.');
        setLoading(false); 
        return; 
      }
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from('berita').insert([
      { judul: form.judul, isi: form.isi, kategori: form.kategori, image_url: imageUrl }
    ]);

    if (!error) {
      showFeedback('success', 'Berhasil!', 'Berita telah berhasil diterbitkan ke halaman warga.');
      
      setForm({ judul: '', isi: '', kategori: 'Berita Kesehatan' }); 
      setImageFile(null); 
      fetchBerita();
    } else {
      showFeedback('error', 'Terjadi Kesalahan', error.message);
    }
    setLoading(false);
  };

  const openDeleteModal = (id) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    const { error } = await supabase.from('berita').delete().eq('id', deleteTargetId);
    
    setDeleteTargetId(null);
    setIsDeleteOpen(false);

    if (!error) {
      fetchBerita();
      showFeedback('success', 'Dihapus', 'Berita berhasil dihapus dari database.');
    } else {
      showFeedback('error', 'Gagal Hapus', error.message);
    }
  };

  const getCategoryColor = (cat) => {
    switch(cat) {
      case 'Berita Kesehatan': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Berita Kegiatan Kesra': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Berita Kegiatan Ekbang': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      
      {/* FORM CARD GLASS */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl relative overflow-visible z-10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg relative z-10">
          <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <PlusIcon className="h-5 w-5 text-blue-300"/>
          </div>
          Buat Berita Baru
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Judul Berita" 
              className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              value={form.judul} onChange={e => setForm({...form, judul: e.target.value})} required 
            />

            <div className="relative">
              <Listbox value={form.kategori} onChange={(val) => setForm({...form, kategori: val})}>
                <div className="relative mt-1">
                  <ListboxButton className="relative w-full cursor-pointer bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-left text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition sm:text-sm">
                    <span className="block truncate">{form.kategori}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </ListboxButton>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <ListboxOptions className="absolute mt-2 max-h-60 w-full overflow-auto rounded-xl bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                      {KATEGORI_OPTIONS.map((kategori, personIdx) => (
                        <ListboxOption key={personIdx} className={({ active }) => `relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors ${active ? 'bg-blue-600/30 text-white' : 'text-gray-300'}`} value={kategori}>
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
          </div>

          <textarea 
            placeholder="Tulis isi berita lengkap di sini..." rows="4" 
            className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            value={form.isi} onChange={e => setForm({...form, isi: e.target.value})} required
          ></textarea>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
             <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-4 py-3 rounded-xl transition w-full md:w-auto justify-center">
                <PhotoIcon className="h-5 w-5" />
                <span className="text-sm truncate max-w-[200px]">{imageFile ? imageFile.name : "Pilih Gambar Sampul"}</span>
                <input type="file" onChange={e => setImageFile(e.target.files[0])} className="hidden" accept="image/*" />
             </label>

             <button disabled={loading} className="flex-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50">
               {loading ? 'Sedang Mengupload...' : 'Terbitkan Berita'}
             </button>
          </div>
        </form>
      </div>

      {/* TABLE LIST */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-black/20 text-blue-200 uppercase text-xs tracking-wider border-b border-white/5">
              <tr>
                <th className="p-5 font-semibold">Gambar</th>
                <th className="p-5 font-semibold">Info Berita</th>
                <th className="p-5 font-semibold">Kategori</th>
                <th className="p-5 font-semibold">Tanggal</th>
                <th className="p-5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {berita.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition duration-150">
                  <td className="p-4 align-top">
                    {item.image_url ? 
                      <div className="w-20 h-14 rounded-lg overflow-hidden border border-white/10">
                        <img src={item.image_url} className="w-full h-full object-cover" alt="thumbnail" />
                      </div> : 
                      <div className="w-20 h-14 bg-white/5 rounded-lg flex items-center justify-center text-xs border border-white/5">No IMG</div>
                    }
                  </td>
                  <td className="p-4 align-top">
                    <p className="font-bold text-white text-base mb-1 line-clamp-1">{item.judul}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{item.isi}</p>
                  </td>
                  <td className="p-4 align-top">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.kategori)}`}>
                      {item.kategori || 'Umum'}
                    </span>
                  </td>
                  <td className="p-4 align-top text-gray-400 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 align-top text-right">
                    <button onClick={() => openDeleteModal(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition border border-red-500/10 hover:border-red-500/30">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: KONFIRMASI DELETE --- */}
      <Transition appear show={isDeleteOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsDeleteOpen(false)}>
          <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#0f172a]/90 border border-white/20 backdrop-blur-xl p-6 text-left align-middle shadow-2xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                    </div>
                    <DialogTitle as="h3" className="text-lg font-bold leading-6 text-white">Konfirmasi Hapus</DialogTitle>
                  </div>
                  <div className="mt-4"><p className="text-sm text-gray-300">Yakin hapus berita ini? Tidak dapat dibatalkan.</p></div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10" onClick={() => setIsDeleteOpen(false)}>Batal</button>
                    <button className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500 shadow-lg shadow-red-500/20" onClick={confirmDelete}>Ya, Hapus</button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* --- MODAL 2: FEEDBACK SUKSES/ERROR (BARU) --- */}
      <Transition appear show={feedback.isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeFeedback}>
          <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <DialogPanel className={`w-full max-w-sm transform overflow-hidden rounded-2xl border backdrop-blur-xl p-6 text-center align-middle shadow-2xl transition-all ${
                    feedback.type === 'success' ? 'bg-[#0f172a]/90 border-green-500/30' : 'bg-[#0f172a]/90 border-red-500/30'
                }`}>
                  
                  {/* ICON */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                    {feedback.type === 'success' ? (
                        <CheckCircleIcon className="h-12 w-12 text-green-400" />
                    ) : (
                        <XCircleIcon className="h-12 w-12 text-red-400" />
                    )}
                  </div>

                  <DialogTitle as="h3" className={`text-xl font-bold leading-6 ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {feedback.title}
                  </DialogTitle>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-300">
                      {feedback.message}
                    </p>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      className={`inline-flex justify-center rounded-xl border border-transparent px-6 py-2 text-sm font-medium text-white shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        feedback.type === 'success' 
                        ? 'bg-green-600 hover:bg-green-500 focus-visible:ring-green-500 shadow-green-500/20' 
                        : 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500 shadow-red-500/20'
                      }`}
                      onClick={closeFeedback}
                    >
                      Oke, Mengerti
                    </button>
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