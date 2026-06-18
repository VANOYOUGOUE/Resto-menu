'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTableByShortCode, getRestaurantBySlug } from '@/lib/db';
import { Loader2, AlertCircle } from 'lucide-react';

export default function QRRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const shortCode = params.short_code as string;

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function performRedirect() {
      if (!shortCode) return;

      try {
        // 1. Rechercher la table par short_code
        const table = await getTableByShortCode(shortCode);
        if (!table) {
          setError("Ce QR Code ne correspond à aucune table active.");
          return;
        }

        // 2. Récupérer le slug du restaurant
        // Le mock ou la base de données nous renvoie le restaurant_id
        // Si c'est le resto de démo, son slug est 'bistro-premium'
        let slug = 'bistro-premium';
        if (table.restaurant_id !== '22222222-2222-2222-2222-222222222222') {
          // Si Supabase est configuré, récupérer les informations réelles
          const resto = await getRestaurantBySlug(table.restaurant_id);
          if (resto) {
            slug = resto.slug;
          }
        }

        // 3. Rediriger vers le menu du restaurant avec l'ID de la table
        router.replace(`/r/${slug}?table=${table.id}`);
      } catch (err) {
        console.error('Redirection error:', err);
        setError("Une erreur est survenue lors de la redirection.");
      }
    }

    performRedirect();
  }, [shortCode, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md p-8 rounded-2xl glass-morphism text-center flex flex-col items-center gap-6 animate-slide-up">
        {/* Logo/Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg relative border border-amber-400">
            QR
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Oups ! QR Code invalide</h2>
              <p className="text-sm text-slate-400 mt-2">{error}</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="mt-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <div>
              <h2 className="text-xl font-medium text-slate-100">Connexion à votre table</h2>
              <p className="text-sm text-slate-400 mt-1">Chargement du menu interactif...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
