import React from 'react';

const NetworkGrid = () => {
  const gridNodes = [
    { x: 10, y: 15, size: 'large', pulse: true },
    { x: 25, y: 30, size: 'medium', pulse: false },
    { x: 45, y: 20, size: 'small', pulse: true },
    { x: 65, y: 35, size: 'large', pulse: false },
    { x: 80, y: 25, size: 'medium', pulse: true },
    { x: 15, y: 60, size: 'medium', pulse: false },
    { x: 35, y: 75, size: 'small', pulse: true },
    { x: 55, y: 65, size: 'large', pulse: false },
    { x: 75, y: 80, size: 'medium', pulse: true },
    { x: 90, y: 70, size: 'small', pulse: false },
    { x: 30, y: 50, size: 'large', pulse: true },
    { x: 70, y: 55, size: 'medium', pulse: false }
  ];

  const connections = [
    { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
    { from: 0, to: 5 }, { from: 5, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 8 },
    { from: 1, to: 10 }, { from: 10, to: 11 }, { from: 3, to: 11 }, { from: 7, to: 9 }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Background grid pattern */}
        <defs>
          <pattern id="networkGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.1" opacity="0.3"/>
          </pattern>
          
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Connection line gradient */}
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.8)" />
            <stop offset="50%" stopColor="rgba(6,182,212,0.6)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.4)" />
          </linearGradient>
          
          {/* Pulse animation gradient */}
          <radialGradient id="pulseGradient">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="70%" stopColor="rgba(59,130,246,0.4)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        
        <rect width="100" height="100" fill="url(#networkGrid)" />

        {/* Connection lines with flow animation */}
        <g className="opacity-60">
          {connections.map((connection, index) => {
            const fromNode = gridNodes[connection.from];
            const toNode = gridNodes[connection.to];
            return (
              <g key={index}>
                {/* Main connection line */}
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="url(#connectionGradient)"
                  strokeWidth="0.3"
                  filter="url(#glow)"
                  className="animate-pulse"
                  style={{ 
                    animationDelay: `${index * 0.2}s`,
                    animationDuration: '3s'
                  }}
                />
                
                {/* Data flow particles */}
                <circle r="0.5" fill="white" opacity="0.8">
                  <animateMotion
                    dur={`${3 + Math.random() * 2}s`}
                    repeatCount="indefinite"
                    begin={`${index * 0.3}s`}
                  >
                    <mpath xlinkHref={`#path${index}`}/>
                  </animateMotion>
                </circle>
                
                {/* Hidden path for animation */}
                <path
                  id={`path${index}`}
                  d={`M${fromNode.x},${fromNode.y} L${toNode.x},${toNode.y}`}
                  fill="none"
                  stroke="none"
                />
              </g>
            );
          })}
        </g>

        {/* Network nodes */}
        <g>
          {gridNodes.map((node, index) => {
            const nodeSize = node.size === 'large' ? 1.5 : node.size === 'medium' ? 1 : 0.7;
            return (
              <g key={index}>
                {/* Outer glow ring for pulsing nodes */}
                {node.pulse && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeSize * 3}
                    fill="url(#pulseGradient)"
                    className="animate-ping"
                    style={{ 
                      animationDelay: `${index * 0.15}s`,
                      animationDuration: '2s'
                    }}
                  />
                )}
                
                {/* Node ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeSize + 0.3}
                  fill="none"
                  stroke="white"
                  strokeWidth="0.2"
                  opacity="0.6"
                  className="animate-pulse"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    animationDuration: '1.5s'
                  }}
                />
                
                {/* Main node */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeSize}
                  fill="white"
                  filter="url(#glow)"
                  className="animate-pulse"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              </g>
            );
          })}
        </g>

        {/* Signal waves */}
        <g className="opacity-30">
          {[...Array(4)].map((_, i) => (
            <g key={i}>
              <circle
                cx="50"
                cy="50"
                r={15 + i * 8}
                fill="none"
                stroke="white"
                strokeWidth="0.5"
                className="animate-ping"
                style={{ 
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '4s'
                }}
              />
            </g>
          ))}
        </g>
      </svg>

      {/* Network activity monitor */}
      <div className="absolute bottom-8 left-32">
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20 text-white">
          <div className="text-xs opacity-60 mb-2">نشاط الشبكة</div>
          <div className="flex space-x-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t animate-pulse"
                style={{
                  height: `${Math.random() * 20 + 5}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGrid;