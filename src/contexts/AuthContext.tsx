import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  role_name: string;
  role_description: string;
}

interface UserPermission {
  permission_name: string;
  resource: string;
  action: string;
}

interface UserInfo {
  user_id: string;
  email: string;
  full_name: string;
  roles: UserRole[];
  permissions: UserPermission[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userInfo: UserInfo | null;
  signOut: () => Promise<void>;
  hasRole: (roleName: string) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  refreshUserInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userInfo: null,
  signOut: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
  refreshUserInfo: async () => {}
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
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const fetchUserInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_info', { p_user_id: userId });

      if (error) {
        console.error('Error fetching user info:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  };

  const refreshUserInfo = async () => {
    if (user?.id) {
      const info = await fetchUserInfo(user.id);
      setUserInfo(info);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        }

        if (mounted && initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);

          const info = await fetchUserInfo(initialSession.user.id);
          setUserInfo(info);

          await supabase.rpc('create_active_session', {
            p_user_id: initialSession.user.id,
            p_session_token: initialSession.access_token
          });
        } else if (mounted) {
          setSession(null);
          setUser(null);
          setUserInfo(null);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        (async () => {
          console.log('Auth state changed:', event);

          if (mounted) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);

            if (currentSession?.user) {
              const info = await fetchUserInfo(currentSession.user.id);
              setUserInfo(info);

              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await supabase.rpc('create_active_session', {
                  p_user_id: currentSession.user.id,
                  p_session_token: currentSession.access_token
                });
              }

              localStorage.setItem('qoyod-session', JSON.stringify({
                access_token: currentSession.access_token,
                refresh_token: currentSession.refresh_token,
                expires_at: currentSession.expires_at
              }));
            } else {
              setUserInfo(null);
              localStorage.removeItem('qoyod-session');

              if (event === 'SIGNED_OUT' && user?.id) {
                await supabase.rpc('end_session', { p_user_id: user.id });
              }
            }
          }
        })();
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      if (user?.id) {
        await supabase.rpc('end_session', { p_user_id: user.id });
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }

      setSession(null);
      setUser(null);
      setUserInfo(null);
      localStorage.removeItem('qoyod-session');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const hasRole = (roleName: string): boolean => {
    if (!userInfo?.roles) return false;
    return userInfo.roles.some(role => role.role_name === roleName);
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!userInfo?.permissions) return false;
    return userInfo.permissions.some(
      perm => perm.resource === resource && perm.action === action
    );
  };

  const value = {
    user,
    session,
    loading,
    userInfo,
    signOut,
    hasRole,
    hasPermission,
    refreshUserInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
