import React from 'react';

const FloatingElements = () => {
  const floatingShapes = [
    { type: 'circle', size: 60, x: 15, y: 20, delay: 0, duration: 8 },
    { type: 'square', size: 40, x: 85, y: 15, delay: 1, duration: 10 },
    { type: 'triangle', size: 50, x: 10, y: 70, delay: 2, duration: 9 },
    { type: 'hexagon', size: 45, x: 90, y: 80, delay: 1.5, duration: 7 },
    { type: 'diamond', size: 35, x: 70, y: 30, delay: 0.5, duration: 11 }
  ];

  const lightOrbs = [...Array(15)].map((_, i) => ({
    id: i,
    size: Math.random() * 20 + 10,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.4 + 0.1
  }));

  const sparkles = [...Array(25)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 3 + 2
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Floating geometric shapes */}
      {floatingShapes.map((shape, index) => (
        <div
          key={index}
          className="absolute opacity-20"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            animationDelay: `${shape.delay}s`,
            animation: `float-${shape.type} ${shape.duration}s ease-in-out infinite alternate`
          }}
        >
          {shape.type === 'circle' && (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/10 backdrop-blur-sm border border-white/10 shadow-2xl" />
          )}
          {shape.type === 'square' && (
            <div className="w-full h-full bg-gradient-to-br from-purple-400/30 to-pink-400/10 backdrop-blur-sm border border-white/10 shadow-2xl rotate-45" />
          )}
          {shape.type === 'triangle' && (
            <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-yellow-400/30 shadow-2xl" 
                 style={{ 
                   borderLeftWidth: `${shape.size/2}px`, 
                   borderRightWidth: `${shape.size/2}px`, 
                   borderBottomWidth: `${shape.size}px` 
                 }} />
          )}
          {shape.type === 'hexagon' && (
            <div className="w-full h-full bg-gradient-to-br from-green-400/30 to-emerald-400/10 backdrop-blur-sm border border-white/10 shadow-2xl" 
                 style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
          )}
          {shape.type === 'diamond' && (
            <div className="w-full h-full bg-gradient-to-br from-orange-400/30 to-red-400/10 backdrop-blur-sm border border-white/10 shadow-2xl rotate-45" />
          )}
        </div>
      ))}

      {/* Glowing orbs */}
      {lightOrbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full animate-pulse"
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: `radial-gradient(circle, rgba(255,255,255,${orb.opacity}) 0%, rgba(59,130,246,${orb.opacity * 0.5}) 50%, transparent 100%)`,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${orb.size}px rgba(255,255,255,${orb.opacity * 0.5})`
          }}
        />
      ))}

      {/* Sparkle effects */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute animate-ping"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${sparkle.duration}s`
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="white"
            className="drop-shadow-lg"
          >
            <path d="M12 0l2.598 6.857L22 9.455l-6.857 2.598L12 24l-2.598-6.857L2 14.545l6.857-2.598L12 0z" />
          </svg>
        </div>
      ))}

      {/* Floating code snippets */}
      <div className="absolute top-1/3 left-8 opacity-30">
        <div className="space-y-2 font-mono text-xs text-white/50">
          {['SELECT * FROM accounts', 'UPDATE balance SET...', 'INSERT INTO transactions'].map((code, i) => (
            <div
              key={i}
              className="bg-white/5 rounded px-2 py-1 backdrop-blur-sm animate-pulse"
              style={{ 
                animationDelay: `${i * 0.5}s`,
                animationDuration: '3s'
              }}
            >
              {code}
            </div>
          ))}
        </div>
      </div>

      {/* Floating currency symbols */}
      <div className="absolute bottom-1/3 right-12">
        {['﷼', '$', '€', '£'].map((symbol, i) => (
          <div
            key={i}
            className="absolute text-2xl text-white/20 animate-bounce"
            style={{
              left: `${i * 15}px`,
              top: `${i * 10}px`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: '4s'
            }}
          >
            {symbol}
          </div>
        ))}
      </div>

      {/* Light rays */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"
            style={{
              width: '200px',
              height: '2px',
              top: `${20 + i * 15}%`,
              left: `${10 + i * 10}%`,
              transform: `rotate(${i * 30}deg)`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '4s'
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float-circle {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          50% { transform: translate(-50%, -50%) translateY(-20px) rotate(180deg); }
        }
        @keyframes float-square {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(45deg); }
          50% { transform: translate(-50%, -50%) translateY(-15px) rotate(225deg); }
        }
        @keyframes float-triangle {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          50% { transform: translate(-50%, -50%) translateY(-25px) rotate(60deg); }
        }
        @keyframes float-hexagon {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          50% { transform: translate(-50%, -50%) translateY(-18px) rotate(120deg); }
        }
        @keyframes float-diamond {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(45deg); }
          50% { transform: translate(-50%, -50%) translateY(-22px) rotate(135deg); }
        }
      `}</style>
    </div>
  );
};

export default FloatingElements;