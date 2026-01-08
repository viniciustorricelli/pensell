import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  Search,
  PlusCircle,
  MessageCircle,
  User,
  Heart,
  BarChart3,
  Menu,
  X,
  Bell,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          let userData = await base44.auth.me();
          
          // Auto-reset topups if 24h have passed
          if (userData.last_topup_reset && userData.available_topups === 0) {
            const lastReset = new Date(userData.last_topup_reset);
            const now = new Date();
            const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);
            
            if (hoursSinceReset >= 24) {
              await base44.auth.updateMe({
                available_topups: 1,
                last_topup_reset: now.toISOString()
              });
              userData = await base44.auth.me();
            }
          }
          
          setUser(userData);
        }
      } catch (e) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const { data: unreadConversations = [] } = useQuery({
    queryKey: ['unread-conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const convos = await base44.entities.Conversation.filter({
        $or: [{ buyer_id: user.id }, { seller_id: user.id }]
      });
      return convos.filter(c => 
        (c.buyer_id === user.id && c.unread_buyer > 0) ||
        (c.seller_id === user.id && c.unread_seller > 0)
      );
    },
    enabled: !!user,
    refetchInterval: 10000
  });

  const unreadCount = unreadConversations.length;

  const navItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Anunciar', icon: PlusCircle, page: 'CreateAd', highlight: true },
  ];

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: #6366f1;
          --primary-dark: #4f46e5;
          --accent: #f59e0b;
          --success: #10b981;
          --background: #f8fafc;
        }
      `}</style>

      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full relative h-10 w-10">
                      <Menu className="w-6 h-6" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Messages')} className="flex items-center gap-2 cursor-pointer">
                        <MessageCircle className="w-4 h-4" />
                        Mensagens
                        {unreadCount > 0 && (
                          <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                            {unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Favorites')} className="flex items-center gap-2 cursor-pointer">
                        <Heart className="w-4 h-4" />
                        Favoritos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('MyAds')} className="flex items-center gap-2 cursor-pointer">
                        <BarChart3 className="w-4 h-4" />
                        Meus Anúncios
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold text-slate-800">Mercado<span className="text-indigo-600">Local</span></span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-8">
              <Link to={createPageUrl('Search')} className="block">
                <div className="flex items-center bg-slate-100 rounded-full px-4 py-2.5 hover:bg-slate-200 transition-colors cursor-pointer">
                  <Search className="w-5 h-5 text-slate-400" />
                  <span className="ml-3 text-slate-500">Buscar produtos ou serviços...</span>
                </div>
              </Link>
            </div>

            {/* Nav Items */}
            <div className="flex items-center gap-2">
              <Link to={createPageUrl('CreateAd')}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-full">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Anunciar
                </Button>
              </Link>

              {isAuthenticated ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                        {user?.profile_photo ? (
                          <img src={user.profile_photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                        )}
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2 border-b">
                        <p className="font-medium text-slate-800">{user?.full_name || 'Usuário'}</p>
                        <p className="text-sm text-slate-500">{user?.email}</p>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Profile')} className="flex items-center gap-2 cursor-pointer">
                          <User className="w-4 h-4" />
                          Meu Perfil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('MyAds')} className="flex items-center gap-2 cursor-pointer">
                          <BarChart3 className="w-4 h-4" />
                          Meus Anúncios
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => base44.auth.redirectToLogin()}
                  className="rounded-full"
                >
                  Entrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
        <div className="flex items-center justify-between px-4 h-14 py-2">
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 relative p-2">
                    <Menu className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Messages')} className="flex items-center gap-2 cursor-pointer">
                      <MessageCircle className="w-4 h-4" />
                      Mensagens
                      {unreadCount > 0 && (
                        <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Favorites')} className="flex items-center gap-2 cursor-pointer">
                      <Heart className="w-4 h-4" />
                      Favoritos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('MyAds')} className="flex items-center gap-2 cursor-pointer">
                      <BarChart3 className="w-4 h-4" />
                      Meus Anúncios
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="font-bold text-slate-800">Mercado<span className="text-indigo-600">Local</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <Button 
                size="sm"
                variant="outline" 
                onClick={() => base44.auth.redirectToLogin()}
                className="rounded-full text-sm"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 md:pt-16 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            
            if (item.highlight) {
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className="flex items-center justify-center -mt-4"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 py-2 relative",
                  isActive ? "text-indigo-600" : "text-slate-500"
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
          
          {isAuthenticated ? (
            <Link
              to={createPageUrl('Profile')}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2",
                currentPageName === 'Profile' ? "text-indigo-600" : "text-slate-500"
              )}
            >
              <User className="w-5 h-5" />
              <span className="text-xs font-medium">Perfil</span>
            </Link>
          ) : (
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 text-slate-500"
            >
              <User className="w-5 h-5" />
              <span className="text-xs font-medium">Entrar</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}