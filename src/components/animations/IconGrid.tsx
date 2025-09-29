import React from 'react';

const IconGrid = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Central hub with Qoyod logo only */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Main logo container */}
          <div className="w-20 h-20 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-2xl z-10 relative">
            <span className="text-2xl font-bold text-white drop-shadow-lg">ق</span>
          </div>
          
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

      {/* Platform label */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/5 rounded-full px-6 py-3 backdrop-blur-sm border border-white/10">
          <span className="text-white/80 text-sm font-medium">منصة قيود المحاسبة</span>
        </div>
      </div>
    </div>
  );
};

export default IconGrid;