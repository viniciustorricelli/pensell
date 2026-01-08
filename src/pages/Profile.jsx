import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  MapPin,
  Star,
  Shield,
  Camera,
  Edit2,
  Package,
  BarChart3,
  LogOut,
  Loader2,
  Check,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    city: '',
    neighborhood: '',
    phone: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (!authenticated) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        const userData = await base44.auth.me();
        setUser(userData);
        setFormData({
          bio: userData.bio || '',
          city: userData.city || '',
          neighborhood: userData.neighborhood || '',
          phone: userData.phone || ''
        });
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  // Fetch user's ads
  const { data: myAds = [] } = useQuery({
    queryKey: ['my-ads', user?.id],
    queryFn: () => base44.entities.Ad.filter({ seller_id: user.id }),
    enabled: !!user
  });

  // Fetch user's reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['my-reviews', user?.id],
    queryFn: () => base44.entities.Review.filter({ seller_id: user.id }),
    enabled: !!user
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_photo: file_url });
      setUser(prev => ({ ...prev, profile_photo: file_url }));
      toast.success('Foto atualizada!');
    } catch (error) {
      toast.error('Erro ao atualizar foto');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe(formData);
      setUser(prev => ({ ...prev, ...formData }));
      setIsEditing(false);
      toast.success('Perfil atualizado!');
    } catch (error) {
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const activeAds = myAds.filter(ad => ad.status === 'active');
  const soldAds = myAds.filter(ad => ad.status === 'sold');

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.profile_photo} />
                <AvatarFallback className="bg-indigo-100 text-indigo-600 text-2xl">
                  {user.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Camera className="w-4 h-4 text-white" />
              </label>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-800">{user.full_name}</h1>
                {user.is_verified && (
                  <Shield className="w-5 h-5 text-indigo-600" />
                )}
              </div>
              <p className="text-slate-500 text-sm">{user.email}</p>
              
              {(user.city || user.neighborhood) && (
                <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  {user.neighborhood && `${user.neighborhood}, `}{user.city}
                </div>
              )}

              {reviews.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium text-slate-800">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-500">
                    ({reviews.length} avaliações)
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </div>

          {/* Bio */}
          {user.bio && !isEditing && (
            <p className="mt-4 text-slate-600">{user.bio}</p>
          )}

          {/* Edit Form */}
          {isEditing && (
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Sua cidade"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                    placeholder="Seu bairro"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(00) 00000-0000"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-indigo-600">{myAds.length}</p>
            <p className="text-sm text-slate-500">Anúncios</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-indigo-600">{soldAds.length}</p>
            <p className="text-sm text-slate-500">Vendas</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-indigo-600">{reviews.length}</p>
            <p className="text-sm text-slate-500">Avaliações</p>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <Link 
            to={createPageUrl('MyAds')} 
            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Package className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Meus Anúncios</p>
                <p className="text-sm text-slate-500">{myAds.length} anúncios</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>

          <Separator />

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-600">Sair da conta</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}