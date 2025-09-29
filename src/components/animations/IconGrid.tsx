import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Zap, 
  PieChart,
  Calculator,
  FileText,
  Users,
  Settings,
  Database,
  CreditCard
} from 'lucide-react';

const IconGrid = () => {
  const iconCategories = [
    {
      category: 'التحليل والتقارير',
      position: 'top-12 left-12',
      icons: [
        { Icon: BarChart3, color: 'text-blue-400', label: 'التقارير' },
        { Icon: TrendingUp, color: 'text-green-400', label: 'النمو' },
        { Icon: PieChart, color: 'text-cyan-400', label: 'التحليل' }
      ]
    },
    {
      category: 'الإدارة المالية',
      position: 'top-12 right-12',
      icons: [
        { Icon: DollarSign, color: 'text-yellow-400', label: 'العملات' },
        { Icon: Calculator, color: 'text-orange-400', label: 'الحاسبة' },
        { Icon: CreditCard, color: 'text-purple-400', label: 'المدفوعات' }
      ]
    },
    {
      category: 'إدارة النظام',
      position: 'bottom-12 left-12',
      icons: [
        { Icon: Settings, color: 'text-slate-400', label: 'الإعدادات' },
        { Icon: Database, color: 'text-indigo-400', label: 'البيانات' },
        { Icon: Shield, color: 'text-red-400', label: 'الأمان' }
      ]
    },
    {
      category: 'إدارة العملاء',
      position: 'bottom-12 right-12',
      icons: [
        { Icon: Users, color: 'text-emerald-400', label: 'العملاء' },
        { Icon: FileText, color: 'text-amber-400', label: 'المستندات' },
        { Icon: Zap, color: 'text-pink-400', label: 'الأتمتة' }
      ]
    }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {iconCategories.map((category, categoryIndex) => (
        <div key={categoryIndex} className={`absolute ${category.position}`}>
          {/* Category container with glass effect */}
          <div className="bg-white/5 rounded-3xl p-6 backdrop-blur-xl border border-white/10 shadow-2xl">
            {/* Category title */}
            <div className="text-white/60 text-xs font-medium mb-4 text-center">
              {category.category}
            </div>
            
            {/* Icons grid */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {category.icons.map((iconData, iconIndex) => {
                const { Icon, color, label } = iconData;
                return (
                  <div
                    key={iconIndex}
                    className={`${color} animate-bounce hover:scale-110 transition-all duration-300`}
                    style={{ 
                      animationDelay: `${categoryIndex * 0.5 + iconIndex * 0.2}s`, 
                      animationDuration: '3s' 
                    }}
                  >
                    <div className="group relative">
                      {/* Main icon container */}
                      <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                        <Icon size={24} className="drop-shadow-lg" />
                      </div>
                      
                      {/* Icon label */}
                      <div className="text-xs text-white/70 mt-2 text-center font-medium">
                        {label}
                      </div>
                      
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Connecting lines between categories */}
          {categoryIndex < iconCategories.length - 1 && (
            <div className="absolute top-1/2 left-full w-8 h-0.5 bg-gradient-to-r from-white/20 to-transparent animate-pulse" 
                 style={{ animationDelay: `${categoryIndex * 0.5}s` }} />
          )}
        </div>
      ))}

      {/* Central connecting hub */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Central node */}
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full backdrop-blur-md border border-white/30 flex items-center justify-center animate-pulse">
            <div className="text-white text-xl font-bold">ق</div>
          </div>
          
          {/* Orbital rings */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 border border-white/20 rounded-full animate-spin"
              style={{
                width: `${80 + i * 20}px`,
                height: `${80 + i * 20}px`,
                top: `${-10 - i * 10}px`,
                left: `${-10 - i * 10}px`,
                animationDuration: `${8 + i * 2}s`,
                animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating connection indicators */}
      <div className="absolute inset-0">
        {/* Top horizontal connector */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        
        {/* Bottom horizontal connector */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Left vertical connector */}
        <div className="absolute left-20 top-1/2 transform -translate-y-1/2 w-0.5 h-32 bg-gradient-to-b from-transparent via-white/30 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
        
        {/* Right vertical connector */}
        <div className="absolute right-20 top-1/2 transform -translate-y-1/2 w-0.5 h-32 bg-gradient-to-b from-transparent via-white/30 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Corner accent elements */}
      <div className="absolute top-4 left-4">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
      </div>
      <div className="absolute top-4 right-4">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
      </div>
      <div className="absolute bottom-4 left-4">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
      </div>
      <div className="absolute bottom-4 right-4">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
      </div>
    </div>
  );
};

export default IconGrid;