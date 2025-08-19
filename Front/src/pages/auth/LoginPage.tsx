import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shovel as Shoe, Mail, Lock } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Layout } from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('🚀 Iniciando login para:', email);
      const user = await login(email, password);
      
      console.log('✅ Usuario logueado:', user);
      console.log('🎯 Rol del usuario:', user.role);
      
      // Redirect based on user role
      switch (user.role) {
        case 'superuser':
          console.log('➡️ Redirigiendo a superuser dashboard');
          navigate('/superuser');
          break;
        case 'administrador':
          console.log('➡️ Redirigiendo a admin dashboard');
          navigate('/admin');
          break;
        case 'bodeguero':
          console.log('➡️ Redirigiendo a warehouse dashboard');
          navigate('/warehouse');
          break;
        case 'seller':
          console.log('➡️ Redirigiendo a seller dashboard');
          navigate('/sellerDashboard');
          break;
        case 'corredor':
          console.log('➡️ Redirigiendo a runner dashboard');
          navigate('/runner');
          break;
        default:
          console.log('⚠️ Rol no reconocido, redirigiendo a home');
          navigate('/');
      }
    } catch (err: any) {
      console.error('❌ Error en login:', err);
      
      // Manejo de errores más específico
      if (err.response && err.response.status === 401) {
        setError('Correo o contraseña incorrectos.');
      } else if (err.response && err.response.status === 403) {
        setError('Tu cuenta está desactivada. Contacta al administrador.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Error de conexión. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout hideFooter>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="flex justify-center">
              <Shoe className="h-12 w-12 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-gray-600">
              Accede a tu panel de TuStockYa
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Correo electrónico"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-5 w-5 text-gray-400" />}
              />
              
              <Input
                label="Contraseña"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-5 w-5 text-gray-400" />}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-primary-dark">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};