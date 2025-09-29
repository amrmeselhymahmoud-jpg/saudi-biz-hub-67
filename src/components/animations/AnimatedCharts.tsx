import React from 'react';

const AnimatedCharts = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Bar Chart Animation */}
      <div className="absolute top-20 left-12">
        <div className="flex items-end space-x-1 h-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-3 bg-white/30 rounded-t animate-pulse"
              style={{
                height: `${Math.random() * 60 + 20}px`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Circular Progress */}
      <div className="absolute top-32 right-16">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="white"
              strokeWidth="4"
              fill="none"
              opacity="0.2"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="white"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              className="animate-pulse"
              strokeDasharray="175"
              strokeDashoffset="45"
              opacity="0.8"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold">75%</span>
          </div>
        </div>
      </div>

      {/* Growth Line Chart */}
      <div className="absolute bottom-32 left-20">
        <svg width="120" height="60" viewBox="0 0 120 60" className="opacity-60">
          <path
            d="M10,50 Q30,30 50,35 T90,20 T110,25"
            stroke="white"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
            style={{ animationDuration: '3s' }}
          />
          {/* Data points */}
          {[
            { x: 10, y: 50 },
            { x: 50, y: 35 },
            { x: 90, y: 20 },
            { x: 110, y: 25 }
          ].map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="white"
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </svg>
      </div>

      {/* Pie Chart Segments */}
      <div className="absolute bottom-20 right-24">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="white"
              strokeWidth="3"
              strokeDasharray="60 40"
              className="animate-spin"
              style={{ animationDuration: '8s' }}
              opacity="0.7"
            />
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="white"
              strokeWidth="3"
              strokeDasharray="40 60"
              strokeDashoffset="60"
              className="animate-spin"
              style={{ animationDuration: '8s', animationDirection: 'reverse' }}
              opacity="0.4"
            />
          </svg>
        </div>
      </div>

      {/* Mini trending arrows */}
      <div className="absolute top-1/2 left-8 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2 text-white/60">
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              <path d="M7 14l5-5 5 5" strokeWidth="2" />
            </svg>
            <div className="w-8 h-1 bg-white/30 rounded animate-pulse" style={{ animationDelay: `${i * 0.4}s` }}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnimatedCharts;