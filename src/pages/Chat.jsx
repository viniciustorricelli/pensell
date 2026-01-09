import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Send,
  ImagePlus,
  MoreVertical,
  Flag,
  Ban,
  Loader2,
  Check,
  CheckCheck,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

const quickMessages = [
  'Ainda disponível?',
  'Tem desconto?',
  'Posso ver mais fotos?',
  'Quero comprar!'
];

export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

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

  // Fetch conversation
  const { data: conversation, isLoading: convoLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const convos = await base44.entities.Conversation.filter({ id: conversationId });
      return convos[0];
    },
    enabled: !!conversationId
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => base44.entities.Message.filter(
      { conversation_id: conversationId },
      'created_date'
    ),
    enabled: !!conversationId,
    refetchInterval: 3000
  });

  // Mark messages as read
  useEffect(() => {
    if (!conversation || !user) return;
    
    const isBuyer = conversation.buyer_id === user.id;
    const unreadField = isBuyer ? 'unread_buyer' : 'unread_seller';
    
    if (conversation[unreadField] > 0) {
      base44.entities.Conversation.update(conversationId, {
        [unreadField]: 0
      });
      queryClient.invalidateQueries(['unread-conversations']);
    }
  }, [conversation, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || !user || !conversation) return;
    
    setIsSending(true);
    try {
      const isBuyer = conversation.buyer_id === user.id;
      
      // Create message
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: user.full_name,
        content: text.trim()
      });
      
      // Update conversation
      await base44.entities.Conversation.update(conversationId, {
        last_message: text.trim(),
        last_message_at: new Date().toISOString(),
        [isBuyer ? 'unread_seller' : 'unread_buyer']: 
          (conversation[isBuyer ? 'unread_seller' : 'unread_buyer'] || 0) + 1
      });
      
      setMessageText('');
      queryClient.invalidateQueries(['messages', conversationId]);
      queryClient.invalidateQueries(['conversation', conversationId]);
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsSending(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: user.full_name,
        content: '📷 Imagem',
        image_url: file_url
      });
      
      const isBuyer = conversation.buyer_id === user.id;
      await base44.entities.Conversation.update(conversationId, {
        last_message: '📷 Imagem',
        last_message_at: new Date().toISOString(),
        [isBuyer ? 'unread_seller' : 'unread_buyer']: 
          (conversation[isBuyer ? 'unread_seller' : 'unread_buyer'] || 0) + 1
      });
      
      queryClient.invalidateQueries(['messages', conversationId]);
      queryClient.invalidateQueries(['conversation', conversationId]);
    } catch (error) {
      toast.error('Erro ao enviar imagem');
    } finally {
      setIsSending(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (!user || convoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Conversa não encontrada</h2>
        <Link to={createPageUrl('Messages')}>
          <Button>Voltar para Mensagens</Button>
        </Link>
      </div>
    );
  }

  const isBuyer = conversation.buyer_id === user.id;
  const otherName = isBuyer ? conversation.seller_name : conversation.buyer_name;
  const otherPhoto = isBuyer ? conversation.seller_photo : conversation.buyer_photo;
  const otherId = isBuyer ? conversation.seller_id : conversation.buyer_id;

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-100 md:relative md:h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 mt-14 md:mt-0">
        <Link to={createPageUrl('Messages')} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        
        <Link 
          to={createPageUrl(`SellerProfile?id=${otherId}`)}
          className="flex items-center gap-3 flex-1"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherPhoto} />
            <AvatarFallback className="bg-indigo-100 text-indigo-600">
              {otherName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-slate-800">{otherName}</h2>
            <p className="text-xs text-slate-500">Ver perfil</p>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-red-600">
              <Ban className="w-4 h-4 mr-2" />
              Bloquear usuário
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Flag className="w-4 h-4 mr-2" />
              Denunciar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Ad Preview */}
      <Link
        to={createPageUrl(`AdDetails?id=${conversation.ad_id}`)}
        className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0"
      >
        {conversation.ad_image && (
          <img 
            src={conversation.ad_image} 
            alt="" 
            className="w-12 h-12 rounded-lg object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {conversation.ad_title}
          </p>
          <p className="text-sm font-bold text-indigo-600">
            {formatPrice(conversation.ad_price)}
          </p>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400" />
      </Link>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500">Inicie a conversa!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender_id === user.id;
            const showTimestamp = index === 0 || 
              moment(message.created_date).diff(moment(messages[index - 1].created_date), 'minutes') > 5;

            return (
              <div key={message.id}>
                {showTimestamp && (
                  <div className="text-center my-4">
                    <span className="text-xs text-slate-400 bg-slate-200 px-3 py-1 rounded-full">
                      {moment(message.created_date).format('DD/MM [às] HH:mm')}
                    </span>
                  </div>
                )}
                
                <div className={cn(
                  "flex",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    isOwnMessage 
                      ? "bg-indigo-600 text-white rounded-br-md" 
                      : "bg-white text-slate-800 rounded-bl-md shadow-sm"
                  )}>
                    {message.image_url && (
                      <img 
                        src={message.image_url} 
                        alt="" 
                        className="max-w-full rounded-lg mb-2"
                      />
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className={cn(
                      "flex items-center justify-end gap-1 mt-1",
                      isOwnMessage ? "text-indigo-200" : "text-slate-400"
                    )}>
                      <span className="text-xs">
                        {moment(message.created_date).format('HH:mm')}
                      </span>
                      {isOwnMessage && (
                        message.is_read 
                          ? <CheckCheck className="w-3.5 h-3.5" />
                          : <Check className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto flex-shrink-0">
        <div className="flex gap-2">
          {quickMessages.map((msg) => (
            <button
              key={msg}
              onClick={() => sendMessage(msg)}
              disabled={isSending}
              className="flex-shrink-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-700 transition-colors"
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 pb-safe mb-16 md:mb-0 md:pb-3">
        <label className="p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isSending}
          />
          <ImagePlus className="w-5 h-5 text-slate-500" />
        </label>
        
        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(messageText)}
          placeholder="Digite sua mensagem..."
          className="flex-1 h-11 rounded-full bg-slate-100 border-0"
          disabled={isSending}
        />
        
        <Button
          onClick={() => sendMessage(messageText)}
          disabled={!messageText.trim() || isSending}
          size="icon"
          className="rounded-full bg-indigo-600 hover:bg-indigo-700 h-11 w-11"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}