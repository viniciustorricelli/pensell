import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Search, MapPin } from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import BoostedAdsCarousel from '@/components/ads/BoostedAdsCarousel';
import CategoryFilterCollapsible from '@/components/ads/CategoryFilterCollapsible';
import CommunitySelector from '@/components/CommunitySelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import moment from 'moment';

export default function Home() {
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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
    queryKey: ['boosted-ads', user?.current_community_id],
    queryFn: async () => {
      const filter = {
        is_boosted: true,
        status: 'active'
      };
      if (user?.current_community_id) {
        filter.community_id = user.current_community_id;
      }
      const ads = await base44.entities.Ad.filter(filter, '-created_date');
      // Filter out expired boosts
      return ads.filter(ad => 
        ad.boost_expires_at && moment(ad.boost_expires_at).isAfter(moment())
      );
    },
    enabled: !!user?.current_community_id,
    refetchInterval: 30000
  });

  // Fetch regular ads with pagination
  const { data: regularAds = [], isLoading, isFetching } = useQuery({
    queryKey: ['ads', selectedCategory, page, user?.current_community_id, searchQuery],
    queryFn: async () => {
      const filter = { status: 'active' };
      if (selectedCategory) {
        filter.category = selectedCategory;
      }
      if (user?.current_community_id) {
        filter.community_id = user.current_community_id;
      }
      
      // Fetch more ads than needed to handle pagination
      let allAds = await base44.entities.Ad.filter(filter, '-created_date', 100);
      
      // Filter by search query if provided
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allAds = allAds.filter(ad => 
          ad.title.toLowerCase().includes(query) || 
          ad.description.toLowerCase().includes(query)
        );
      }
      
      const skip = (page - 1) * 10;
      return allAds.slice(skip, skip + 10);
    },
    enabled: !!user?.current_community_id
  });

  // Update allAds when regularAds changes
  useEffect(() => {
    setAllAds(regularAds);
    // Check if there are more ads by seeing if we got a full page
    setHasMore(regularAds.length === 10);
  }, [regularAds, page]);

  // Reset when category or search changes
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery]);

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

  const handleCommunityChange = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Community Selector & Category Filter */}
        {user && user.current_community_id && (
          <div className="pt-4 pb-4 px-4 bg-slate-50 sticky top-14 md:top-16 z-30 border-b border-slate-100">
            <div className="flex justify-center items-center gap-3">
              <CommunitySelector user={user} onCommunityChange={handleCommunityChange} />
              <CategoryFilterCollapsible 
                selected={selectedCategory} 
                onChange={setSelectedCategory} 
              />
            </div>
          </div>
        )}

        {!user ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !user.current_community_id ? (
          <div className="text-center py-20 px-4">
            <p className="text-slate-500 mb-4">Selecione uma comunidade para ver os anúncios</p>
            <Button onClick={() => window.location.href = '/SelectCommunity'} className="bg-blue-600 hover:bg-blue-700">
              Selecionar Comunidade
            </Button>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="px-4 pt-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar anúncios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 bg-white rounded-xl"
                />
              </div>
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
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
          </>
        )}
      </div>
    </div>
  );
}