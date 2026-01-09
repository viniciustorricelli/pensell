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
        to: 'seu-email@exemplo.com', // Substitua pelo seu email
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Solicitar Nova Comunidade
          </DialogTitle>
          <DialogDescription>
            Informe os dados da instituição que você gostaria de adicionar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Instituição *</Label>
            <Input
              id="name"
              placeholder="Ex: Universidade Federal..."
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              placeholder="Ex: São Paulo"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="details">Informações Adicionais</Label>
            <Textarea
              id="details"
              placeholder="Estado, site, ou outras informações..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="mt-1 resize-none"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
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