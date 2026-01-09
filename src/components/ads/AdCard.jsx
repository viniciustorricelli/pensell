import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Eye, Zap, Clock, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import moment from 'moment';

export default function AdCard({ ad, onFavorite, isFavorited, showBoostTimer = true }) {
  const isExpiringSoon = ad.is_boosted && ad.boost_expires_at && 
    moment(ad.boost_expires_at).diff(moment(), 'hours') < 6;

  const getTimeRemaining = () => {
    if (!ad.boost_expires_at) return null;
    const now = moment();
    const expires = moment(ad.boost_expires_at);
    const diff = expires.diff(now);
    
    if (diff <= 0) return null;
    
    const duration = moment.duration(diff);
    if (duration.days() > 0) {
      return `${duration.days()}d ${duration.hours()}h`;
    }
    return `${duration.hours()}h ${duration.minutes()}m`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Link 
      to={createPageUrl(`AdDetails?id=${ad.id}`)} 
      className="group block"
    >
      <div className={cn(
        "bg-white rounded-2xl overflow-hidden transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        "border",
        ad.is_boosted && ad.boost_expires_at && moment(ad.boost_expires_at).isAfter(moment()) ? "border-amber-200 bg-amber-50/30" : "border-slate-100"
      )}>
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {ad.images?.[0] ? (
            <img 
              src={ad.images[0]} 
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Eye className="w-12 h-12" />
            </div>
          )}
          
          {/* Boost Badge */}
          {ad.is_boosted && ad.boost_expires_at && moment(ad.boost_expires_at).isAfter(moment()) && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1">
                <Zap className="w-4 h-4" />
              </Badge>
            </div>
          )}

          {/* Favorite Button */}
          {onFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavorite(ad);
              }}
              className={cn(
                "absolute top-3 right-3 p-2 rounded-full transition-all duration-200",
                "backdrop-blur-sm",
                isFavorited 
                  ? "bg-red-500 text-white" 
                  : "bg-white/80 text-slate-600 hover:bg-white hover:text-red-500"
              )}
            >
              <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
            </button>
          )}

          {/* Boost Timer */}
          {showBoostTimer && ad.is_boosted && ad.boost_expires_at && moment(ad.boost_expires_at).isAfter(moment()) && getTimeRemaining() && (
            <div className={cn(
              "absolute bottom-3 left-3 right-3",
              "bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5",
              "flex items-center justify-between",
              isExpiringSoon && "bg-red-500/80"
            )}>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-medium">
                  {isExpiringSoon ? 'Expirando!' : 'Restam'}
                </span>
              </div>
              <span className="text-white text-xs font-bold">
                {getTimeRemaining()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
            {ad.title}
          </h3>
          
          <p className="text-slate-500 text-sm mt-1 line-clamp-2 h-10">
            {ad.description}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xl font-bold text-indigo-600">
              {formatPrice(ad.price)}
            </span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Eye className="w-4 h-4" />
              <span className="text-xs">{ad.views_count || 0}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-slate-500">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs truncate">
              {ad.location_neighborhood ? `${ad.location_neighborhood}, ` : ''}{ad.location_city}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}