import React from 'react';
import { 
  Smartphone, 
  Sofa, 
  Car, 
  Home, 
  Shirt, 
  Wrench, 
  Dumbbell, 
  Flower2, 
  PawPrint, 
  Briefcase,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'all', label: 'Todos', icon: LayoutGrid },
  { id: 'eletronicos', label: 'Eletrônicos', icon: Smartphone },
  { id: 'moveis', label: 'Móveis', icon: Sofa },
  { id: 'veiculos', label: 'Veículos', icon: Car },
  { id: 'imoveis', label: 'Imóveis', icon: Home },
  { id: 'moda', label: 'Moda', icon: Shirt },
  { id: 'servicos', label: 'Serviços', icon: Wrench },
  { id: 'esportes', label: 'Esportes', icon: Dumbbell },
  { id: 'casa_jardim', label: 'Casa', icon: Flower2 },
  { id: 'animais', label: 'Pets', icon: PawPrint },
  { id: 'empregos', label: 'Empregos', icon: Briefcase },
];

export default function CategoryFilter({ selected, onChange }) {
  return (
    <div className="overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-2 px-4 md:px-0 min-w-max">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selected === cat.id || (!selected && cat.id === 'all');
          
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id === 'all' ? null : cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200",
                "whitespace-nowrap text-sm font-medium",
                isSelected 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" 
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}