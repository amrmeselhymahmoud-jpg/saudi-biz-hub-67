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
  CreditCard,
  Archive,
  Clock,
  Globe,
  Lock
} from 'lucide-react';

const IconGrid = () => {
  // Circular arrangement around the center
  const iconRings = [
    // Inner ring - Core functions
    {
      radius: 120,
      icons: [
        { Icon: BarChart3, color: 'text-blue-400', label: 'التقارير', angle: 0 },
        { Icon: DollarSign, color: 'text-yellow-400', label: 'المالية', angle: 90 },
        { Icon: Users, color: 'text-emerald-400', label: 'العملاء', angle: 180 },
        { Icon: Shield, color: 'text-red-400', label: 'الأمان', angle: 270 }
      ]
    },
    // Middle ring - Analysis & Management
    {
      radius: 180,
      icons: [
        { Icon: TrendingUp, color: 'text-green-400', label: 'النمو', angle: 45 },
        { Icon: Calculator, color: 'text-orange-400', label: 'الحاسبة', angle: 135 },
        { Icon: FileText, color: 'text-amber-400', label: 'المستندات', angle: 225 },
        { Icon: Database, color: 'text-indigo-400', label: 'البيانات', angle: 315 }
      ]
    },
    // Outer ring - Extended features
    {
      radius: 240,
      icons: [
        { Icon: PieChart, color: 'text-cyan-400', label: 'التحليل', angle: 0 },
        { Icon: CreditCard, color: 'text-purple-400', label: 'المدفوعات', angle: 60 },
        { Icon: Zap, color: 'text-pink-400', label: 'الأتمتة', angle: 120 },
        { Icon: Settings, color: 'text-slate-400', label: 'الإعدادات', angle: 180 },
        { Icon: Archive, color: 'text-gray-400', label: 'الأرشيف', angle: 240 },
        { Icon: Clock, color: 'text-blue-300', label: 'التوقيت', angle: 300 }
      ]
    }
  ];

  const cornerIcons = [
    { Icon: Globe, color: 'text-teal-400', label: 'الشبكة', position: 'top-8 left-8' },
    { Icon: Lock, color: 'text-rose-400', label: 'التشفير', position: 'top-8 right-8' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Central hub with Qoyod logo */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Main logo container */}
          <div className="w-20 h-20 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-2xl z-10 relative">
            <span className="text-2xl font-bold text-white drop-shadow-lg">ق</span>
          </div>
          
          {/* Orbital rings */}
          {iconRings.map((ring, ringIndex) => (
            <div key={ringIndex} className="absolute inset-0 flex items-center justify-center">
              {/* Ring circle */}
              <div 
                className="absolute border border-white/10 rounded-full animate-spin opacity-30"
                style={{
                  width: `${ring.radius}px`,
                  height: `${ring.radius}px`,
                  animationDuration: `${20 + ringIndex * 10}s`,
                  animationDirection: ringIndex % 2 === 0 ? 'normal' : 'reverse'
                }}
              />
              
              {/* Icons positioned on the ring */}
              {ring.icons.map((iconData, iconIndex) => {
                const { Icon, color, label, angle } = iconData;
                const radian = (angle * Math.PI) / 180;
                const x = Math.cos(radian) * (ring.radius / 2);
                const y = Math.sin(radian) * (ring.radius / 2);
                
                return (
                  <div
                    key={iconIndex}
                    className={`absolute ${color} animate-bounce`}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${ringIndex + iconIndex * 0.2}s`,
                      animationDuration: '3s'
                    }}
                  >
                    <div className="group relative">
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-current/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm scale-150" />
                      
                      {/* Icon container */}
                      <div className="relative p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:scale-110 transition-all duration-300">
                        <Icon size={ringIndex === 0 ? 26 : ringIndex === 1 ? 22 : 18} className="drop-shadow-lg" />
                      </div>
                      
                      {/* Label */}
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/70 whitespace-nowrap text-center font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Central pulse rings */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 border border-white/20 rounded-full animate-ping"
              style={{
                width: `${60 + i * 15}px`,
                height: `${60 + i * 15}px`,
                top: `${-10 - i * 7.5}px`,
                left: `${-10 - i * 7.5}px`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Corner accent icons */}
      {cornerIcons.map((corner, index) => {
        const { Icon, color, label, position } = corner;
        return (
          <div key={index} className={`absolute ${position}`}>
            <div className={`${color} animate-pulse`} style={{ animationDelay: `${index * 0.5}s` }}>
              <div className="group relative">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:scale-110 transition-all duration-300">
                  <Icon size={20} className="drop-shadow-lg" />
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {label}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Connection lines between rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {[...Array(8)].map((_, i) => {
          const angle = i * 45;
          const radian = (angle * Math.PI) / 180;
          return (
            <div
              key={i}
              className="absolute w-32 h-0.5 bg-gradient-to-r from-white/20 via-white/10 to-transparent animate-pulse origin-left"
              style={{
                transform: `rotate(${angle}deg)`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s'
              }}
            />
          );
        })}
      </div>

      {/* Floating data particles */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-ping"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Category labels */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/5 rounded-full px-4 py-2 backdrop-blur-sm border border-white/10">
          <span className="text-white/60 text-xs font-medium">نظام إدارة متكامل</span>
        </div>
      </div>
      
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/5 rounded-full px-4 py-2 backdrop-blur-sm border border-white/10">
          <span className="text-white/60 text-xs font-medium">حلول محاسبية ذكية</span>
        </div>
      </div>
    </div>
  );
};

export default IconGrid;