'use client';

import React, { useEffect, useState } from 'react';
import { 
  getMVPTables, 
  addMVPTable, 
  deleteMVPTable, 
  getCurrentSession,
  AdminTable 
} from '@/lib/mvp-db';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Plus, 
  Download, 
  Trash2, 
  Sparkles, 
  Loader2, 
  AlertTriangle,
  QrCode,
  Check,
  ExternalLink
} from 'lucide-react';

export default function TablesManagementPage() {
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [addingTable, setAddingTable] = useState(false);
  const [origin, setOrigin] = useState('http://localhost:3000');
  const [restaurantId, setRestaurantId] = useState('');

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    const session = getCurrentSession();
    let restId = '';
    if (session) {
      restId = session.restaurant.id;
      setRestaurantId(restId);
    }

    async function loadTables() {
      try {
        const data = await getMVPTables(restId);
        // Filter out any potential duplicates by ID
        const uniqueData = data.filter((item, index, self) =>
          self.findIndex(t => t.id === item.id) === index
        );
        setTables(uniqueData);
      } catch (err) {
        console.error(err);
        showToast("Impossible de charger les tables.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadTables();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Add table handler
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) return;

    setAddingTable(true);
    try {
      const res = await addMVPTable(newTableNumber.trim(), restaurantId);
      if (res) {
        setTables(prev => {
          const updated = [...prev, res];
          // Remove duplicates
          const uniqueUpdated = updated.filter((item, index, self) =>
            self.findIndex(t => t.id === item.id) === index
          );
          // Trier les tables par numéro
          uniqueUpdated.sort((a, b) => {
            const numA = parseInt(a.table_number);
            const numB = parseInt(b.table_number);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.table_number.localeCompare(b.table_number);
          });
          return uniqueUpdated;
        });
        showToast(`Table ${newTableNumber} créée avec succès !`);
        setNewTableNumber('');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Erreur de création de la table.", "error");
    } finally {
      setAddingTable(false);
    }
  };

  // Delete table handler
  const handleDeleteTable = async (id: string, number: string) => {
    if (!confirm(`Voulez-vous supprimer la Table ${number} ?`)) return;

    try {
      const success = await deleteMVPTable(id);
      if (success) {
        setTables(prev => prev.filter(t => t.id !== id));
        showToast(`Table ${number} supprimée.`);
      }
    } catch (err) {
      console.error(err);
      showToast("Échec de la suppression.", "error");
    }
  };

  // Download QR Code PNG function
  const downloadQR = (tableNumber: string) => {
    const canvas = document.getElementById(`qr-canvas-${tableNumber}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_Bistro_Table_${tableNumber}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showToast(`QR Code Table ${tableNumber} téléchargé !`);
    } else {
      showToast("Impossible de télécharger le QR code.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-8 relative">
      
      {/* Toast */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={10} />
            <span>Salles & Impression</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">Tables & QR Codes</h1>
          <p className="text-slate-400 text-xs mt-1">Générez des QR codes uniques pour chaque table afin de permettre la prise de commande</p>
        </div>
      </div>

      {/* Grid Layout: Add table & Tables List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left column: Add Table Form Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/30 border border-slate-900 glass-morphism flex flex-col gap-5 shadow-sm">
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Ajouter une Table</h2>
            <p className="text-xs text-slate-500 mt-1">Saisissez le numéro ou l'identifiant</p>
          </div>

          <form onSubmit={handleAddTable} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Numéro de table</label>
              <input 
                type="text" 
                required
                placeholder="Ex: 5, 12, A3..."
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-amber-500 text-xs transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={addingTable}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 tap-feedback"
            >
              {addingTable ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <Plus size={15} />
                  <span>Créer la Table</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right column: Tables List Grid */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tables Actives ({tables.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
              <span>Chargement des QR codes...</span>
            </div>
          ) : tables.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {tables.map((table, idx) => {
                const targetUrl = `${origin}/table/${table.table_number}`;
                return (
                  <div 
                    key={`table-row-${table.id}-${idx}`}
                    className="p-5 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col items-center gap-5 glass-morphism shadow-sm menu-item-card animate-cascade relative group overflow-hidden"
                    style={{ animationDelay: `${idx * 40}ms`, opacity: 0 }}
                  >
                    
                    {/* Header info */}
                    <div className="w-full flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-black text-white font-mono">Table {table.table_number}</h4>
                        <span className="text-[9px] text-slate-500 font-semibold truncate block max-w-[130px] font-mono mt-0.5" title={targetUrl}>
                          {targetUrl.split('//')[1]}
                        </span>
                      </div>
                      
                      {/* Delete table */}
                      <button
                        onClick={() => handleDeleteTable(table.id, table.table_number)}
                        className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-500 hover:text-red-400 hover:border-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity tap-feedback"
                        title="Supprimer la table"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* QR Code Canvas */}
                    <div className="p-3 bg-white rounded-2xl shadow-inner relative flex items-center justify-center shrink-0">
                      <QRCodeCanvas 
                        id={`qr-canvas-${table.table_number}`}
                        value={targetUrl}
                        size={120}
                        bgColor={"#ffffff"}
                        fgColor={"#070b13"}
                        level={"Q"}
                        includeMargin={false}
                      />
                    </div>

                    {/* Actions */}
                    <div className="w-full flex gap-2.5">
                      
                      {/* Download */}
                      <button
                        onClick={() => downloadQR(table.table_number)}
                        className="w-1/2 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-300 hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-xl tap-feedback transition-colors"
                      >
                        <Download size={13} />
                        <span>Télécharger</span>
                      </button>
                      
                      {/* Test Link */}
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-1/2 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-xl tap-feedback transition-colors text-center"
                      >
                        <ExternalLink size={13} />
                        <span>Tester</span>
                      </a>

                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center rounded-2xl border border-dashed border-slate-900 bg-slate-900/10 text-slate-500 flex flex-col items-center gap-2">
              <QrCode size={36} className="opacity-30" />
              <p className="text-xs font-semibold uppercase tracking-wider">Aucune table enregistrée.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
