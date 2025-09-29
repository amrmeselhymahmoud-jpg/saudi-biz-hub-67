import React from 'react';
import BusinessCharts from './BusinessCharts';
import NetworkGrid from './NetworkGrid';
import FloatingElements from './FloatingElements';
import DataStream from './DataStream';
import IconGrid from './IconGrid';

const EnhancedBackground = () => {
  return (
    <div className="hidden lg:block flex-1 relative overflow-hidden">
      {/* Multi-layer gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-cyan-500/10 to-orange-400/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.2),transparent_50%)]"></div>
      </div>

      {/* Animated mesh overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 animate-pulse" style={{ 
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)',
          animation: 'mesh-flow 8s ease-in-out infinite'
        }}></div>
      </div>

      {/* Floating elements layer */}
      <FloatingElements />
      
      {/* Network grid layer */}
      <NetworkGrid />
      
      {/* Business charts layer */}
      <BusinessCharts />
      
      {/* Data stream layer */}
      <DataStream />

      {/* Organized icon grid system */}
      <IconGrid />

      {/* Content overlay with enhanced styling */}
      <div className="relative h-full flex items-center justify-center p-12 z-10">
        <div className="text-center text-white space-y-8 max-w-lg">
          {/* Main logo with glow effect */}
          <div className="relative mb-12">
            <div className="w-40 h-40 mx-auto relative">
              {/* Glow rings */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/30 to-cyan-400/30 animate-ping"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-pulse"></div>
              
              {/* Main logo container */}
              <div className="relative w-full h-full bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-2xl">
                <span className="text-6xl font-bold text-white drop-shadow-2xl">ق</span>
              </div>
              
              {/* Floating particles around logo */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/60 rounded-full animate-ping"
                  style={{
                    top: `${20 + Math.sin(i * 0.785) * 60 + 50}%`,
                    left: `${20 + Math.cos(i * 0.785) * 60 + 50}%`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Enhanced text content */}
          <div className="space-y-6 backdrop-blur-sm bg-white/5 rounded-2xl p-8 border border-white/10">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
              منصة قيود للمحاسبة
            </h2>
            <p className="text-xl text-white/90 leading-relaxed drop-shadow-lg">
              النظام الأول لإدارة الأعمال والمحاسبة في المملكة العربية السعودية
            </p>
            
            {/* Enhanced features with icons */}
            <div className="mt-8 space-y-4">
              {[
                { text: 'إدارة مالية شاملة ومتطورة', icon: '💼' },
                { text: 'تقارير تحليلية ذكية ومتقدمة', icon: '📊' },
                { text: 'أمان وموثوقية على مستوى عالمي', icon: '🔒' },
                { text: 'دعم فني متخصص على مدار الساعة', icon: '🎯' }
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-center space-x-3 rtl:space-x-reverse text-white/80 animate-fade-in"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  <div className="text-2xl animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                    {feature.icon}
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Call to action indicators */}
            <div className="mt-8 flex justify-center space-x-4 rtl:space-x-reverse">
              {['البدء الآن', 'تجربة مجانية', 'تعرف أكثر'].map((text, i) => (
                <div 
                  key={i}
                  className="px-4 py-2 bg-white/10 rounded-full text-xs text-white/70 border border-white/20 backdrop-blur-sm animate-pulse"
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mesh-flow {
          0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(0deg); }
          50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
      `}</style>
    </div>
  );
};

export default EnhancedBackground;