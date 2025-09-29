import React from 'react';
import AnimatedCharts from './AnimatedCharts';
import NetworkAnimation from './NetworkAnimation';
import ParticleSystem from './ParticleSystem';
import DigitalElements from './DigitalElements';

const AnimatedBackground = () => {
  return (
    <div className="hidden lg:block flex-1 relative overflow-hidden">
      {/* Dynamic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-qoyod-navy via-primary to-qoyod-light-blue animate-pulse"></div>
      
      {/* Animated overlay effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
      
      {/* Particle system */}
      <ParticleSystem />
      
      {/* Network connections */}
      <NetworkAnimation />
      
      {/* Animated charts */}
      <AnimatedCharts />
      
      {/* Digital elements */}
      <DigitalElements />
      
      {/* Content overlay */}
      <div className="relative h-full flex items-center justify-center p-12 z-10">
        <div className="text-center text-white space-y-6 backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20">
          <div className="w-32 h-32 bg-gradient-to-br from-white/30 to-white/10 rounded-full mx-auto flex items-center justify-center mb-8 shadow-2xl backdrop-blur-md border border-white/30">
            <span className="text-4xl font-bold text-white drop-shadow-lg">ق</span>
          </div>
          <h2 className="text-3xl font-bold drop-shadow-lg">منصة قيود للمحاسبة</h2>
          <p className="text-xl opacity-90 max-w-md drop-shadow-md">
            النظام الأول لإدارة الأعمال والمحاسبة في المملكة العربية السعودية
          </p>
          
          {/* Animated features list */}
          <div className="mt-8 space-y-3 text-sm opacity-80">
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse animate-fade-in">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>إدارة مالية شاملة</span>
            </div>
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse animate-fade-in" style={{animationDelay: '0.5s'}}>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span>تقارير تحليلية متقدمة</span>
            </div>
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse animate-fade-in" style={{animationDelay: '1s'}}>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <span>أمان وموثوقية عالية</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedBackground;