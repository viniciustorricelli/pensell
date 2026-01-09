import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RequestCommunityDialog({ open, onOpenChange }) {
  const [communityName, setCommunityName] = useState('');
  const [city, setCity] = useState('');
  const [details, setDetails] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!communityName.trim() || !city.trim()) {
      toast.error('Por favor, preencha o nome e a cidade');
      return;
    }

    setIsSending(true);
    try {
      const user = await base44.auth.me();
      
      await base44.integrations.Core.SendEmail({
        to: 'vinicius.ts16@gmail.com',
        subject: `Solicitação de Nova Comunidade: ${communityName}`,
        body: `
Nova solicitação de comunidade

Nome da Instituição: ${communityName}
Cidade: ${city}

Detalhes adicionais:
${details || 'Nenhum detalhe adicional fornecido'}

Solicitado por: ${user.full_name} (${user.email})
        `
      });

      toast.success('Solicitação enviada com sucesso!');
      setCommunityName('');
      setCity('');
      setDetails('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao enviar solicitação');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white/95 backdrop-blur-md shadow-2xl border-0">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Solicitar Nova Comunidade
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            Informe os dados da instituição que você gostaria de adicionar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 pt-4">
          <div>
            <Label htmlFor="name" className="text-gray-700 font-medium">Nome da Instituição *</Label>
            <Input
              id="name"
              placeholder="Ex: Universidade Federal..."
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              className="mt-2 h-12 bg-white border-2 border-gray-200 focus:border-blue-400 text-base"
            />
          </div>
          
          <div>
            <Label htmlFor="city" className="text-gray-700 font-medium">Cidade *</Label>
            <Input
              id="city"
              placeholder="Ex: São Paulo"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-2 h-12 bg-white border-2 border-gray-200 focus:border-blue-400 text-base"
            />
          </div>
          
          <div>
            <Label htmlFor="details" className="text-gray-700 font-medium">Informações Adicionais</Label>
            <Textarea
              id="details"
              placeholder="Estado, site, ou outras informações..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="mt-2 resize-none bg-white border-2 border-gray-200 focus:border-blue-400 text-base"
            />
          </div>
          
          <div className="flex gap-4 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 text-base border-2 hover:bg-gray-50"
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSending}
              className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Enviar Solicitação'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}