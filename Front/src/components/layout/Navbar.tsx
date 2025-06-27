import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shovel as Shoe, ShoppingBag, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'superuser':
        return '/superuser';
      case 'admin':
        return '/admin';
      case 'warehouse':
        return '/warehouse';
      case 'seller':
        return '/seller';
      case 'runner':
        return '/runner';
      default:
        return '/';
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Shoe className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-primary">TennisHub</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link to="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary">Home</Link>
              <Link to="/products" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary">Products</Link>
              <Link to="/about" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary">About</Link>
              <Link to="/contact" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary">Contact</Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()}>
                  <Button variant="secondary" size="sm">Dashboard</Button>
                </Link>
                <div className="relative group">
                  <button className="flex items-center text-sm font-medium text-gray-700 hover:text-primary">
                    <img 
                      src={user?.avatar || 'https://via.placeholder.com/32'} 
                      alt="User" 
                      className="h-8 w-8 rounded-full mr-2" 
                    />
                    <span>{user?.name}</span>
                  </button>
                  <div className="absolute right-0 w-48 py-2 mt-2 bg-white rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <Link to={getDashboardLink()} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Dashboard
                    </Link>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Profile
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="secondary" size="sm">Login</Button>
                </Link>
                <Link to="/cart" className="text-gray-700 hover:text-primary">
                  <ShoppingBag className="h-6 w-6" />
                </Link>
              </>
            )}
          </div>
          <div className="flex md:hidden items-center">
            <Link to="/cart" className="px-4 text-gray-700 hover:text-primary">
              <ShoppingBag className="h-6 w-6" />
            </Link>
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              to="/about" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <>
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <img 
                      src={user?.avatar || 'https://via.placeholder.com/32'} 
                      alt="User" 
                      className="h-10 w-10 rounded-full" 
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user?.name}</div>
                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link 
                    to={getDashboardLink()}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3 px-2 space-y-1">
                <Link 
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};