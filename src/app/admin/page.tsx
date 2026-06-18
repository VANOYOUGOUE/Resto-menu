'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  ShoppingBag, 
  Receipt, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  ChefHat
} from 'lucide-react';
import { formatFCFA } from '@/lib/mvp-db';

// Mock data pour le graphique des 5 plats les plus vendus (en Franc CFA)
const TOP_DISHES_DATA = [
  { name: 'Filet de Bœuf Rossini', sales: 24, revenue: 528000 },
  { name: 'Risotto aux Cèpes', sales: 18, revenue: 270000 },
  { name: 'Foie Gras Maison', sales: 15, revenue: 180000 },
  { name: 'Cocktail Bistro Tonic', sales: 12, revenue: 84000 },
  { name: 'Mi-Cuit Chocolat', sales: 10, revenue: 60000 }
];

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // KPIs
  const kpis = [
    {
      title: "Revenus du Jour",
      value: formatFCFA(450000),
      trend: "+15% vs hier",
      isPositive: true,
      icon: TrendingUp,
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    },
    {
      title: "Commandes du Jour",
      value: "32",
      trend: "+8% vs hier",
      isPositive: true,
      icon: ShoppingBag,
      colorClass: "text-blue-400 bg-blue-400/10 border-blue-400/20"
    },
    {
      title: "Ticket Moyen",
      value: formatFCFA(14062),
      trend: "+5% vs hier",
      isPositive: true,
      icon: Receipt,
      colorClass: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20"
    },
    {
      title: "Temps Moyen Préparation",
      value: "18 min",
      trend: "-2 min vs hier",
      isPositive: true, // Négatif en temps de prep est positif pour l'UX
      icon: Clock,
      colorClass: "text-orange-400 bg-orange-400/10 border-orange-400/20"
    }
  ];

  // Custom Tooltip pour Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 rounded-xl bg-[#0d1324] border border-slate-800 shadow-2xl backdrop-blur-md">
          <p className="text-xs font-bold text-slate-400">{payload[0].name}</p>
          <p className="text-sm font-black text-amber-500 mt-1">{payload[0].value} ventes</p>
          <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Revenus : {formatFCFA(payload[0].payload.revenue)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={10} />
            <span>Synthèse Analytique</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">Tableau de Bord</h1>
          <p className="text-slate-400 text-xs mt-1">Données d'activité pour aujourd'hui</p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Date</span>
          <span className="text-sm font-bold text-slate-300 font-mono">18 Juin 2026</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/30 border border-slate-900 flex flex-col justify-between gap-4 glass-morphism shadow-sm"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-bold tracking-wide">{kpi.title}</span>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${kpi.colorClass}`}>
                  <Icon size={18} />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white tracking-tight mt-1">{kpi.value}</h3>
                <div className="flex items-center gap-1 mt-2">
                  <span className={`text-[10px] font-extrabold flex items-center px-2 py-0.5 rounded-full ${
                    kpi.isPositive 
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' 
                      : 'bg-red-950/40 text-red-400 border border-red-500/10'
                  }`}>
                    {kpi.isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart and Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Bar Chart Panel */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/30 border border-slate-900 glass-morphism flex flex-col gap-6 shadow-sm">
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Top 5 des Plats les plus vendus</h2>
            <p className="text-xs text-slate-400 mt-1">Classement par volume de commandes cumulé</p>
          </div>

          <div className="h-80 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={TOP_DISHES_DATA}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#D97706" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => value.split(' ').slice(0, 2).join(' ')}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                    {TOP_DISHES_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-900/40 animate-pulse rounded-xl" />
            )}
          </div>
        </div>

        {/* Sales Table Panel */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/30 border border-slate-900 glass-morphism flex flex-col gap-6 shadow-sm">
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Performance Ventes</h2>
            <p className="text-xs text-slate-400 mt-1">Détails financiers du top 5</p>
          </div>

          <div className="flex flex-col gap-4 flex-grow justify-between">
            <div className="flex flex-col gap-3.5">
              {TOP_DISHES_DATA.map((dish, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center pb-3 border-b border-slate-900 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">{dish.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{dish.sales} ventes</span>
                  </div>
                  <span className="text-xs font-black text-amber-500 shrink-0 font-mono">
                    {formatFCFA(dish.revenue)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
              <ChefHat className="text-amber-500 shrink-0" size={18} />
              <span className="text-[10px] text-slate-400 leading-normal">
                Les spécialités à base de <strong>viande de bœuf</strong> tirent actuellement le ticket moyen vers le haut.
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
