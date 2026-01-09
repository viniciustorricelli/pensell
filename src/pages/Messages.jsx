import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  MessageCircle,
  Search,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

export default function Messages() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      const [buyerConvos, sellerConvos] = await Promise.all([
        base44.entities.Conversation.filter({ buyer_id: user.id }),
        base44.entities.Conversation.filter({ seller_id: user.id })
      ]);
      
      // Merge and dedupe
      const allConvos = [...buyerConvos, ...sellerConvos];
      const uniqueConvos = allConvos.reduce((acc, convo) => {
        if (!acc.find(c => c.id === convo.id)) {
          acc.push(convo);
        }
        return acc;
      }, []);
      
      // Sort by last message
      return uniqueConvos.sort((a, b) => 
        new Date(b.last_message_at) - new Date(a.last_message_at)
      );
    },
    enabled: !!user,
    staleTime: 10000,
    refetchInterval: 15000
  });

  const filteredConversations = conversations.filter(convo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const otherName = convo.buyer_id === user?.id ? convo.seller_name : convo.buyer_name;
    return (
      otherName?.toLowerCase().includes(query) ||
      convo.ad_title?.toLowerCase().includes(query)
    );
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-14 md:top-16 z-30">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-slate-800 mb-4">Mensagens</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversas..."
                className="pl-10 h-11 rounded-full bg-slate-100 border-0"
              />
            </div>
          </div>
        </div>

        {/* Conversations List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              Nenhuma conversa ainda
            </h3>
            <p className="text-slate-500">
              Quando você iniciar ou receber uma mensagem, ela aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredConversations.map((convo) => {
              const isBuyer = convo.buyer_id === user.id;
              const otherName = isBuyer ? convo.seller_name : convo.buyer_name;
              const otherPhoto = isBuyer ? convo.seller_photo : convo.buyer_photo;
              const unreadCount = isBuyer ? convo.unread_buyer : convo.unread_seller;
              
              return (
                <Link
                  key={convo.id}
                  to={createPageUrl(`Chat?id=${convo.id}`)}
                  className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={otherPhoto} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg">
                        {otherName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={cn(
                        "font-semibold truncate",
                        unreadCount > 0 ? "text-slate-800" : "text-slate-600"
                      )}>
                        {otherName}
                      </h3>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                        {moment(convo.last_message_at).fromNow()}
                      </span>
                    </div>
                    
                    <p className={cn(
                      "text-sm truncate",
                      unreadCount > 0 ? "text-slate-800 font-medium" : "text-slate-500"
                    )}>
                      {convo.last_message || 'Iniciar conversa'}
                    </p>
                    
                    {/* Ad Preview */}
                    <div className="flex items-center gap-2 mt-2 p-2 bg-slate-50 rounded-lg">
                      {convo.ad_image && (
                        <img 
                          src={convo.ad_image} 
                          alt="" 
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600 truncate">{convo.ad_title}</p>
                        <p className="text-xs font-semibold text-indigo-600">
                          {formatPrice(convo.ad_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}