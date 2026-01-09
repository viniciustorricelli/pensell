import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, MapPin } from 'lucide-react';
import RequestCommunityDialog from '@/components/RequestCommunityDialog';
import { toast } from 'sonner';

export default function SelectCommunity() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (!authenticated) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        const userData = await base44.auth.me();
        
        // If user already has a community, redirect to home
        if (userData.current_community_id) {
          window.location.href = createPageUrl('Home');
          return;
        }
        
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    checkAuth();
  }, []);

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => base44.entities.Community.filter({ is_active: true }),
    enabled: !!user
  });

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCommunity = async () => {
    if (!selectedCommunity) {
      toast.error('Selecione uma instituição');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.auth.updateMe({
        current_community_id: selectedCommunity.id,
        communities: [selectedCommunity.id],
        location_city: selectedCommunity.city
      });

      toast.success('Comunidade selecionada!');
      window.location.href = createPageUrl('Home');
    } catch (error) {
      toast.error('Erro ao selecionar comunidade');
      setIsSubmitting(false);
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col">
              <div className="flex justify-center mb-4">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695b603a6d9b50e34c2be229/b9a529274_1-removebg-preview.png" 
                  alt="PenSell" 
                  className="h-20"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
                Encontre sua instituição
              </h1>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Pesquisar instituição"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 bg-white border-2 border-gray-200"
            />
          </div>

          {/* Communities List */}
          <div className="space-y-2 mb-3 max-h-80 overflow-y-auto">
            {filteredCommunities.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma instituição encontrada</p>
            ) : (
              filteredCommunities.map((community) => (
                <button
                  key={community.id}
                  onClick={() => setSelectedCommunity(community)}
                  className={`w-full h-14 rounded-xl font-medium transition-all ${
                    selectedCommunity?.id === community.id
                      ? 'bg-blue-500 text-white border-2 border-blue-600'
                      : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between px-4">
                    <span>{community.name}</span>
                    {community.city && (
                      <span className="text-xs opacity-70 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {community.city}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Selected Community Display */}
          {selectedCommunity && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Instituição selecionada:</p>
              <p className="font-semibold text-gray-800">{selectedCommunity.name}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSelectCommunity}
            disabled={!selectedCommunity || isSubmitting}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Escolher instituição'
            )}
          </Button>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm mb-2">Não encontrou sua instituição?</p>
            <Button
              variant="link"
              onClick={() => setShowRequestDialog(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Solicitar nova comunidade
            </Button>
          </div>
        </div>
      </div>

      {/* Request Community Dialog */}
      <RequestCommunityDialog 
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
      />
    </div>
  );
}