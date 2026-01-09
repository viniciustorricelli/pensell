import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function BoostedAdsCarousel({ ads, onFavorite, favorites = [], currentUserId }) {
   const scrollRef = useRef(null);
   const [timers, setTimers] = useState({});

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const updateTimers = () => {
      const newTimers = {};
      ads.forEach(ad => {
        if (ad.boost_expires_at) {
          const now = moment();
          const expires = moment(ad.boost_expires_at);
          const diff = expires.diff(now);
          
          if (diff > 0) {
            const duration = moment.duration(diff);
            if (duration.days() > 0) {
              newTimers[ad.id] = `${duration.days()}d ${duration.hours()}h`;
            } else {
              newTimers[ad.id] = `${duration.hours()}h ${duration.minutes()}m`;
            }
          }
        }
      });
      setTimers(newTimers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 60000);
    return () => clearInterval(interval);
  }, [ads]);

  if (!ads || ads.length === 0) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Destaques</h2>
            <p className="text-xs text-slate-500">Anúncios impulsionados</p>
          </div>
        </div>
        
        <div className="hidden md:flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-9 w-9"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-9 w-9"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-0 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {ads.map((ad) => (
          <Link 
            key={ad.id}
            to={createPageUrl(`AdDetails?id=${ad.id}`)}
            className="flex-shrink-0 w-72 snap-start"
          >
            <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full">
              <div className="relative aspect-square">
                {ad.images?.[0] ? (
                  <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100" />
                )}
                <div className="absolute top-3 left-3">
                  <div className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Destaque
                  </div>
                </div>
                {timers[ad.id] && ad.seller_id === currentUserId && (
                   <div className="absolute bottom-3 left-3 right-3">
                     <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                       <Clock className="w-3 h-3" />
                       Expira em {timers[ad.id]}
                     </div>
                   </div>
                 )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 truncate mb-1">{ad.title}</h3>
                <p className="text-lg font-bold text-indigo-600">{formatPrice(ad.price)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}