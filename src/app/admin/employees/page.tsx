'use client';

import React, { useEffect, useState } from 'react';
import { 
  getMVPEmployees, 
  addMVPEmployee, 
  deleteMVPEmployee, 
  getCurrentSession, 
  RestaurantUser 
} from '@/lib/mvp-db';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Loader2, 
  AlertTriangle,
  Check,
  UserPlus,
  X,
  Mail,
  Lock,
  User,
  ShieldAlert
} from 'lucide-react';

export default function EmployeesManagementPage() {
  const [employees, setEmployees] = useState<RestaurantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'cook' | 'waiter'>('cook');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      setRestaurantId(session.restaurant.id);
      loadEmployees(session.restaurant.id);
    }
  }, []);

  const loadEmployees = async (restId: string) => {
    try {
      const data = await getMVPEmployees(restId);
      setEmployees(data);
    } catch (err) {
      console.error(err);
      showToast("Impossible de charger la liste des employés.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError("Veuillez remplir tous les champs.");
      return;
    }

    if (!restaurantId) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const newEmployee = await addMVPEmployee(restaurantId, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: role
      });

      if (newEmployee) {
        setEmployees(prev => [...prev, newEmployee]);
        showToast(`Compte pour ${name} créé avec succès !`);
        
        // Reset form & close modal
        setName('');
        setEmail('');
        setPassword('');
        setRole('cook');
        setIsModalOpen(false);
      } else {
        setFormError("Erreur lors de la création du compte.");
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Erreur de création du compte.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string, employeeName: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le compte de ${employeeName} ?`)) return;

    try {
      const success = await deleteMVPEmployee(id);
      if (success) {
        setEmployees(prev => prev.filter(emp => emp.id !== id));
        showToast(`Compte de ${employeeName} supprimé.`);
      } else {
        showToast("Impossible de supprimer le compte.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Une erreur est survenue lors de la suppression.", "error");
    }
  };

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
            {toast.type === 'success' ? (
              <Check size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-red-400 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={10} />
            <span>Gestion d'équipe</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">Personnel & Employés</h1>
          <p className="text-slate-400 text-xs mt-1">Créez et gérez les comptes pour vos cuisiniers et serveurs</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-3 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 rounded-2xl shadow-lg shadow-amber-500/10 transition-all duration-200 active:scale-[0.98] tap-feedback shrink-0 cursor-pointer"
        >
          <UserPlus size={15} />
          <span>Ajouter un Employé</span>
        </button>
      </div>

      {/* Main List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Employés Actifs ({employees.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
            <span>Chargement des comptes employés...</span>
          </div>
        ) : employees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {employees.map((emp, idx) => (
              <div 
                key={`employee-card-${emp.id}-${idx}`}
                className="p-5 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col justify-between gap-5 glass-morphism shadow-sm relative group overflow-hidden animate-cascade"
                style={{ animationDelay: `${idx * 40}ms`, opacity: 0 }}
              >
                {/* User details header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-450 shrink-0">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{emp.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">{emp.email}</p>
                    </div>
                  </div>

                  {/* Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                    emp.role === 'cook'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {emp.role === 'cook' ? 'Cuisine' : 'Serveur'}
                  </span>
                </div>

                {/* Bottom line actions */}
                <div className="flex items-center justify-between border-t border-slate-950/60 pt-3 text-xs">
                  <div className="text-[9px] text-slate-500 font-mono">
                    ID: {emp.id.substring(0, 8)}...
                  </div>

                  <button
                    onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-850 text-slate-500 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer tap-feedback"
                    title="Supprimer le compte"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl border border-dashed border-slate-900 bg-slate-900/10 text-slate-500 flex flex-col items-center gap-2.5">
            <ShieldAlert size={36} className="opacity-30 text-amber-500 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider">Aucun compte employé créé.</p>
            <p className="text-[11px] text-slate-650 max-w-xs leading-relaxed">Créez des accès pour que vos cuisiniers et serveurs puissent ouvrir la console cuisine.</p>
          </div>
        )}
      </div>

      {/* Add Employee Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-850 flex justify-between items-center bg-slate-950/20 backdrop-blur-md">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <UserPlus size={18} className="text-amber-500" />
                <span>Nouveau Compte Employé</span>
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError(null);
                }}
                className="w-9 h-9 rounded-2xl bg-slate-850 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddEmployee} className="p-6 overflow-y-auto flex flex-col gap-5">
              
              {formError && (
                <div className="px-4 py-3 rounded-2xl bg-red-950/50 border border-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-2 animate-shake">
                  <AlertTriangle size={15} className="text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nom Complet</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Chef Amadou, Serveur Koffi..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-605 focus:outline-none focus:border-amber-500 text-xs transition-colors"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Email input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adresse E-mail</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="email" 
                    required
                    placeholder="Ex: amadou@restaurant.ci"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-605 focus:outline-none focus:border-amber-500 text-xs transition-colors"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Password input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mot de passe provisoire</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: amadou2026"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-605 focus:outline-none focus:border-amber-500 text-xs transition-colors font-mono"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Role Radio Select */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rôle / Poste</label>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Cook */}
                  <label className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    role === 'cook'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                      : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="cook"
                      checked={role === 'cook'}
                      onChange={() => setRole('cook')}
                      className="sr-only"
                    />
                    <span>Cuisine (Cook)</span>
                  </label>

                  {/* Waiter */}
                  <label className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    role === 'waiter'
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="waiter"
                      checked={role === 'waiter'}
                      onChange={() => setRole('waiter')}
                      className="sr-only"
                    />
                    <span>Serveur (Waiter)</span>
                  </label>

                </div>
              </div>

              {/* Submit Area */}
              <div className="mt-4 flex gap-3 pt-4 border-t border-slate-900/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-3.5 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  disabled={submitting}
                >
                  Annuler
                </button>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 tap-feedback shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <span>Créer le compte</span>
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
