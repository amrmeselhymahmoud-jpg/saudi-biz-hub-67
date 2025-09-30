import { useState, useEffect } from 'react';

const DataStream = () => {
  const [streamData, setStreamData] = useState<string[]>([]);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'تم إنشاء فاتورة جديدة', time: '2 دقائق', type: 'success' },
    { id: 2, text: 'دفعة واردة مؤكدة', time: '5 دقائق', type: 'info' },
    { id: 3, text: 'تحديث تقرير شهري', time: '8 دقائق', type: 'warning' }
  ]);

  // Generate random binary data stream
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = Array.from({ length: 20 }, () => 
        Math.random() > 0.5 ? '1' : '0'
      );
      setStreamData(newData);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Rotate notifications
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      setNotifications(prev => {
        const rotated = [...prev.slice(1), prev[0]];
        return rotated.map((notif, index) => ({
          ...notif,
          id: Date.now() + index
        }));
      });
    }, 4000);

    return () => clearInterval(notificationInterval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Matrix-style data rain */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(8)].map((_, column) => (
          <div
            key={column}
            className="absolute top-0 font-mono text-green-400 text-xs"
            style={{
              left: `${10 + column * 10}%`,
              animationDelay: `${column * 0.3}s`
            }}
          >
            {[...Array(20)].map((_, row) => (
              <div
                key={row}
                className="animate-pulse"
                style={{
                  animationDelay: `${row * 0.1}s`,
                  animationDuration: '2s'
                }}
              >
                {Math.random() > 0.7 ? (Math.random() > 0.5 ? '1' : '0') : ''}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Live data terminal */}
      <div className="absolute top-8 left-8">
        <div className="bg-black/80 rounded-lg p-4 border border-green-400/50 backdrop-blur-sm shadow-2xl min-w-[250px]">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs font-mono">LIVE DATA STREAM</span>
          </div>
          
          <div className="space-y-1 font-mono text-xs">
            <div className="text-green-300">
              {'>'} تحليل البيانات: 
              <span className="text-white ml-2">{streamData.slice(0, 8).join('')}</span>
            </div>
            <div className="text-blue-300">
              {'>'} معالجة الطلبات: 
              <span className="text-white ml-2">{streamData.slice(8, 16).join('')}</span>
            </div>
            <div className="text-yellow-300">
              {'>'} تحديث قاعدة البيانات: 
              <span className="text-white ml-2">{streamData.slice(16, 20).join('')}</span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center space-x-2 rtl:space-x-reverse">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-4 bg-green-400 animate-pulse"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: `${Math.random() * 16 + 4}px`
                  }}
                />
              ))}
            </div>
            <span className="text-green-400 text-xs">CPU: 67%</span>
          </div>
        </div>
      </div>

      {/* Notification stream */}
      <div className="absolute top-32 right-8 space-y-3">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`
              bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/20 shadow-lg
              transition-all duration-500 transform
              ${index === 0 ? 'scale-100 opacity-100' : 'scale-95 opacity-70'}
              animate-slide-in-right
            `}
            style={{ 
              animationDelay: `${index * 0.2}s`,
              minWidth: '200px'
            }}
          >
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <div className={`
                w-2 h-2 rounded-full mt-1 animate-pulse
                ${notification.type === 'success' ? 'bg-green-400' : 
                  notification.type === 'info' ? 'bg-blue-400' : 'bg-yellow-400'}
              `} />
              <div className="flex-1">
                <p className="text-white text-xs">{notification.text}</p>
                <p className="text-white/50 text-xs mt-1">منذ {notification.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System logs ticker */}
      <div className="absolute bottom-8 left-0 right-0">
        <div className="bg-black/60 p-2 backdrop-blur-sm border-t border-white/10">
          <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs font-mono text-green-400 animate-marquee">
            <span>● تم تحديث النظام بنجاح</span>
            <span>● معالجة 1,247 عملية</span>
            <span>● نسخ احتياطي آخر: 15:32</span>
            <span>● حالة الخادم: طبيعية</span>
            <span>● اتصالات نشطة: 89</span>
            <span>● استخدام الذاكرة: 64%</span>
          </div>
        </div>
      </div>

      {/* Floating status indicators */}
      <div className="absolute bottom-32 right-8 space-y-2">
        {[
          { label: 'الأمان', status: 'محمي', color: 'bg-green-500' },
          { label: 'الشبكة', status: 'مستقر', color: 'bg-blue-500' },
          { label: 'التحديث', status: 'آخر', color: 'bg-yellow-500' },
          { label: 'النسخ', status: 'مكتمل', color: 'bg-purple-500' }
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center space-x-2 rtl:space-x-reverse bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/20 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            <div className={`w-2 h-2 rounded-full ${item.color} animate-ping`} />
            <span className="text-white/80 text-xs">{item.label}:</span>
            <span className="text-white text-xs font-medium">{item.status}</span>
          </div>
        ))}
      </div>

      {/* Data flow visualization */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-32 h-32">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 border-2 border-white/20 rounded-full animate-ping"
              style={{
                animationDelay: `${i * 0.5}s`,
                animationDuration: '3s',
                transform: `scale(${1 + i * 0.3})`
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-spin" style={{ animationDuration: '3s' }}>
              <div className="w-full h-full rounded-full bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        @keyframes slide-in-right {
          0% { transform: translateX(100%) scale(0.8); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DataStream;