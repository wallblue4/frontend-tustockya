import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShoppingBag, Truck, CreditCard, Headphones } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

export const HomePage: React.FC = () => {
  const productosDestacados = [
    {
      id: 1,
      name: 'Pro Court 2023',
      price: 129.99,
      originalPrice: 159.99,
      image: 'https://images.pexels.com/photos/2385477/pexels-photo-2385477.jpeg?auto=compress&cs=tinysrgb&w=600',
      rating: 4.8,
      reviews: 124,
    },
    {
      id: 2,
      name: 'Speed Runner Elite',
      price: 149.99,
      originalPrice: 189.99,
      image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600',
      rating: 4.7,
      reviews: 98,
    },
    {
      id: 3,
      name: 'Grand Slam Pro',
      price: 179.99,
      image: 'https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=600',
      rating: 4.9,
      reviews: 156,
    },
    {
      id: 4,
      name: 'Clay Court Master',
      price: 159.99,
      originalPrice: 199.99,
      image: 'https://images.pexels.com/photos/2421374/pexels-photo-2421374.jpeg?auto=compress&cs=tinysrgb&w=600',
      rating: 4.6,
      reviews: 87,
    },
  ];

  return (
    <Layout>
      {/* Sección Hero */}
      <section className="relative bg-gradient-to-r from-primary to-blue-700 text-white py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute right-0 top-0 w-1/2 h-full bg-white/10 transform -skew-x-12"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Tenis Premium para Campeones</h1>
              <p className="text-lg mb-8">Eleva tu juego con nuestros tenis profesionales diseñados para comodidad, rendimiento y estilo.</p>
              <div className="flex space-x-4">
                <Link to="/products">
                  <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                    Comprar Ahora <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Saber Más
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block animate-slide-up">
              <img 
                src="https://images.pexels.com/photos/1032110/pexels-photo-1032110.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="Tenis premium" 
                className="rounded-lg shadow-2xl h-auto max-h-[400px] w-full object-cover" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Tenis Destacados</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Descubre nuestros tenis más populares, diseñados para rendimiento y comodidad en cualquier superficie.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productosDestacados.map((producto) => (
              <Card key={producto.id} hoverable className="group">
                <div className="relative overflow-hidden">
                  <img 
                    src={producto.image} 
                    alt={producto.name} 
                    className="w-full h-60 object-cover transform transition-transform group-hover:scale-105" 
                  />
                  {producto.originalPrice && (
                    <div className="absolute top-2 right-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded">
                      OFERTA
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="primary" size="sm" className="transform translate-y-4 group-hover:translate-y-0 transition-transform">
                      <ShoppingBag className="mr-2 h-4 w-4" /> Añadir al Carrito
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{producto.name}</h3>
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="text-sm text-gray-700 ml-1">{producto.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-1">({producto.reviews} reseñas)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-900">${producto.price}</span>
                    {producto.originalPrice && (
                      <span className="ml-2 text-sm text-gray-500 line-through">${producto.originalPrice}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/products">
              <Button variant="secondary">
                Ver Todos los Productos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sección de Características */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">¿Por qué elegir TennisHub?</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Nos dedicamos a proporcionar la mejor experiencia en calzado deportivo con productos premium y servicio excepcional.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Calidad Premium</h3>
              <p className="text-gray-600">Selección cuidadosa de las mejores marcas y modelos exclusivos.</p>
            </Card>

            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Entrega Rápida</h3>
              <p className="text-gray-600">Sistema eficiente para que recibas tus tenis lo más rápido posible.</p>
            </Card>

            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Pago Seguro</h3>
              <p className="text-gray-600">Múltiples opciones de pago seguro para una experiencia sin problemas.</p>
            </Card>

            <Card className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Headphones className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Soporte 24/7</h3>
              <p className="text-gray-600">Nuestro equipo de atención al cliente siempre está listo para ayudarte.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección de Boletín */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-lg shadow-xl overflow-hidden">
            <div className="p-10 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Suscríbete para Actualizaciones</h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Recibe ofertas exclusivas, nuevas llegadas y consejos directamente en tu bandeja de entrada.
              </p>
              <div className="flex flex-col sm:flex-row max-w-md mx-auto sm:max-w-lg">
                <input
                  type="email"
                  placeholder="Ingresa tu correo"
                  className="flex-grow px-4 py-3 rounded-l-md focus:outline-none sm:rounded-r-none"
                />
                <Button className="mt-2 sm:mt-0 rounded-md sm:rounded-l-none bg-white text-primary hover:bg-gray-100">
                  Suscribirse
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};