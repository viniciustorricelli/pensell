import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  ArrowLeft,
  Loader2,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function TopUp() {
  const urlParams = new URLSearchParams(window.location.search);
  const adId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (!authenticated) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        let userData = await base44.auth.me();
        
        // Auto-reset topups if 24h have passed
        if (userData.last_topup_reset) {
          const lastReset = moment(userData.last_topup_reset);
          const now = moment();
          const hoursSinceReset = now.diff(lastReset, 'hours');
          
          if (hoursSinceReset >= 24 && userData.available_topups === 0) {
            await base44.auth.updateMe({
              available_topups: 1,
              last_topup_reset: now.toISOString()
            });
            userData = await base44.auth.me();
            toast.success('Seu Top Up foi renovado!');
          }
        }
        
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
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

  // Initialize topups for new users
  const availableTopups = user?.available_topups ?? 1;
  const canUseTopup = availableTopups > 0 && (!ad?.is_boosted || (ad.is_boosted && moment(ad.boost_expires_at).isBefore(moment())));

  const getTimeUntilNextTopup = () => {
    if (!user?.last_topup_reset) return null;
    const lastReset = moment(user.last_topup_reset);
    const nextReset = lastReset.clone().add(1, 'day');
    const now = moment();
    
    if (now.isAfter(nextReset)) return 'Disponível agora';
    
    const duration = moment.duration(nextReset.diff(now));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Update timer every second
  useEffect(() => {
    if (!user || canUseTopup) return;
    
    const updateTimer = () => {
      setTimeRemaining(getTimeUntilNextTopup());
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [user, canUseTopup]);

  const handleActivateTopUp = async () => {
    if (ad?.is_boosted && moment(ad.boost_expires_at).isAfter(moment())) {
      toast.error('Este anúncio já está em destaque!');
      return;
    }

    if (!canUseTopup) {
      toast.error('Você não tem top ups disponíveis. Aguarde 24 horas!');
      return;
    }

    setIsActivating(true);
    try {
      const now = moment();
      
      // Update ad to be boosted and active
      await base44.entities.Ad.update(ad.id, {
        is_boosted: true,
        boost_expires_at: now.clone().add(24, 'hours').toISOString(),
        boost_package: '24h',
        status: 'active'
      });

      // Decrease user's available topups and set the timer
      await base44.auth.updateMe({
        available_topups: 0,
        last_topup_reset: now.toISOString()
      });

      toast.success('Top Up ativado! Seu anúncio está visível e em destaque por 24h');
      queryClient.invalidateQueries(['ad', adId]);
      
      setTimeout(() => {
        window.location.href = createPageUrl(`AdDetails?id=${ad.id}`);
      }, 1500);
    } catch (error) {
      toast.error('Erro ao ativar Top Up');
    } finally {
      setIsActivating(false);
    }
  };

  if (!user || adLoading) {
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
        <Link to={createPageUrl('MyAds')}>
          <Button>Voltar para Meus Anúncios</Button>
        </Link>
      </div>
    );
  }

  if (ad.seller_id !== user.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Acesso negado</h2>
        <p className="text-slate-500 mb-4">Você não pode impulsionar este anúncio.</p>
        <Link to={createPageUrl('Home')}>
          <Button>Voltar para Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <Link to={createPageUrl(`AdDetails?id=${ad.id}`)} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        {/* Top Up Info Card */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white mb-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Top Up</h1>
              <p className="text-indigo-100">Destaque seu anúncio</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm mb-1">Top Ups Disponíveis</p>
                <p className="text-4xl font-bold">{availableTopups}</p>
              </div>
              <Zap className="w-16 h-16 opacity-20" />
            </div>
          </div>

          {!canUseTopup && (
            <div className="mt-4 bg-amber-500/20 backdrop-blur-sm rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-medium">Próximo Top Up em:</p>
                <p className="text-lg font-mono text-indigo-100">{timeRemaining}</p>
              </div>
            </div>
          )}
        </div>

        {/* Ad Preview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">Anúncio a ser destacado:</h2>
          <div className="flex gap-4">
            {ad.images?.[0] && (
              <img 
                src={ad.images[0]} 
                alt="" 
                className="w-24 h-24 rounded-xl object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium text-slate-800">{ad.title}</h3>
              <p className="text-lg font-bold text-indigo-600 mt-1">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(ad.price)}
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">O que você ganha:</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-green-100 rounded-full mt-0.5">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Destaque por 24 horas</p>
                <p className="text-sm text-slate-500">Seu anúncio aparece em destaque no feed</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1 bg-green-100 rounded-full mt-0.5">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Mais visualizações</p>
                <p className="text-sm text-slate-500">Alcance muito maior para seu produto</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1 bg-green-100 rounded-full mt-0.5">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Badge especial</p>
                <p className="text-sm text-slate-500">Seu anúncio recebe um selo de destaque</p>
              </div>
            </div>
          </div>
        </div>

        {/* Warning if no topups */}
        {!canUseTopup && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Você não tem Top Ups disponíveis no momento. Cada usuário recebe 1 Top Up gratuito por dia. 
              Seu próximo Top Up estará disponível em: <strong className="font-mono">{timeRemaining}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleActivateTopUp}
            disabled={!canUseTopup || isActivating}
            className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg font-semibold rounded-xl disabled:opacity-50"
          >
            {isActivating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Ativando Top Up...
              </>
            ) : !canUseTopup ? (
              <>
                <Clock className="w-5 h-5 mr-2" />
                Próximo em {timeRemaining}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Ativar Top Up Grátis (24h)
              </>
            )}
          </Button>

          {!canUseTopup && (
            <Button
              variant="outline"
              className="w-full h-14 text-lg font-semibold rounded-xl border-2"
              disabled
            >
              Comprar Mais Top Ups (Em breve)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}