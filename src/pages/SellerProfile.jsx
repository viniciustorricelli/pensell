import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Package,
  Star,
  MapPin,
  Calendar,
  Loader2,
  Phone,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdCard from '@/components/ads/AdCard';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function SellerProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const sellerId = urlParams.get('id');
  
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (authenticated) {
          const userData = await base44.auth.me();
          setCurrentUser(userData);
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  // Fetch seller data
  const { data: seller, isLoading: sellerLoading } = useQuery({
    queryKey: ['seller', sellerId],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: sellerId });
      return users[0];
    },
    enabled: !!sellerId
  });

  // Fetch seller's ads
  const { data: sellerAds = [], isLoading: adsLoading } = useQuery({
    queryKey: ['seller-ads', sellerId],
    queryFn: () => base44.entities.Ad.filter({ 
      seller_id: sellerId,
      status: 'active'
    }, '-created_date'),
    enabled: !!sellerId
  });

  // Fetch seller's reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['seller-reviews', sellerId],
    queryFn: () => base44.entities.Review.filter({ seller_id: sellerId }, '-created_date'),
    enabled: !!sellerId
  });

  // Fetch current user's favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', currentUser?.id],
    queryFn: () => base44.entities.Favorite.filter({ user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const handleFavorite = async (ad) => {
    if (!currentUser) {
      base44.auth.redirectToLogin();
      return;
    }

    const existingFav = favorites.find(f => f.ad_id === ad.id);
    if (existingFav) {
      await base44.entities.Favorite.delete(existingFav.id);
    } else {
      await base44.entities.Favorite.create({
        user_id: currentUser.id,
        ad_id: ad.id,
        ad_title: ad.title,
        ad_image: ad.images?.[0],
        ad_price: ad.price
      });
    }
  };

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (sellerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Vendedor não encontrado</h2>
        <Link to={createPageUrl('Home')}>
          <Button>Voltar para Home</Button>
        </Link>
      </div>
    );
  }

  const soldAds = sellerAds.filter(ad => ad.status === 'sold').length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              {seller.profile_photo ? (
                <img
                  src={seller.profile_photo}
                  alt={seller.full_name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-4 border-blue-100">
                  <UserIcon className="w-12 h-12 md:w-16 md:h-16 text-blue-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                {seller.full_name || 'Usuário'}
              </h1>

              {/* Rating */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="text-lg font-semibold text-slate-800">{averageRating}</span>
                  </div>
                  <span className="text-slate-500">({reviews.length} avaliações)</span>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {seller.location_city && (
                  <div className="flex items-center gap-2 text-slate-600 justify-center md:justify-start">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{seller.location_city}</span>
                  </div>
                )}
                {seller.created_date && (
                  <div className="flex items-center gap-2 text-slate-600 justify-center md:justify-start">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Membro desde {moment(seller.created_date).format('MMM/YYYY')}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {seller.bio && (
                <p className="text-slate-600 mb-4">{seller.bio}</p>
              )}

              {/* Contact Buttons */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {seller.phone && (
                  <a href={`https://wa.me/55${seller.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Phone className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </a>
                )}
                {seller.email && (
                  <a href={`mailto:${seller.email}`}>
                    <Button size="sm" variant="outline">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{sellerAds.length}</p>
            <p className="text-sm text-slate-500">Anúncios Ativos</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{soldAds}</p>
            <p className="text-sm text-slate-500">Vendas</p>
          </div>
        </div>

        {/* Ads Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Anúncios do Vendedor</h2>
          {adsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : sellerAds.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum anúncio ativo no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {sellerAds.map((ad) => (
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

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Avaliações</h2>
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    {review.reviewer_photo ? (
                      <img
                        src={review.reviewer_photo}
                        alt={review.reviewer_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-800">{review.reviewer_name}</p>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-slate-600 text-sm">{review.comment}</p>
                      )}
                      {review.ad_title && (
                        <p className="text-slate-400 text-xs mt-2">Sobre: {review.ad_title}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}