import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search as SearchIcon, 
  SlidersHorizontal, 
  X, 
  MapPin,
  Loader2,
  Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import AdCard from '@/components/ads/AdCard';
import { toast } from 'sonner';

const categories = [
  { id: 'eletronicos', label: 'Eletrônicos' },
  { id: 'moveis', label: 'Móveis' },
  { id: 'veiculos', label: 'Veículos' },
  { id: 'imoveis', label: 'Imóveis' },
  { id: 'moda', label: 'Moda' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'esportes', label: 'Esportes' },
  { id: 'casa_jardim', label: 'Casa e Jardim' },
  { id: 'animais', label: 'Animais' },
  { id: 'empregos', label: 'Empregos' },
  { id: 'outros', label: 'Outros' },
];

const timeOptions = [
  { value: 'all', label: 'Qualquer período' },
  { value: '24h', label: 'Últimas 24 horas' },
  { value: '3d', label: 'Últimos 3 dias' },
  { value: '7d', label: 'Últimos 7 dias' },
];

const sortOptions = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'views', label: 'Mais visualizados' },
];

export default function Search() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    priceRange: [0, 50000],
    timeFilter: 'all',
    onlyBoosted: false,
    sortBy: 'recent'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch ads
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['search-ads', debouncedQuery, filters],
    queryFn: async () => {
      let allAds = await base44.entities.Ad.filter({ status: 'active' });
      
      // Apply filters
      let filtered = allAds;
      
      // Text search
      if (debouncedQuery) {
        const query = debouncedQuery.toLowerCase();
        filtered = filtered.filter(ad => 
          ad.title?.toLowerCase().includes(query) ||
          ad.description?.toLowerCase().includes(query)
        );
      }
      
      // Category filter
      if (filters.category) {
        filtered = filtered.filter(ad => ad.category === filters.category);
      }
      
      // Location filter
      if (filters.location) {
        const loc = filters.location.toLowerCase();
        filtered = filtered.filter(ad => 
          ad.location_city?.toLowerCase().includes(loc) ||
          ad.location_neighborhood?.toLowerCase().includes(loc)
        );
      }
      
      // Price filter
      filtered = filtered.filter(ad => 
        ad.price >= filters.priceRange[0] && ad.price <= filters.priceRange[1]
      );
      
      // Time filter
      if (filters.timeFilter !== 'all') {
        const now = new Date();
        let cutoff;
        switch (filters.timeFilter) {
          case '24h':
            cutoff = new Date(now - 24 * 60 * 60 * 1000);
            break;
          case '3d':
            cutoff = new Date(now - 3 * 24 * 60 * 60 * 1000);
            break;
          case '7d':
            cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
            break;
        }
        if (cutoff) {
          filtered = filtered.filter(ad => new Date(ad.created_date) >= cutoff);
        }
      }
      
      // Boosted only
      if (filters.onlyBoosted) {
        filtered = filtered.filter(ad => ad.is_boosted);
      }
      
      // Sorting
      switch (filters.sortBy) {
        case 'price_asc':
          filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'price_desc':
          filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        case 'views':
          filtered.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
          break;
        default:
          filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      }
      
      return filtered;
    }
  });

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

  const clearFilters = () => {
    setFilters({
      category: '',
      location: '',
      priceRange: [0, 50000],
      timeFilter: 'all',
      onlyBoosted: false,
      sortBy: 'recent'
    });
    setSearchQuery('');
  };

  const activeFiltersCount = [
    filters.category,
    filters.location,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 50000,
    filters.timeFilter !== 'all',
    filters.onlyBoosted
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 sticky top-14 md:top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos ou serviços..."
                className="pl-12 h-12 rounded-full bg-slate-100 border-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
            
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 px-4 rounded-full relative">
                  <SlidersHorizontal className="w-5 h-5" />
                  <span className="hidden md:inline ml-2">Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtros de Busca</SheetTitle>
                </SheetHeader>
                
                <div className="py-6 space-y-6">
                  {/* Category */}
                  <div>
                    <Label className="text-sm font-medium">Categoria</Label>
                    <Select 
                      value={filters.category} 
                      onValueChange={(v) => setFilters({...filters, category: v})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Todas as categorias</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location */}
                  <div>
                    <Label className="text-sm font-medium">Localização</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={filters.location}
                        onChange={(e) => setFilters({...filters, location: e.target.value})}
                        placeholder="Cidade ou bairro"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="text-sm font-medium">Faixa de Preço</Label>
                    <div className="mt-4 px-2">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(v) => setFilters({...filters, priceRange: v})}
                        max={50000}
                        step={100}
                        className="w-full"
                      />
                      <div className="flex justify-between mt-2 text-sm text-slate-600">
                        <span>R$ {filters.priceRange[0].toLocaleString('pt-BR')}</span>
                        <span>R$ {filters.priceRange[1].toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Time Filter */}
                  <div>
                    <Label className="text-sm font-medium">Período</Label>
                    <Select 
                      value={filters.timeFilter} 
                      onValueChange={(v) => setFilters({...filters, timeFilter: v})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort */}
                  <div>
                    <Label className="text-sm font-medium">Ordenar por</Label>
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(v) => setFilters({...filters, sortBy: v})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Boosted Only */}
                  <div className="flex items-center justify-between py-3 border-t border-b">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <Label className="text-sm font-medium">Apenas destaques</Label>
                    </div>
                    <Switch
                      checked={filters.onlyBoosted}
                      onCheckedChange={(v) => setFilters({...filters, onlyBoosted: v})}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={clearFilters} className="flex-1">
                      Limpar
                    </Button>
                    <Button onClick={() => setIsFilterOpen(false)} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                      Aplicar
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-600">
            {isLoading ? 'Buscando...' : `${ads.length} anúncios encontrados`}
          </p>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-indigo-600">
              Limpar filtros
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20">
            <SearchIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-slate-500">
              Tente ajustar os filtros ou buscar por outro termo
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ads.map((ad) => (
              <AdCard 
                key={ad.id}
                ad={ad}
                onFavorite={handleFavorite}
                isFavorited={favorites.some(f => f.ad_id === ad.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}