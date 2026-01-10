import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import RequestCommunityDialog from '@/components/RequestCommunityDialog';

export default function CommunitySelector({ user, onCommunityChange }) {
  const [open, setOpen] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: communities = [] } = useQuery({
    queryKey: ['communities'],
    queryFn: () => base44.entities.Community.filter({ is_active: true })
  });

  const { data: currentCommunity } = useQuery({
    queryKey: ['current-community', user?.current_community_id],
    queryFn: async () => {
      if (!user?.current_community_id) return null;
      const comms = await base44.entities.Community.filter({ id: user.current_community_id });
      return comms[0];
    },
    enabled: !!user?.current_community_id
  });

  const handleSelectCommunity = async (community) => {
    try {
      const userCommunities = user.communities || [];
      if (!userCommunities.includes(community.id)) {
        userCommunities.push(community.id);
      }

      await base44.auth.updateMe({
        current_community_id: community.id,
        communities: userCommunities
      });

      toast.success(`Comunidade alterada para ${community.name}`);
      setOpen(false);
      queryClient.invalidateQueries();
      if (onCommunityChange) onCommunityChange();
    } catch (error) {
      toast.error('Erro ao alterar comunidade');
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
      >
        <MapPin className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-medium text-gray-800">
          {currentCommunity?.name || 'Selecionar Comunidade'}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Comunidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {communities.map((community) => (
              <button
                key={community.id}
                onClick={() => handleSelectCommunity(community)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  currentCommunity?.id === community.id
                    ? 'bg-indigo-50 border-indigo-500'
                    : 'bg-white border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="text-left">
                  <p className="font-semibold text-gray-800">{community.name}</p>
                  {community.city && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {community.city}
                    </p>
                  )}
                </div>
                {currentCommunity?.id === community.id && (
                  <Check className="w-5 h-5 text-indigo-600" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t pt-4 text-center space-y-2">
            <p className="text-gray-600 text-sm">Não encontrou sua instituição?</p>
            <p className="text-gray-500 text-xs">Pode ser igreja, bairro, condomínio, universidade...</p>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setShowRequestDialog(true);
              }}
              className="w-full text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
            >
              Solicitar nova comunidade
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RequestCommunityDialog 
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
      />
    </>
  );
}