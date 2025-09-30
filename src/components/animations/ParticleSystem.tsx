const ParticleSystem = () => {
  const particles = [...Array(20)].map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.6 + 0.2
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* Large floating orbs */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full bg-gradient-to-r from-white/20 to-white/5 animate-ping"
          style={{
            width: `${40 + i * 10}px`,
            height: `${40 + i * 10}px`,
            left: `${20 + i * 15}%`,
            top: `${30 + i * 10}%`,
            animationDuration: `${4 + i}s`,
            animationDelay: `${i * 0.8}s`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* Bubble trail animation */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
        {[...Array(8)].map((_, i) => (
          <div
            key={`bubble-${i}`}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${i * 10 - 40}px`,
              bottom: `${i * 20}px`,
              animationName: 'float',
              animationDuration: '3s',
              animationDelay: `${i * 0.3}s`,
              animationIterationCount: 'infinite',
              animationDirection: 'alternate'
            }}
          />
        ))}
      </div>

      {/* Sparkle effects */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`
          }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="white"
            className="animate-ping"
            style={{ animationDuration: '2s' }}
          >
            <path d="M12 0l3.09 6.26L22 9l-6.91 2.74L12 18l-3.09-6.26L2 9l6.91-2.74L12 0z" />
          </svg>
        </div>
      ))}

      {/* Light rays */}
      <div className="absolute top-0 right-0 w-full h-full">
        <div 
          className="absolute top-1/4 right-1/4 w-32 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-45 animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div 
          className="absolute bottom-1/3 left-1/4 w-24 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 animate-pulse"
          style={{ animationDuration: '3s', animationDelay: '1s' }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-20px) scale(1.1);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
};

export default ParticleSystem;