import React, { useState, useEffect } from 'react';

const DigitalElements = () => {
  const [animatedNumbers, setAnimatedNumbers] = useState({
    revenue: 0,
    growth: 0,
    efficiency: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedNumbers({
        revenue: Math.floor(Math.random() * 999999) + 100000,
        growth: Math.floor(Math.random() * 50) + 15,
        efficiency: Math.floor(Math.random() * 30) + 85
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const digitalIcons = [
    { icon: '📊', x: 85, y: 25, delay: 0 },
    { icon: '💰', x: 15, y: 35, delay: 0.5 },
    { icon: '📈', x: 75, y: 55, delay: 1 },
    { icon: '🔒', x: 25, y: 75, delay: 1.5 },
    { icon: '⚡', x: 90, y: 80, delay: 2 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Animated tech icons */}
      {digitalIcons.map((item, index) => (
        <div
          key={index}
          className="absolute text-2xl animate-bounce"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: '3s'
          }}
        >
          <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
            {item.icon}
          </div>
        </div>
      ))}

      {/* Digital performance metrics */}
      <div className="absolute top-16 right-8 space-y-3">
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20 animate-fade-in">
          <div className="text-white/60 text-xs">الإيرادات</div>
          <div className="text-white font-bold text-sm">
            {animatedNumbers.revenue.toLocaleString()} ر.س
          </div>
        </div>
        
        <div 
          className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20 animate-fade-in"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="text-white/60 text-xs">النمو</div>
          <div className="text-white font-bold text-sm">
            +{animatedNumbers.growth}%
          </div>
        </div>
        
        <div 
          className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20 animate-fade-in"
          style={{ animationDelay: '1s' }}
        >
          <div className="text-white/60 text-xs">الكفاءة</div>
          <div className="text-white font-bold text-sm">
            {animatedNumbers.efficiency}%
          </div>
        </div>
      </div>

      {/* Floating binary code */}
      <div className="absolute left-8 bottom-40 opacity-30">
        <div className="font-mono text-white/40 text-xs space-y-1 animate-pulse">
          <div>101010110</div>
          <div>110101001</div>
          <div>001110101</div>
          <div>101001110</div>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="absolute bottom-16 left-12 space-y-2">
        {['تحليل البيانات', 'معالجة التقارير', 'تحديث النظام'].map((text, i) => (
          <div key={i} className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/60 rounded-full animate-pulse"
                style={{
                  width: `${60 + Math.random() * 40}%`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            </div>
            <span className="text-white/60 text-xs">{text}</span>
          </div>
        ))}
      </div>

      {/* Scanning line effect */}
      <div className="absolute inset-0">
        <div 
          className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"
          style={{
            top: '20%',
            animationDuration: '4s',
            transform: 'translateY(-50%)'
          }}
        />
      </div>

      {/* Matrix-style falling code */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-20">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="text-white/30 font-mono text-xs animate-pulse"
            style={{
              position: 'absolute',
              left: `${i * 8}px`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: '2s'
            }}
          >
            {Math.random().toString(36).substring(2, 8)}
          </div>
        ))}
      </div>

      {/* Clock/time indicator */}
      <div className="absolute top-8 left-8">
        <div className="bg-white/10 rounded-full p-3 backdrop-blur-sm border border-white/20">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" className="animate-spin" style={{ animationDuration: '60s' }}>
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DigitalElements;