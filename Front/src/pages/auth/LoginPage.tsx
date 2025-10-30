import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shovel as Shoe, Mail, Lock } from 'lucide-react';
import LogoImage from '../../Logo/isologo_tustockya-removebg-preview.png';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Layout } from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        case 'boss':
          console.log('➡️ Redirigiendo a boss dashboard');
          navigate('/boss');
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
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-xl shadow-2xl border border-border backdrop-blur-sm">
          <div className="text-center">
            <div className="flex justify-center">
                <img src={LogoImage} alt="TuStockYa" className="h-40 w-90 " />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-foreground">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Accede a tu panel de TuStockYa
            </p>
          </div>
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-lg backdrop-blur-sm">
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
              
              <div className="relative">
                <Input
                  label="Contraseña"
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-5 w-5 text-gray-400" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={`absolute right-3 top-8 focus:outline-none ${showPassword ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    // Ojo abierto, color azul
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  ) : (
                    // Ojo cerrado, color gris
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.94 17.94A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.175-6.125M3 3l18 18" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary/50 border-border rounded bg-card"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full shadow-lg hover:shadow-xl hover:shadow-primary/25"
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