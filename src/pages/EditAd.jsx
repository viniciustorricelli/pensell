import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  ImagePlus,
  X,
  MapPin,
  DollarSign,
  Tag,
  FileText,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function EditAd() {
  const urlParams = new URLSearchParams(window.location.search);
  const adId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    location_city: '',
    location_neighborhood: '',
    images: []
  });

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

  // Fetch ad
  const { data: ad, isLoading: adLoading } = useQuery({
    queryKey: ['ad', adId],
    queryFn: async () => {
      const ads = await base44.entities.Ad.filter({ id: adId });
      return ads[0];
    },
    enabled: !!adId
  });

  // Populate form when ad is loaded
  useEffect(() => {
    if (ad) {
      setFormData({
        title: ad.title || '',
        description: ad.description || '',
        price: ad.price?.toString() || '',
        category: ad.category || '',
        location_city: ad.location_city || '',
        location_neighborhood: ad.location_neighborhood || '',
        images: ad.images || []
      });
    }
  }, [ad]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 10) {
      toast.error('Máximo de 10 imagens permitidas');
      return;
    }

    setUploadingImages(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      toast.success(`${files.length} imagem(s) enviada(s)`);
    } catch (error) {
      toast.error('Erro ao enviar imagens');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.location_city || !formData.location_neighborhood) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Adicione pelo menos uma imagem');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.Ad.update(adId, {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        location_city: formData.location_city,
        location_neighborhood: formData.location_neighborhood,
        images: formData.images
      });

      toast.success('Anúncio atualizado com sucesso!');
      window.location.href = createPageUrl(`AdDetails?id=${adId}`);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar anúncio');
      setIsSubmitting(false);
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
        <p className="text-slate-500 mb-4">Este anúncio pode ter sido removido ou não existe.</p>
        <Button onClick={() => window.location.href = createPageUrl('MyAds')}>
          Voltar para Meus Anúncios
        </Button>
      </div>
    );
  }

  if (ad.seller_id !== user.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Acesso negado</h2>
        <p className="text-slate-500 mb-4">Você não tem permissão para editar este anúncio.</p>
        <Button onClick={() => window.location.href = createPageUrl('Home')}>
          Voltar para Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Editar Anúncio</h1>
          <p className="text-slate-500 mt-1">Atualize as informações do seu produto ou serviço</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <Label className="text-base font-semibold text-slate-800 mb-4 block">
              Fotos do anúncio *
            </Label>
            
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {/* Image previews */}
              <AnimatePresence>
                {formData.images.map((url, index) => (
                  <motion.div
                    key={url}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-xl overflow-hidden group"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                        Principal
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Upload button */}
              {formData.images.length < 10 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-slate-50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImages}
                  />
                  {uploadingImages ? (
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  ) : (
                    <>
                      <ImagePlus className="w-6 h-6 text-slate-400" />
                      <span className="text-xs text-slate-500">Adicionar</span>
                    </>
                  )}
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Adicione até 10 fotos. A primeira será a principal.
            </p>
          </div>

          {/* Title */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="flex items-center gap-2 text-slate-700 mb-2">
                  <Tag className="w-4 h-4" />
                  Título do anúncio *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: iPhone 15 Pro Max 256GB"
                  maxLength={100}
                  className="h-12"
                />
                <p className="text-xs text-slate-500 mt-1">{formData.title.length}/100</p>
              </div>

              <div>
                <Label htmlFor="description" className="flex items-center gap-2 text-slate-700 mb-2">
                  <FileText className="w-4 h-4" />
                  Descrição *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o produto ou serviço em detalhes..."
                  rows={5}
                  maxLength={2000}
                />
                <p className="text-xs text-slate-500 mt-1">{formData.description.length}/2000</p>
              </div>
            </div>
          </div>

          {/* Price and Category */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="flex items-center gap-2 text-slate-700 mb-2">
                  <DollarSign className="w-4 h-4" />
                  Preço *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0,00"
                    className="h-12 pl-12"
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 text-slate-700 mb-2">
                  <Tag className="w-4 h-4" />
                  Categoria *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({...formData, category: v})}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <Label className="flex items-center gap-2 text-slate-700 mb-4">
              <MapPin className="w-4 h-4" />
              Localização *
            </Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-sm text-slate-600 mb-2 block">
                  Cidade
                </Label>
                <Input
                  id="city"
                  value={formData.location_city}
                  onChange={(e) => setFormData({...formData, location_city: e.target.value})}
                  placeholder="Ex: São Paulo"
                  className="h-12"
                />
              </div>
              <div>
                <Label htmlFor="neighborhood" className="text-sm text-slate-600 mb-2 block">
                  Comunidade *
                </Label>
                <Input
                  id="neighborhood"
                  value={formData.location_neighborhood}
                  onChange={(e) => setFormData({...formData, location_neighborhood: e.target.value})}
                  placeholder="Ex: Universidade"
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = createPageUrl(`AdDetails?id=${adId}`)}
              className="flex-1 h-14 text-lg rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-semibold rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}