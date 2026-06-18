'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  getMenuItems, 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem, 
  uploadMenuImage, 
  getCurrentSession,
  MenuItem,
  formatFCFA
} from '@/lib/mvp-db';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Search, 
  X, 
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  UtensilsCrossed,
  Check
} from 'lucide-react';

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [restaurantId, setRestaurantId] = useState('');

  const loadMenu = async (restId?: string) => {
    const idToUse = restId || restaurantId;
    if (!idToUse) return;
    try {
      const items = await getMenuItems(idToUse);
      // Remove any potential duplicates by ID
      const uniqueItems = items.filter((item, index, self) =>
        self.findIndex(t => t.id === item.id) === index
      );
      setMenuItems(uniqueItems);
    } catch (err) {
      console.error(err);
      showToast("Impossible de charger le menu.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      setRestaurantId(session.restaurant.id);
      loadMenu(session.restaurant.id);
    }
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Switch Toggle handler
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const success = await updateMenuItem(id, { is_active: !currentStatus });
      if (success) {
        setMenuItems(prev => 
          prev.map(item => item.id === id ? { ...item, is_active: !currentStatus } : item)
        );
        showToast("Statut du plat mis à jour.");
      } else {
        showToast("Échec de la mise à jour.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur réseau.", "error");
    }
  };

  // Image Selection & Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Add modal
  const openAddModal = () => {
    setModalMode('add');
    setCurrentId(null);
    setFormName('');
    setFormDescription('');
    setFormCategory('Entrées');
    setFormPrice('');
    setFormIsActive(true);
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  // Open Edit modal
  const openEditModal = (item: MenuItem) => {
    setModalMode('edit');
    setCurrentId(item.id);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormCategory(item.category);
    setFormPrice(item.price.toString());
    setFormIsActive(item.is_active);
    setImageFile(null);
    setImagePreview(item.image_url || null);
    setIsModalOpen(true);
  };

  // Delete handler
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce plat ?")) return;
    try {
      const success = await deleteMenuItem(id);
      if (success) {
        setMenuItems(prev => prev.filter(item => item.id !== id));
        showToast("Plat supprimé avec succès.");
      } else {
        showToast("Échec de la suppression.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur de connexion.", "error");
    }
  };

  // Form submit handler (Add/Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice || !formCategory) {
      showToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    setSubmitting(true);
    let finalImageUrl = imagePreview;

    try {
      // Uploader l'image si un fichier est choisi
      if (imageFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadMenuImage(imageFile);
        setUploadingImage(false);
      }

      const itemInput = {
        restaurant_id: restaurantId,
        name: formName,
        description: formDescription || null,
        price: parseFloat(formPrice),
        category: formCategory,
        image_url: finalImageUrl,
        is_active: formIsActive
      };

      if (modalMode === 'add') {
        const res = await addMenuItem(itemInput);
        if (res) {
          showToast("Nouveau plat ajouté au menu !");
          loadMenu();
          setIsModalOpen(false);
        } else {
          showToast("Impossible d'ajouter le plat.", "error");
        }
      } else if (modalMode === 'edit' && currentId) {
        const success = await updateMenuItem(currentId, itemInput);
        if (success) {
          showToast("Plat modifié avec succès !");
          loadMenu();
          setIsModalOpen(false);
        } else {
          showToast("Impossible de modifier le plat.", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la soumission.", "error");
    } finally {
      setUploadingImage(false);
      setSubmitting(false);
    }
  };

  // Get unique categories for filters
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-8 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-slide-up">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold border ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/20'
              : 'bg-red-950/90 text-red-300 border-red-500/20'
          }`}>
            {toast.type === 'success' ? <Check size={18} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={18} className="text-red-400 shrink-0" />}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={10} />
            <span>Gestion de la carte</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">Gestion du Menu</h1>
          <p className="text-slate-400 text-xs mt-1">Créez, modifiez et gérez la disponibilité des plats</p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider tap-feedback shadow-lg shadow-amber-500/10 shrink-0"
        >
          <Plus size={16} />
          <span>Ajouter un plat</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/20 border border-slate-900 p-4 rounded-2xl glass-morphism shadow-sm">
        
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Rechercher un plat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#0a0f1d] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs transition-colors"
          />
        </div>

        {/* Category select */}
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="w-full px-4 py-3 bg-[#0a0f1d] border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Main Table Panel */}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/20 overflow-hidden glass-morphism shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-450 text-[10px] font-black uppercase tracking-wider">
                <th className="py-4 px-6 w-24">Image</th>
                <th className="py-4 px-6">Nom</th>
                <th className="py-4 px-6">Catégorie</th>
                <th className="py-4 px-6 text-right">Prix</th>
                <th className="py-4 px-6 text-center w-32">Statut</th>
                <th className="py-4 px-6 text-center w-28">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
                    <span>Chargement de la carte...</span>
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <tr 
                    key={`menu-row-${item.id}-${idx}`}
                    className="hover:bg-slate-900/10 transition-colors animate-cascade"
                    style={{ animationDelay: `${idx * 40}ms`, opacity: 0 }}
                  >
                    <td className="py-4 px-6">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner relative zoom-image-container shrink-0">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-950">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-200">
                      <span className="block truncate max-w-[180px]" title={item.name}>{item.name}</span>
                      <span className="text-[10px] text-slate-500 font-semibold truncate block max-w-[180px] mt-0.5" title={item.description || ''}>
                        {item.description || "Aucune description"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-400 font-semibold">{item.category}</td>

                    <td className="py-4 px-6 text-right font-black text-amber-500 font-mono">
                      {formatFCFA(item.price)}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center gap-2">
                        {/* Custom Switch button */}
                        <button
                          onClick={() => handleToggleActive(item.id, item.is_active)}
                          className={`w-12 h-6.5 rounded-full transition-all relative flex items-center p-0.5 tap-feedback ${
                            item.is_active 
                              ? 'bg-amber-500 shadow-md shadow-amber-500/10' 
                              : 'bg-slate-950 border border-slate-800'
                          }`}
                        >
                          <div className={`w-5.5 h-5.5 rounded-full transition-transform duration-250 ${
                            item.is_active 
                              ? 'translate-x-5.5 bg-slate-950' 
                              : 'translate-x-0 bg-slate-500'
                          }`} />
                        </button>
                        <span className={`text-[10px] font-black uppercase tracking-wider w-16 text-left ${
                          item.is_active ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {item.is_active ? 'Actif' : 'Rupture'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:border-slate-700 transition-colors tap-feedback"
                          title="Modifier"
                        >
                          <Edit3 size={14} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-500 hover:text-red-400 hover:border-red-500/10 transition-colors tap-feedback"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="max-w-xs mx-auto flex flex-col items-center gap-2">
                      <UtensilsCrossed size={36} className="opacity-30" />
                      <p className="text-xs font-semibold uppercase tracking-wider">Aucun plat ne correspond à vos critères</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Form (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-850 flex justify-between items-center bg-slate-950/20 backdrop-blur-md">
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                {modalMode === 'add' ? "Ajouter un plat" : "Modifier le plat"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-2xl bg-slate-850 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 flex-grow overflow-y-auto flex flex-col gap-4">
              
              {/* Name field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nom du plat <span className="text-amber-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Tchep au poisson, Allocos..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs transition-colors"
                />
              </div>

              {/* Price & Category Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Prix en FCFA <span className="text-amber-500">*</span></label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    placeholder="Ex: 5000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs transition-colors font-mono"
                  />
                </div>

                {/* Category selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Catégorie <span className="text-amber-500">*</span></label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 text-xs transition-colors"
                  >
                    <option value="Entrées">Entrées</option>
                    <option value="Plats">Plats</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Boissons">Boissons</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Détails des ingrédients, accompagnements..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs transition-colors h-20 resize-none"
                />
              </div>

              {/* Image upload box */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Photo du Plat</label>
                
                <div className="flex gap-4 items-center">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl bg-slate-950 border border-dashed border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center text-slate-600 cursor-pointer shadow-inner relative overflow-hidden transition-all shrink-0 group"
                  >
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover group-hover:opacity-85 transition-opacity"
                      />
                    ) : (
                      <>
                        <ImageIcon size={20} className="text-slate-600 mb-1" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-700">Choisir</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 text-[10px] font-bold uppercase tracking-wider tap-feedback"
                    >
                      Parcourir...
                    </button>
                    <span className="text-[9px] text-slate-500">Formats supportés : JPG, PNG, WEBP (Max 5Mo)</span>
                  </div>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Toggle Status in form */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/30 border border-slate-850 mt-2">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Disponible immédiatement</span>
                  <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Si désactivé, le plat sera affiché en "Rupture"</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 tap-feedback ${
                    formIsActive ? 'bg-amber-500' : 'bg-slate-950 border border-slate-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full transition-transform ${
                    formIsActive ? 'translate-x-5 bg-slate-950' : 'translate-x-0 bg-slate-500'
                  }`} />
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 mt-4 border-t border-slate-850 pt-4 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-3.5 rounded-xl border border-slate-850 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider tap-feedback"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 tap-feedback"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{uploadingImage ? "Upload photo..." : "Enregistrement..."}</span>
                    </>
                  ) : (
                    <span>Valider</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
