import React, { useState, useEffect } from 'react';

const BusinessCharts = () => {
  const [animatedData, setAnimatedData] = useState({
    revenue: 0,
    growth: 0,
    users: 0,
    satisfaction: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedData({
        revenue: Math.floor(Math.random() * 5000000) + 1000000,
        growth: Math.floor(Math.random() * 40) + 10,
        users: Math.floor(Math.random() * 10000) + 5000,
        satisfaction: Math.floor(Math.random() * 20) + 85
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Advanced Bar Chart */}
      <div className="absolute top-16 left-8">
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/20 shadow-2xl">
          <div className="text-white/60 text-xs mb-2">الإيرادات الشهرية</div>
          <div className="flex items-end space-x-1 h-16">
            {[65, 78, 45, 89, 56, 92, 73, 85].map((height, i) => (
              <div key={i} className="relative">
                <div
                  className="w-3 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t animate-pulse shadow-lg"
                  style={{
                    height: `${height * 0.6}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '2s'
                  }}
                />
                <div 
                  className="absolute -top-1 w-3 h-1 bg-white/80 rounded-full animate-ping"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Metrics Dashboard */}
      <div className="absolute top-20 right-8 space-y-3">
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-md border border-white/20 shadow-lg min-w-[140px]">
          <div className="text-white/60 text-xs">إجمالي الإيرادات</div>
          <div className="text-white font-bold text-lg flex items-center">
            {animatedData.revenue.toLocaleString()} 
            <span className="text-xs mr-1">ر.س</span>
          </div>
          <div className="text-green-400 text-xs flex items-center">
            ↗ +{animatedData.growth}% هذا الشهر
          </div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-md border border-white/20 shadow-lg">
          <div className="text-white/60 text-xs">المستخدمون النشطون</div>
          <div className="text-white font-bold text-lg">
            {animatedData.users.toLocaleString()}
          </div>
          <div className="text-blue-400 text-xs">متصل الآن</div>
        </div>

        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-md border border-white/20 shadow-lg">
          <div className="text-white/60 text-xs">رضا العملاء</div>
          <div className="text-white font-bold text-lg flex items-center">
            {animatedData.satisfaction}%
            <div className="mr-2 w-12 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${animatedData.satisfaction}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Circular Progress */}
      <div className="absolute bottom-32 left-12">
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/20 shadow-2xl">
          <div className="text-white/60 text-xs mb-2 text-center">معدل الأداء</div>
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="white"
                strokeWidth="6"
                fill="none"
                opacity="0.1"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="url(#gradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                className="animate-pulse"
                strokeDasharray="201"
                strokeDashoffset="50"
                style={{ animationDuration: '3s' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-sm font-bold">87%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Line Chart */}
      <div className="absolute bottom-20 right-16">
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/20 shadow-2xl">
          <div className="text-white/60 text-xs mb-2">اتجاه النمو</div>
          <svg width="140" height="80" viewBox="0 0 140 80" className="opacity-90">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="140" height="80" fill="url(#grid)" />
            
            {/* Growth line */}
            <path
              d="M15,65 Q35,45 55,40 T95,25 T125,30"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              fill="none"
              className="animate-pulse"
              style={{ animationDuration: '4s' }}
            />
            
            {/* Area under curve */}
            <path
              d="M15,65 Q35,45 55,40 T95,25 T125,30 L125,80 L15,80 Z"
              fill="url(#areaGradient)"
              opacity="0.3"
            />
            
            {/* Data points */}
            {[
              { x: 15, y: 65 },
              { x: 55, y: 40 },
              { x: 95, y: 25 },
              { x: 125, y: 30 }
            ].map((point, i) => (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="white"
                  className="animate-pulse"
                  style={{ animationDelay: `${i * 0.5}s` }}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="8"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                  opacity="0.5"
                  className="animate-ping"
                  style={{ animationDelay: `${i * 0.5}s` }}
                />
              </g>
            ))}
            
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Floating trend indicators */}
      <div className="absolute top-1/2 left-4 space-y-2">
        {[
          { trend: '↗', value: '+24%', color: 'text-green-400' },
          { trend: '↗', value: '+15%', color: 'text-blue-400' },
          { trend: '↘', value: '-3%', color: 'text-red-400' }
        ].map((item, i) => (
          <div 
            key={i}
            className={`flex items-center space-x-2 rtl:space-x-reverse bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/20 animate-bounce ${item.color}`}
            style={{ 
              animationDelay: `${i * 0.4}s`,
              animationDuration: '3s'
            }}
          >
            <span className="text-lg">{item.trend}</span>
            <span className="text-xs font-mono">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessCharts;