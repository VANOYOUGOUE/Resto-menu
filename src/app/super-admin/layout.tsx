'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  ChefHat, 
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import { getCurrentSession, logoutMVPUser } from '@/lib/mvp-db';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [session, setSession] = useState<{ user: any; restaurant: any } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const activeSession = getCurrentSession();
    if (!activeSession || activeSession.user.role !== 'super_admin') {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else {
      setSession(activeSession);
      setLoadingSession(false);
    }
  }, [pathname, router]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/super-admin",
      icon: LayoutDashboard
    },
    {
      name: "Restaurants",
      href: "/super-admin/restaurants",
      icon: Building2
    }
  ];

  const isActive = (href: string) => {
    if (href === '/super-admin') {
      return pathname === '/super-admin';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logoutMVPUser();
    router.push('/login');
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b13] text-slate-100 font-sans">
        <ChefHat className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-widest text-center">Vérification Super-Admin...</span>
      </div>
    );
  }

  const userName = session?.user?.name || 'Super Admin';

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header Bar */}
      <div className="md:hidden w-full bg-[#0a0f1d] border-b border-slate-900 px-6 py-4 flex justify-between items-center z-40 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <ChefHat size={16} />
          </div>
          <span className="font-black text-sm tracking-tight text-white uppercase">
            Resto-menu SuperAdmin
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
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
                Resto-menu
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 block">Super-Administration</span>
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
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950 border border-slate-900 text-left">
            <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
              <User size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-200 block truncate">{userName}</span>
              <span className="text-[8px] text-amber-500 font-black block uppercase tracking-wider">Super Admin</span>
            </div>
          </div>
          
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
    </div>
  );
}
