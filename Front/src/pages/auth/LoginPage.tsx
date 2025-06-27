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
      const user = await login(email, password);
      // Redirect based on user role
      switch (user.role) {
        case 'superuser':
          navigate('/superuser');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'warehouse':
          navigate('/warehouse');
          break;
        case 'seller':
          navigate('/sellerDashboard');
          break;
        case 'runner':
          navigate('/runner');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError('Correo o contraseña inválidos. Prueba con admin@tennis.com y contraseña "password"');
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogins = [
    { role: 'Administrador', email: 'admin@tennis.com' },
    { role: 'Superusuario', email: 'super@tennis.com' },
    { role: 'Bodeguero', email: 'warehouse@tennis.com' },
    { role: 'Vendedor', email: 'seller@tennis.com' },
    { role: 'Repartidor', email: 'runner@tennis.com' },
  ];

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
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
              Accede a tu panel de TennisHub
            </p>
          </div>
          
          {error && (
            <div className="bg-error/10 text-error text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
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
            >
              Iniciar sesión
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Cuentas de demostración</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              {demoLogins.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => handleDemoLogin(demo.email)}
                >
                  {demo.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};