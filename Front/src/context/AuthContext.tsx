import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authAPI } from '../services/api'; //CAMBIO

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demonstration
const MOCK_USERS = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@tennis.com',
    role: 'admin' as UserRole,
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: '2',
    name: 'Super User',
    email: 'super@tennis.com',
    role: 'superuser' as UserRole,
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: '3',
    name: 'Warehouse Manager',
    email: 'warehouse@tennis.com',
    role: 'warehouse' as UserRole,
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: '4',
    name: 'Seller',
    email: 'seller@tennis.com',
    role: 'seller' as UserRole,
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: '5',
    name: 'Runner',
    email: 'runner@tennis.com',
    role: 'runner' as UserRole,
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    //const storedUser = localStorage.getItem('user');
    //if (storedUser) {
    //  setUser(JSON.parse(storedUser));
    //}
    //setLoading(false);

    checkAuthStatus();  //CAMBIO
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      // Verificar si hay un usuario guardado en localStorage
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        
        // Verificar que el token sigue siendo válido llamando al backend
        try {
          const currentUser = await authAPI.getCurrentUser();
          
          // Si la llamada es exitosa, el token es válido
          setUser({
            ...userData,
            ...currentUser,
            token: storedToken
          });
        } catch (error) {
          // Si falla, el token expiró o es inválido
          console.log('Token inválido, limpiando sesión');
          logout();
        }
      }
    } catch (error) {
      console.error('Error verificando estado de autenticación:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      const mockUser = MOCK_USERS.find((u) => u.email === email);
      if (mockUser && password === 'password') {
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return mockUser;
      } else {
        throw new Error('Invalid credentials');
      }

      /*const response = await authAPI.login({ email, password }); //CAMBIO
      if (response.access_token && response.user) {
        const userData: User = {
          ...response.user,
          token: response.access_token,
          token_type: response.token_type
        };
        
        // Guardar en estado y localStorage
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.access_token);
        
        console.log('✅ Login exitoso:', userData);
        return userData ;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }*/

    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      // Limpiar cualquier dato previo en caso de error
      logout();
      
      // Re-lanzar el error para que el componente pueda manejarlo
      throw error;
    } finally {
      setLoading(false);
    }

    
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasRole = (roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};