import { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextType {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  ar: {
    // Header
    'header.about': 'عن قيود',
    'header.features': 'المزايا',
    'header.pricing': 'الأسعار',
    'header.login': 'تسجيل الدخول',
    'header.freeTrial': 'ابدأ تجربتنا المجانية',
    'header.notification': 'يجب تسجيل الدخول أو الاشتراك قبل المتابعة',
    
    // Login
    'login.welcome': 'مرحبا بكم في قيود',
    'login.email': 'البريد الإلكتروني',
    'login.password': 'كلمة المرور',
    'login.forgotPassword': 'نسيت كلمة المرور؟',
    'login.rememberMe': 'تذكرني',
    'login.loginButton': 'تسجيل الدخول',
    'login.freeTrialTitle': 'تجربة مجانية',
    'login.freeTrialDesc': 'لم تسجل بعد؟ جرب قيود مجاناً',
    'login.startFreeTrial': 'ابدأ تجربتك المجانية',
    'login.emailPlaceholder': 'name@gmail.com مثال:',
    'login.passwordPlaceholder': 'يرجى إدخال كلمة المرور',
    'login.logging': 'جاري تسجيل الدخول...',
    
    // Messages
    'message.dataError': 'خطأ في البيانات',
    'message.emailPasswordRequired': 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
    'message.loginSuccess': 'تم تسجيل الدخول بنجاح',
    'message.welcomeQoyod': 'مرحباً بك في منصة قيود',
    'message.loginError': 'خطأ في تسجيل الدخول',
    'message.tryAgain': 'يرجى المحاولة مرة أخرى',
    'message.passwordReset': 'استعادة كلمة المرور',
    'message.passwordResetDesc': 'سيتم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني',
    'message.languageChanged': 'تم تغيير اللغة إلى',
    'message.notificationClosed': 'تم إغلاق التنبيه',
    'message.notificationHidden': 'تم إخفاء رسالة التنبيه',
  },
  en: {
    // Header
    'header.about': 'About Qoyod',
    'header.features': 'Features',
    'header.pricing': 'Pricing',
    'header.login': 'Login',
    'header.freeTrial': 'Start Free Trial',
    'header.notification': 'Please login or sign up to continue',
    
    // Login
    'login.welcome': 'Welcome to Qoyod',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.forgotPassword': 'Forgot Password?',
    'login.rememberMe': 'Remember Me',
    'login.loginButton': 'Login',
    'login.freeTrialTitle': 'Free Trial',
    'login.freeTrialDesc': 'Not registered yet? Try Qoyod for free',
    'login.startFreeTrial': 'Start Your Free Trial',
    'login.emailPlaceholder': 'e.g: name@gmail.com',
    'login.passwordPlaceholder': 'Please enter your password',
    'login.logging': 'Logging in...',
    
    // Messages
    'message.dataError': 'Data Error',
    'message.emailPasswordRequired': 'Please enter email and password',
    'message.loginSuccess': 'Login Successful',
    'message.welcomeQoyod': 'Welcome to Qoyod Platform',
    'message.loginError': 'Login Error',
    'message.tryAgain': 'Please try again',
    'message.passwordReset': 'Password Reset',
    'message.passwordResetDesc': 'Password reset link will be sent to your email',
    'message.languageChanged': 'Language changed to',
    'message.notificationClosed': 'Notification closed',
    'message.notificationHidden': 'Notification message hidden',
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['ar']] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};