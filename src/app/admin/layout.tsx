'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  QrCode, 
  Menu, 
  X, 
  ChefHat, 
  LogOut,
  User,
  CreditCard,
  CheckCircle,
  RefreshCw,
  Calendar,
  Sparkles,
  Mail,
  MapPin,
  ShieldCheck,
  Users,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  formatFCFA, 
  getCurrentSession, 
  logoutMVPUser,
  getMVPRestaurantById,
  isRestaurantSubscriptionValid,
  updateMVPUserPassword
} from '@/lib/mvp-db';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Session states
  const [session, setSession] = useState<{ user: any; restaurant: any } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Navigation states
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Account & Subscription states
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [subExpDate, setSubExpDate] = useState('18 Juillet 2026');
  const [renewing, setRenewing] = useState(false);
  const [renewed, setRenewed] = useState(false);

  // Password update states
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setUpdatingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      const success = await updateMVPUserPassword(newPassword);
      if (success) {
        setPasswordSuccess(true);
        setNewPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError("Échec de la mise à jour.");
      }
    } catch (err: any) {
      setPasswordError(err.message || "Une erreur est survenue.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Route Guard checking
  useEffect(() => {
    async function checkAuth() {
      const activeSession = getCurrentSession();
      if (!activeSession || activeSession.user.role !== 'admin') {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      
      try {
        const freshRest = await getMVPRestaurantById(activeSession.restaurant.id);
        if (freshRest) {
          activeSession.restaurant = freshRest;
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('resto_session', JSON.stringify(activeSession));
          }
        }
      } catch (err) {
        console.error("Error verifying active subscription", err);
      }

      const isValid = isRestaurantSubscriptionValid(activeSession.restaurant);
      
      if (!isValid && pathname !== '/admin/billing') {
        router.push('/admin/billing');
        return;
      }

      setSession(activeSession);
      setLoadingSession(false);
    }
    checkAuth();
  }, [pathname, router]);

  // Navigation Items
  const navItems = [
    {
      name: "Tableau de Bord",
      href: "/admin",
      icon: LayoutDashboard
    },
    {
      name: "Gestion du Menu",
      href: "/admin/menu",
      icon: UtensilsCrossed
    },
    {
      name: "Tables & QR Codes",
      href: "/admin/tables",
      icon: QrCode
    },
    {
      name: "Employés",
      href: "/admin/employees",
      icon: Users
    },
    {
      name: "Facturation",
      href: "/admin/billing",
      icon: CreditCard
    }
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  // Simulate subscription renewal
  const handleRenew = () => {
    setRenewing(true);
    setTimeout(() => {
      setRenewing(false);
      setRenewed(true);
      setSubExpDate('18 Août 2026');
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setTimeout(() => setRenewed(false), 3000);
    }, 1500);
  };

  const handleLogout = () => {
    setProfileModalOpen(false);
    logoutMVPUser();
    router.push('/login');
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b13] text-slate-100 font-sans">
        <ChefHat className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">Vérification de session...</span>
      </div>
    );
  }

  const restaurantName = session?.restaurant?.name || 'Restaurant';
  const userName = session?.user?.name || 'Gérant';
  const userEmail = session?.user?.email || '';

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden w-full bg-[#0a0f1d] border-b border-slate-900 px-6 py-4 flex justify-between items-center z-40 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <ChefHat size={16} />
          </div>
          <span className="font-black text-sm tracking-tight text-white uppercase">
            {restaurantName}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#0a0f1d] border-r border-slate-900/80 p-6 flex flex-col justify-between z-30 transition-transform duration-300 md:translate-x-0 md:static md:h-screen
        ${mobileOpen ? 'translate-x-0 pt-20' : '-translate-x-full'}
      `}>
        
        <div className="flex flex-col gap-8">
          {/* Logo Section */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <ChefHat size={20} />
            </div>
            <div className="min-w-0">
              <span className="font-black text-sm tracking-tight text-white uppercase block leading-none truncate">
                {restaurantName}
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 block">Administration</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all tap-feedback
                    ${active 
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 border border-amber-400' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                    }
                  `}
                >
                  <Icon size={18} className={active ? 'text-slate-950' : 'text-slate-400'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info & Exit */}
        <div className="flex flex-col gap-3 border-t border-slate-900/60 pt-4">
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center justify-between w-full p-2.5 rounded-2xl bg-slate-950 border border-slate-900 hover:border-slate-800 transition-all text-left cursor-pointer group hover:bg-slate-900/40"
            title="Mon Profil & Abonnement"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors shrink-0">
                <User size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-200 block truncate">{userName}</span>
                <span className="text-[9px] text-slate-500 block truncate font-mono">{restaurantName}</span>
              </div>
            </div>
            <div className="text-[8px] text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider scale-95 mr-1 shrink-0">
              Pro
            </div>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all border border-transparent w-full text-left cursor-pointer"
          >
            <LogOut size={14} />
            <span>Se Déconnecter</span>
          </button>
        </div>

      </aside>

      {/* Drawer Overlay (Mobile Only) */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 max-h-screen overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* Profile & Subscription Modal overlay */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-850 flex justify-between items-center bg-slate-950/20 backdrop-blur-md">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-500" />
                <span>Mon Espace Gérant</span>
              </h2>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-9 h-9 rounded-2xl bg-slate-850 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              
              {/* Profile Details */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Informations du Profil</span>
                <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">{userName}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">Rôle : Administrateur</span>
                    </div>
                  </div>
                  
                  <div className="h-px bg-slate-900 my-1"></div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Mail size={13} className="text-slate-500" />
                      <span>{userEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin size={13} className="text-slate-500" />
                      <span>{restaurantName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security: Update Password */}
              <div className="flex flex-col gap-3 animate-fade-in">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sécurité</span>
                <form onSubmit={handlePasswordUpdate} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Nouveau mot de passe</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-655" />
                      <input 
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-amber-500 text-xs transition-colors"
                        disabled={updatingPassword}
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <span className="text-[10px] text-red-400 font-semibold">{passwordError}</span>
                  )}
                  {passwordSuccess && (
                    <span className="text-[10px] text-emerald-400 font-semibold">Mot de passe mis à jour !</span>
                  )}

                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-750 disabled:bg-slate-900 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wide rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {updatingPassword ? (
                      <RefreshCw size={12} className="animate-spin text-slate-200" />
                    ) : (
                      <span>Enregistrer</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Subscription Card */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Détails de l'Abonnement</span>
                  
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span>Abonnement Actif</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-black text-white">Plan PRO Restaurant</h4>
                      <span className="text-[10px] text-slate-400 font-medium">Facturation mensuelle</span>
                    </div>
                    <span className="text-lg font-black text-amber-500 font-mono">
                      {formatFCFA(15000)}<span className="text-[10px] text-slate-500 font-medium">/mois</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Paiement :</span>
                      <span className="font-semibold text-slate-300 flex items-center gap-1 mt-0.5">
                        <CreditCard size={12} className="text-slate-400" />
                        <span>Mobile Money</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Prochain débit :</span>
                      <span className="font-semibold text-slate-350 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{subExpDate}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <button
                      onClick={handleRenew}
                      disabled={renewing}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 tap-feedback shadow-lg shadow-amber-500/5 cursor-pointer"
                    >
                      {renewing ? (
                        <>
                          <RefreshCw size={14} className="animate-spin text-slate-950" />
                          <span>Traitement Paiement...</span>
                        </>
                      ) : renewed ? (
                        <>
                          <CheckCircle size={14} className="text-slate-950" />
                          <span>Abonnement Renouvelé !</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Se réabonner (Simuler)</span>
                        </>
                      )}
                    </button>
                    {renewed && (
                      <span className="text-[9px] text-emerald-400 font-semibold block text-center mt-2 animate-pulse">
                        Succès : Votre abonnement a été prolongé d'un mois supplémentaire !
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout Button in Body for Mobile Convenience */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-3.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold text-xs uppercase tracking-wider tap-feedback cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={14} />
                  <span>Déconnexion</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
