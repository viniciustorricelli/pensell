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
        body: `
Denúncia de ${type}
ID: ${itemId}
Título: ${itemTitle || 'N/A'}

Denunciado por: ${user.full_name} (${user.email})

Descrição:
${description}
        `
      });

      toast.success('Denúncia enviada com sucesso');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao enviar denúncia');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-2 border-red-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Denunciar {type}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Descreva o motivo da denúncia. Nossa equipe irá analisar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            placeholder="Descreva o problema..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="resize-none bg-slate-50 border-slate-200 focus:border-red-400 focus:ring-red-400"
          />
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-slate-300 hover:bg-slate-100"
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
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