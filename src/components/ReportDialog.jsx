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
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportDialog({ open, onOpenChange, type, itemId, itemTitle }) {
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Por favor, descreva o motivo da denúncia');
      return;
    }

    setIsSending(true);
    try {
      const user = await base44.auth.me();
      
      await base44.integrations.Core.SendEmail({
        to: 'vinicius.ts16@gmail.com',
        subject: `Denúncia: ${type} - ${itemTitle || itemId}`,
        body: `Denúncia de ${type}

ID: ${itemId}
Título: ${itemTitle || 'N/A'}

Denunciado por: ${user.full_name} (${user.email})

Descrição:
${description}`
      });

      toast.success('Denúncia enviada com sucesso');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast.error(`Erro ao enviar denúncia: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white/95 backdrop-blur-md shadow-2xl border-0">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Denunciar {type}
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            Descreva o motivo da denúncia. Nossa equipe irá analisar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <Textarea
            placeholder="Descreva o problema..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="resize-none bg-white border-2 border-gray-200 focus:border-red-400 text-base"
          />
          
          <div className="flex gap-4">
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
              className="flex-1 h-12 text-base bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Enviar Denúncia'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}