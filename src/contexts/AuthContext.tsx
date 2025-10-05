import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = () => {
      try {
        // Check localStorage for demo session
        const storedSession = localStorage.getItem('demo_session');

        if (storedSession) {
          const sessionData = JSON.parse(storedSession);

          // Check if session is still valid
          if (sessionData.expires_at > Date.now()) {
            if (mounted) {
              setSession(sessionData as Session);
              setUser(sessionData.user as User);
            }
          } else {
            // Clear expired session
            localStorage.removeItem('demo_session');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demo_session') {
        if (e.newValue) {
          const sessionData = JSON.parse(e.newValue);
          setSession(sessionData as Session);
          setUser(sessionData.user as User);
        } else {
          setSession(null);
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signOut = async () => {
    try {
      // Clear demo session
      localStorage.removeItem('demo_session');
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};