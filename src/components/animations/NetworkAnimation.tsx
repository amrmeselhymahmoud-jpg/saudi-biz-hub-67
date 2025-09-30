const NetworkAnimation = () => {
  const networkNodes = [
    { x: 20, y: 20, delay: 0 },
    { x: 80, y: 15, delay: 0.5 },
    { x: 15, y: 60, delay: 1 },
    { x: 85, y: 70, delay: 1.5 },
    { x: 50, y: 40, delay: 0.8 },
    { x: 25, y: 85, delay: 2 },
    { x: 75, y: 90, delay: 2.5 }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Connection lines */}
        <g className="opacity-30">
          {/* Dynamic connecting lines */}
          <path
            d={`M ${networkNodes[0].x},${networkNodes[0].y} 
                L ${networkNodes[4].x},${networkNodes[4].y} 
                L ${networkNodes[1].x},${networkNodes[1].y}`}
            stroke="white"
            strokeWidth="0.2"
            fill="none"
            className="animate-pulse"
            style={{ animationDuration: '3s' }}
          />
          <path
            d={`M ${networkNodes[2].x},${networkNodes[2].y} 
                L ${networkNodes[4].x},${networkNodes[4].y} 
                L ${networkNodes[3].x},${networkNodes[3].y}`}
            stroke="white"
            strokeWidth="0.2"
            fill="none"
            className="animate-pulse"
            style={{ animationDuration: '3s', animationDelay: '0.5s' }}
          />
          <path
            d={`M ${networkNodes[5].x},${networkNodes[5].y} 
                L ${networkNodes[4].x},${networkNodes[4].y} 
                L ${networkNodes[6].x},${networkNodes[6].y}`}
            stroke="white"
            strokeWidth="0.2"
            fill="none"
            className="animate-pulse"
            style={{ animationDuration: '3s', animationDelay: '1s' }}
          />
        </g>

        {/* Animated nodes */}
        <g>
          {networkNodes.map((node, index) => (
            <g key={index}>
              {/* Outer glow ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r="2"
                fill="none"
                stroke="white"
                strokeWidth="0.3"
                className="animate-ping"
                style={{ 
                  animationDuration: '2s', 
                  animationDelay: `${node.delay}s` 
                }}
                opacity="0.6"
              />
              {/* Inner core */}
              <circle
                cx={node.x}
                cy={node.y}
                r="0.8"
                fill="white"
                className="animate-pulse"
                style={{ 
                  animationDuration: '1.5s', 
                  animationDelay: `${node.delay}s` 
                }}
                opacity="0.9"
              />
            </g>
          ))}
        </g>

        {/* Data flow animation */}
        <g className="opacity-40">
          {[...Array(4)].map((_, i) => (
            <circle
              key={i}
              r="0.5"
              fill="white"
              className="animate-pulse"
              style={{ animationDuration: '2s', animationDelay: `${i * 0.5}s` }}
            >
              <animateMotion
                dur="4s"
                repeatCount="indefinite"
                begin={`${i * 0.5}s`}
              >
                <path d={`M ${networkNodes[0].x},${networkNodes[0].y} 
                         Q ${networkNodes[4].x},${networkNodes[4].y} 
                         ${networkNodes[3].x},${networkNodes[3].y}`} />
              </animateMotion>
            </circle>
          ))}
        </g>
      </svg>

      {/* Additional floating connection indicators */}
      <div className="absolute top-1/4 right-1/4">
        <div className="relative">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/50 rounded-full animate-ping"
              style={{
                top: `${i * 8}px`,
                left: `${i * 6}px`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Signal wave animation */}
      <div className="absolute bottom-1/3 left-1/3">
        <svg width="30" height="20" viewBox="0 0 30 20" className="opacity-50">
          {[...Array(4)].map((_, i) => (
            <path
              key={i}
              d={`M${5 + i * 5},15 Q${7.5 + i * 5},5 ${10 + i * 5},15`}
              stroke="white"
              strokeWidth="1"
              fill="none"
              className="animate-pulse"
              style={{ 
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default NetworkAnimation;