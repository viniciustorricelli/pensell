import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Zap,
  Clock,
  Star,
  Shield,
  Flag,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function AdDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const adId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBoostDialog, setShowBoostDialog] = useState(false);
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

  // Fetch ad
  const { data: ad, isLoading: adLoading } = useQuery({
    queryKey: ['ad', adId],
    queryFn: async () => {
      const ads = await base44.entities.Ad.filter({ id: adId });
      return ads[0];
    },
    enabled: !!adId
  });

  // Increment views
  useEffect(() => {
    if (ad && user?.id !== ad.seller_id) {
      base44.entities.Ad.update(ad.id, {
        views_count: (ad.views_count || 0) + 1
      });
    }
  }, [ad?.id, user?.id]);

  // Fetch seller
  const { data: seller } = useQuery({
    queryKey: ['seller', ad?.seller_id],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: ad.seller_id });
      return users[0];
    },
    enabled: !!ad?.seller_id
  });

  // Fetch seller reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', ad?.seller_id],
    queryFn: () => base44.entities.Review.filter({ seller_id: ad.seller_id }),
    enabled: !!ad?.seller_id
  });

  // Check if favorited
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => base44.entities.Favorite.filter({ user_id: user.id }),
    enabled: !!user
  });

  const isFavorited = favorites.some(f => f.ad_id === adId);
  const isOwner = user?.id === ad?.seller_id;

  const handleFavorite = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    const existingFav = favorites.find(f => f.ad_id === adId);
    if (existingFav) {
      await base44.entities.Favorite.delete(existingFav.id);
      if (ad) {
        await base44.entities.Ad.update(ad.id, {
          saves_count: Math.max(0, (ad.saves_count || 0) - 1)
        });
      }
      toast.success('Removido dos favoritos');
    } else {
      await base44.entities.Favorite.create({
        user_id: user.id,
        ad_id: adId,
        ad_title: ad?.title,
        ad_image: ad?.images?.[0],
        ad_price: ad?.price
      });
      if (ad) {
        await base44.entities.Ad.update(ad.id, {
          saves_count: (ad.saves_count || 0) + 1
        });
      }
      toast.success('Adicionado aos favoritos');
    }
    queryClient.invalidateQueries(['favorites']);
    queryClient.invalidateQueries(['ad', adId]);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: ad?.title,
        text: ad?.description?.substring(0, 100),
        url
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    // Increment chat clicks
    if (ad) {
      await base44.entities.Ad.update(ad.id, {
        chat_clicks: (ad.chat_clicks || 0) + 1
      });
    }

    // Check for existing conversation
    const existingConvos = await base44.entities.Conversation.filter({
      ad_id: adId,
      buyer_id: user.id
    });

    if (existingConvos.length > 0) {
      window.location.href = createPageUrl(`Chat?id=${existingConvos[0].id}`);
      return;
    }

    // Create new conversation
    const convo = await base44.entities.Conversation.create({
      ad_id: adId,
      ad_title: ad.title,
      ad_image: ad.images?.[0],
      ad_price: ad.price,
      buyer_id: user.id,
      buyer_name: user.full_name,
      buyer_photo: user.profile_photo,
      seller_id: ad.seller_id,
      seller_name: ad.seller_name,
      seller_photo: ad.seller_photo,
      last_message: '',
      last_message_at: new Date().toISOString()
    });

    window.location.href = createPageUrl(`Chat?id=${convo.id}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getTimeRemaining = () => {
    if (!ad?.boost_expires_at) return null;
    const now = moment();
    const expires = moment(ad.boost_expires_at);
    const diff = expires.diff(now);
    
    if (diff <= 0) return null;
    
    const duration = moment.duration(diff);
    if (duration.days() > 0) {
      return `${duration.days()}d ${duration.hours()}h ${duration.minutes()}m`;
    }
    return `${duration.hours()}h ${duration.minutes()}m`;
  };

  if (adLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Anúncio não encontrado</h2>
        <p className="text-slate-500 mb-4">Este anúncio pode ter sido removido ou não existe.</p>
        <Link to={createPageUrl('Home')}>
          <Button>Voltar para Home</Button>
        </Link>
      </div>
    );
  }

  const images = ad.images || [];
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      {/* Image Gallery */}
      <div className="relative bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-square md:aspect-video relative overflow-hidden">
            {images.length > 0 ? (
              <img
                src={images[currentImageIndex]}
                alt={ad.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-200">
                <Eye className="w-20 h-20 text-slate-400" />
              </div>
            )}

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Dots */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Boost Badge */}
            {ad.is_boosted && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg px-3 py-1.5">
                  <Zap className="w-4 h-4 mr-1" />
                  Destaque
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Title and Price */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl font-bold text-slate-800">{ad.title}</h1>
                <div className="flex gap-2">
                  <button
                    onClick={handleFavorite}
                    className={`p-2 rounded-full transition-colors ${
                      isFavorited 
                        ? 'bg-red-100 text-red-500' 
                        : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-3xl font-bold text-indigo-600 mb-4">
                {formatPrice(ad.price)}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {ad.location_neighborhood && `${ad.location_neighborhood}, `}{ad.location_city}
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {ad.views_count || 0} visualizações
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4" />
                  {ad.saves_count || 0} salvos
                </div>
              </div>

              {/* Boost Timer */}
              {ad.is_boosted && getTimeRemaining() && (
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Destaque expira em: <strong>{getTimeRemaining()}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Descrição</h2>
              <p className="text-slate-600 whitespace-pre-wrap">{ad.description}</p>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Ações do Anúncio</h2>
                <div className="flex flex-wrap gap-3">
                  <Link to={createPageUrl(`EditAd?id=${ad.id}`)}>
                    <Button variant="outline">Editar Anúncio</Button>
                  </Link>
                  {!ad.is_boosted && (
                    <Link to={createPageUrl(`TopUp?id=${ad.id}`)}>
                      <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                        <Zap className="w-4 h-4 mr-2" />
                        Top Up ({user?.available_topups || 0})
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <Link 
                to={createPageUrl(`SellerProfile?id=${ad.seller_id}`)}
                className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
              >
                <Avatar className="w-14 h-14">
                  <AvatarImage src={seller?.profile_photo || ad.seller_photo} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg">
                    {(seller?.full_name || ad.seller_name)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">
                      {seller?.full_name || ad.seller_name}
                    </h3>
                    {seller?.is_verified && (
                      <Shield className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{averageRating.toFixed(1)}</span>
                      <span>({reviews.length} avaliações)</span>
                    </div>
                  )}
                </div>
              </Link>

              {!isOwner && (
                <Button 
                  onClick={handleStartChat}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Falar com vendedor
                </Button>
              )}

              <Separator className="my-4" />

              <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors">
                <Flag className="w-4 h-4" />
                Denunciar anúncio
              </button>
            </div>

            {/* Published Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Publicado {moment(ad.created_date).fromNow()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed CTA */}
      {!isOwner && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-indigo-600">
                {formatPrice(ad.price)}
              </p>
            </div>
            <Button 
              onClick={handleStartChat}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Conversar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}