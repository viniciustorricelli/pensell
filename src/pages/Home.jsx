import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import BoostedAdsCarousel from '@/components/ads/BoostedAdsCarousel';
import CategoryFilter from '@/components/ads/CategoryFilter';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import moment from 'moment';

export default function Home() {
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [page, setPage] = useState(1);
  const [allAds, setAllAds] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (authenticated) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  // Fetch boosted ads
  const { data: boostedAds = [] } = useQuery({
    queryKey: ['boosted-ads'],
    queryFn: async () => {
      const ads = await base44.entities.Ad.filter({
        is_boosted: true,
        status: 'active'
      }, '-created_date');
      // Filter out expired boosts
      return ads.filter(ad => 
        ad.boost_expires_at && moment(ad.boost_expires_at).isAfter(moment())
      );
    },
    refetchInterval: 30000
  });

  // Fetch regular ads with pagination
  const { data: regularAds = [], isLoading, isFetching } = useQuery({
    queryKey: ['ads', selectedCategory, page],
    queryFn: async () => {
      const filter = { status: 'active' };
      if (selectedCategory) {
        filter.category = selectedCategory;
      }
      const skip = (page - 1) * 10;
      const ads = await base44.entities.Ad.filter(filter, '-created_date', 10);
      // Manual skip since SDK doesn't support it directly
      return ads.slice(skip, skip + 10);
    },
    enabled: true
  });

  // Update allAds when regularAds changes
  useEffect(() => {
    setAllAds(regularAds);
    setHasMore(regularAds.length >= 10);
  }, [regularAds]);

  // Reset when category changes
  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  // Fetch favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => base44.entities.Favorite.filter({ user_id: user.id }),
    enabled: !!user
  });

  const handleFavorite = async (ad) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    const existingFav = favorites.find(f => f.ad_id === ad.id);
    if (existingFav) {
      await base44.entities.Favorite.delete(existingFav.id);
      toast.success('Removido dos favoritos');
    } else {
      await base44.entities.Favorite.create({
        user_id: user.id,
        ad_id: ad.id,
        ad_title: ad.title,
        ad_image: ad.images?.[0],
        ad_price: ad.price
      });
      toast.success('Adicionado aos favoritos');
    }
    queryClient.invalidateQueries(['favorites']);
  };



  const handleRefresh = () => {
    queryClient.invalidateQueries(['ads']);
    queryClient.invalidateQueries(['boosted-ads']);
    toast.success('Anúncios atualizados');
  };

  const handleNextPage = () => {
    if (hasMore && !isFetching) {
      setPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">
            Encontre o que precisa
          </h1>
          <p className="text-indigo-100 text-sm md:text-base">
            Produtos e serviços perto de você
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Category Filter */}
        <div className="py-4 bg-slate-50 sticky top-14 md:top-16 z-30 border-b border-slate-100">
          <CategoryFilter 
            selected={selectedCategory} 
            onChange={setSelectedCategory} 
          />
        </div>

        {/* Boosted Ads Carousel */}
        {boostedAds.length > 0 && !selectedCategory && (
          <div className="py-6">
            <BoostedAdsCarousel 
              ads={boostedAds} 
              onFavorite={handleFavorite}
              favorites={favorites}
            />
          </div>
        )}

        {/* Main Feed */}
        <div className="px-4 md:px-0 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              {selectedCategory ? 'Resultados' : 'Anúncios Recentes'}
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRefresh}
              className="text-slate-500"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </Button>
          </div>

          {isLoading && page === 1 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : allAds.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500">Nenhum anúncio encontrado</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allAds.map((ad) => (
                  <AdCard 
                    key={ad.id}
                    ad={ad}
                    onFavorite={handleFavorite}
                    isFavorited={favorites.some(f => f.ad_id === ad.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <span className="text-sm text-slate-600">
                  Página {page}
                </span>
                
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!hasMore || isFetching}
                  className="gap-2"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}