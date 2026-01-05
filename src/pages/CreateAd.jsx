import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  ImagePlus,
  X,
  MapPin,
  DollarSign,
  Tag,
  FileText,
  Loader2,
  Upload,
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

export default function CreateAd() {
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
        // Pre-fill location from user profile
        if (userData.city) {
          setFormData(prev => ({
            ...prev,
            location_city: userData.city,
            location_neighborhood: userData.neighborhood || ''
          }));
        }
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    checkAuth();
  }, []);

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
    
    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.location_city) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Adicione pelo menos uma imagem');
      return;
    }

    setIsSubmitting(true);
    try {
      const ad = await base44.entities.Ad.create({
        ...formData,
        price: parseFloat(formData.price),
        seller_id: user.id,
        seller_name: user.full_name,
        seller_photo: user.profile_photo,
        status: 'active',
        views_count: 0,
        saves_count: 0,
        chat_clicks: 0,
        is_boosted: false
      });

      toast.success('Anúncio publicado com sucesso!');
      window.location.href = createPageUrl(`AdDetails?id=${ad.id}`);
    } catch (error) {
      toast.error('Erro ao publicar anúncio');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Criar Anúncio</h1>
          <p className="text-slate-500 mt-1">Preencha as informações do seu produto ou serviço</p>
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
                  Bairro (opcional)
                </Label>
                <Input
                  id="neighborhood"
                  value={formData.location_neighborhood}
                  onChange={(e) => setFormData({...formData, location_neighborhood: e.target.value})}
                  placeholder="Ex: Centro"
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-semibold rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Publicar Anúncio
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}