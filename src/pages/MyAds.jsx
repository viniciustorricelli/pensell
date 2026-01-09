import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Package,
  Eye,
  MessageCircle,
  Zap,
  MoreVertical,
  Edit2,
  Trash2,
  Pause,
  Play,
  Loader2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function MyAds() {
  const [user, setUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, ad: null });
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

  const { data: myAds = [], isLoading } = useQuery({
    queryKey: ['my-ads', user?.id],
    queryFn: () => base44.entities.Ad.filter({ seller_id: user.id }, '-created_date'),
    enabled: !!user
  });

  const updateAdMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Ad.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-ads']);
      toast.success('Anúncio atualizado');
    }
  });

  const deleteAdMutation = useMutation({
    mutationFn: (id) => base44.entities.Ad.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-ads']);
      toast.success('Anúncio excluído');
      setDeleteDialog({ open: false, ad: null });
    }
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const now = moment();
    const expires = moment(expiresAt);
    const diff = expires.diff(now);
    
    if (diff <= 0) return null;
    
    const duration = moment.duration(diff);
    if (duration.days() > 0) {
      return `${duration.days()}d ${duration.hours()}h`;
    }
    return `${duration.hours()}h ${duration.minutes()}m`;
  };

  const activeAds = myAds.filter(ad => ad.status === 'active');
  const pausedAds = myAds.filter(ad => ad.status === 'paused');
  const soldAds = myAds.filter(ad => ad.status === 'sold');
  const pendingAds = myAds.filter(ad => ad.status === 'pending_activation');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const AdItem = ({ ad }) => (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex gap-4">
        {/* Image */}
        <Link to={createPageUrl(`AdDetails?id=${ad.id}`)}>
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
            {ad.images?.[0] ? (
              <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-300" />
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Link to={createPageUrl(`AdDetails?id=${ad.id}`)}>
                <h3 className="font-semibold text-slate-800 truncate hover:text-indigo-600 transition-colors">
                  {ad.title}
                </h3>
              </Link>
              {ad.status === 'pending_activation' && (
                <Badge className="bg-orange-100 text-orange-700 mt-1">
                  Aguardando ativação
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl(`EditAd?id=${ad.id}`)} className="flex items-center">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                {ad.status === 'active' ? (
                  <DropdownMenuItem 
                    onClick={() => updateAdMutation.mutate({ id: ad.id, data: { status: 'paused' }})}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </DropdownMenuItem>
                ) : ad.status === 'paused' && (
                  <DropdownMenuItem 
                    onClick={() => updateAdMutation.mutate({ id: ad.id, data: { status: 'active' }})}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Ativar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => setDeleteDialog({ open: true, ad })}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-lg font-bold text-indigo-600 mt-1">
            {formatPrice(ad.price)}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {ad.views_count || 0}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {ad.chat_clicks || 0}
            </div>
          </div>

          {/* Boost Status */}
          {ad.is_boosted && getTimeRemaining(ad.boost_expires_at) && (
            <div className="mt-2">
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                <Zap className="w-3 h-3 mr-1" />
                Destaque • {getTimeRemaining(ad.boost_expires_at)}
              </Badge>
            </div>
          )}

          {ad.status === 'pending_activation' && (
            <Link to={createPageUrl(`TopUp?id=${ad.id}`)}>
              <Button 
                size="sm" 
                className="mt-2 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Zap className="w-3.5 h-3.5 mr-1" />
                Ativar Anúncio
              </Button>
            </Link>
          )}
          {!ad.is_boosted && ad.status === 'active' && (
            <Link to={createPageUrl(`TopUp?id=${ad.id}`)}>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 text-indigo-600 border-indigo-300 hover:bg-indigo-50"
              >
                <Zap className="w-3.5 h-3.5 mr-1" />
                Top Up
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Meus Anúncios</h1>
            <p className="text-slate-500 mt-1">{myAds.length} anúncios no total</p>
          </div>
          <Link to={createPageUrl('CreateAd')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Anúncio
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : myAds.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              Nenhum anúncio ainda
            </h3>
            <p className="text-slate-500 mb-4">
              Comece a vender criando seu primeiro anúncio!
            </p>
            <Link to={createPageUrl('CreateAd')}>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Anúncio
              </Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue={pendingAds.length > 0 ? "pending" : "active"} className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="pending">
                Pendentes ({pendingAds.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Ativos ({activeAds.length})
              </TabsTrigger>
              <TabsTrigger value="paused">
                Pausados ({pausedAds.length})
              </TabsTrigger>
              <TabsTrigger value="sold">
                Vendidos ({soldAds.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingAds.length === 0 ? (
                <p className="text-center text-slate-500 py-10">Nenhum anúncio pendente</p>
              ) : (
                pendingAds.map(ad => <AdItem key={ad.id} ad={ad} />)
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeAds.length === 0 ? (
                <p className="text-center text-slate-500 py-10">Nenhum anúncio ativo</p>
              ) : (
                activeAds.map(ad => <AdItem key={ad.id} ad={ad} />)
              )}
            </TabsContent>

            <TabsContent value="paused" className="space-y-4">
              {pausedAds.length === 0 ? (
                <p className="text-center text-slate-500 py-10">Nenhum anúncio pausado</p>
              ) : (
                pausedAds.map(ad => <AdItem key={ad.id} ad={ad} />)
              )}
            </TabsContent>

            <TabsContent value="sold" className="space-y-4">
              {soldAds.length === 0 ? (
                <p className="text-center text-slate-500 py-10">Nenhum anúncio vendido</p>
              ) : (
                soldAds.map(ad => <AdItem key={ad.id} ad={ad} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O anúncio será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAdMutation.mutate(deleteDialog.ad?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}