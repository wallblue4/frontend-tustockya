import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mapeo de roles de la API a los tipos de la aplicación
const mapApiRoleToUserRole = (apiRole: string): UserRole => {
  const roleMapping: { [key: string]: UserRole } = {
    'administrador': 'administrador',
    'superuser': 'superuser',
    'bodeguero': 'bodeguero',
    'seller': 'seller',
    'corredor': 'corredor'
  };
  
  return roleMapping[apiRole] || 'seller'; // fallback a seller si no encuentra el rol
};

// Función para mapear la respuesta de la API al tipo User
const mapApiUserToUser = (apiUser: any, token: string, tokenType: string): User => {
  return {
    id: apiUser.id.toString(),
    name: `${apiUser.first_name} ${apiUser.last_name}`.trim(),
    email: apiUser.email,
    role: mapApiRoleToUserRole(apiUser.role),
    token: token,
    token_type: tokenType,
    location_id: apiUser.location_id,
    avatar: undefined,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        
        try {
          // Verificar que el token sigue siendo válido
          const currentUser = await authAPI.getCurrentUser();
          
          // Mapear la respuesta actualizada de la API
          const mappedUser = mapApiUserToUser(currentUser, storedToken, userData.token_type || 'bearer');
          setUser(mappedUser);
          
          // Actualizar localStorage con datos actualizados
          localStorage.setItem('user', JSON.stringify(mappedUser));
          
        } catch (error) {
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
      const response = await authAPI.login({ email, password });
      
      if (response.access_token && response.user) {
        // Mapear la respuesta de la API al tipo User
        const userData = mapApiUserToUser(
          response.user, 
          response.access_token, 
          response.token_type
        );
        
        // Guardar en estado y localStorage
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.access_token);
        
        console.log('✅ Login exitoso:', userData);
        console.log('🔍 Rol del usuario:', userData.role);
        return userData;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }

    } catch (error: any) {
      console.error('❌ Error en login:', error);
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.log('🚪 Sesión cerrada');
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    const hasAccess = roles.includes(user.role);
    console.log(`🔐 Verificando acceso: usuario tiene rol "${user.role}", se requiere uno de [${roles.join(', ')}] = ${hasAccess}`);
    return hasAccess;
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