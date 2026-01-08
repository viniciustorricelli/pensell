import React, { useState } from 'react';
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
  LayoutGrid,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

export default function CategoryFilterCollapsible({ selected, onChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const selectedCategory = categories.find(cat => cat.id === selected) || categories[0];
  const Icon = selectedCategory.icon;

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
      >
        <Icon className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-800">{selectedCategory.label}</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {isExpanded && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsExpanded(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl p-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const CategoryIcon = cat.icon;
                const isSelected = selected === cat.id || (!selected && cat.id === 'all');
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onChange(cat.id === 'all' ? null : cat.id);
                      setIsExpanded(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
                      isSelected 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <CategoryIcon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}