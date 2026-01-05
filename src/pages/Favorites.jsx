import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import { toast } from 'sonner';

export default function Favorites() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (!authenticated) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    checkAuth();
  }, []);

  // Fetch favorites
  const { data: favorites = [], isLoading: favsLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => base44.entities.Favorite.filter({ user_id: user.id }),
    enabled: !!user
  });

  // Fetch full ad details for favorites
  const { data: favoriteAds = [], isLoading: adsLoading } = useQuery({
    queryKey: ['favorite-ads', favorites.map(f => f.ad_id).join(',')],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      const allAds = await base44.entities.Ad.filter({ status: 'active' });
      return favorites
        .map(fav => allAds.find(ad => ad.id === fav.ad_id))
        .filter(Boolean);
    },
    enabled: favorites.length > 0
  });

  const handleRemoveFavorite = async (ad) => {
    const fav = favorites.find(f => f.ad_id === ad.id);
    if (fav) {
      await base44.entities.Favorite.delete(fav.id);
      toast.success('Removido dos favoritos');
      queryClient.invalidateQueries(['favorites']);
    }
  };

  const isLoading = !user || favsLoading || adsLoading;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Meus Favoritos</h1>
          <p className="text-slate-500 mt-1">
            {favoriteAds.length} {favoriteAds.length === 1 ? 'anúncio salvo' : 'anúncios salvos'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : favoriteAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              Nenhum favorito ainda
            </h3>
            <p className="text-slate-500 max-w-sm">
              Encontre anúncios interessantes e clique no coração para salvá-los aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favoriteAds.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                onFavorite={handleRemoveFavorite}
                isFavorited={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}