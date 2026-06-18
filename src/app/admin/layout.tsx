'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  QrCode, 
  Menu, 
  X, 
  ChefHat, 
  LogOut,
  User
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    }
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden w-full bg-[#0a0f1d] border-b border-slate-900 px-6 py-4 flex justify-between items-center z-40 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <ChefHat size={16} />
          </div>
          <span className="font-black text-sm tracking-tight text-white uppercase">
            Resto Admin
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
          {/* Logo Section (hidden on mobile drawer top because of header bar) */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <ChefHat size={20} />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white uppercase block leading-none">
                Resto Admin
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 block">Panel Gérant</span>
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
        <div className="flex flex-col gap-4 border-t border-slate-900 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <User size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-200 block truncate">Gérant Bistro</span>
              <span className="text-[9px] text-slate-500 block truncate font-mono">Abidjan, CI</span>
            </div>
          </div>
          
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all border border-transparent"
          >
            <LogOut size={14} />
            <span>Quitter</span>
          </Link>
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
