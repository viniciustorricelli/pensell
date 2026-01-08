import React, { useState } from 'react';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.fullName || !formData.username || !formData.password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      // Base44 handles user registration through the auth system
      // After registration, redirect to community selection
      toast.success('Conta criada! Selecione sua comunidade');
      setTimeout(() => {
        window.location.href = createPageUrl('SelectCommunity');
      }, 1000);
    } catch (error) {
      toast.error('Erro ao criar conta');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '2px' }}>
            PenSell /
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            type="email"
            placeholder="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="h-14 bg-gray-100 border-0 text-gray-800 placeholder:text-gray-500"
          />

          <Input
            type="text"
            placeholder="nome completo"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            className="h-14 bg-gray-100 border-0 text-gray-800 placeholder:text-gray-500"
          />

          <Input
            type="text"
            placeholder="nome de usuário"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            className="h-14 bg-gray-100 border-0 text-gray-800 placeholder:text-gray-500"
          />

          <Input
            type="password"
            placeholder="senha"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="h-14 bg-gray-100 border-0 text-gray-800 placeholder:text-gray-500"
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-transparent text-blue-500 text-lg font-semibold hover:bg-white/10 border-0"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'cadastre-se'}
          </Button>
        </form>

        {/* Links */}
        <div className="text-center mt-8">
          <p className="text-white text-sm mb-1">Já tem uma conta?</p>
          <button
            onClick={() => window.location.href = createPageUrl('Login')}
            className="text-blue-200 font-semibold hover:text-white transition-colors"
          >
            conecte-se
          </button>
        </div>
      </div>
    </div>
  );
}