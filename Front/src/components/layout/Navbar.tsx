import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, LogOut } from 'lucide-react';
import SoloLogo from '../../Logo/Solo logo sin fondo.png';
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
    <nav className="bg-card border-b border-border shadow-xl backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src={SoloLogo} alt="TuStockYa" className="h-10 w-8 object-contain" />
              <span className="ml-2 text-xl font-bold text-foreground">TuStockYa</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link to="/" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link to="/products" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Products</Link>
              <Link to="/about" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</Link>
              <Link to="/contact" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</Link>

            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()}>
                  <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">Dashboard</Button>
                </Link>
                <div className="relative group">
                  <button className="flex items-center text-sm font-medium text-foreground hover:text-primary">
                    <img 
                      src={user?.avatar || 'https://via.placeholder.com/32'} 
                      alt="User" 
                      className="h-8 w-8 rounded-full mr-2" 
                    />
                    <span>{user?.name}</span>
                  </button>
                  <div className="absolute right-0 w-48 py-2 mt-2 bg-card rounded-lg shadow-2xl border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 backdrop-blur-sm">
                    <Link to={getDashboardLink()} className="block px-4 py-2 text-sm text-foreground hover:bg-muted/20 hover:text-primary transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-foreground hover:bg-muted/20 hover:text-primary transition-colors">
                      Profile
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/20 hover:text-primary transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">Login</Button>
                </Link>
                <Link to="/cart" className="text-muted-foreground hover:text-primary transition-colors">
                  <ShoppingBag className="h-6 w-6" />
                </Link>
              </>
            )}
          </div>
          <div className="flex md:hidden items-center">
            <Link to="/cart" className="px-4 text-muted-foreground hover:text-primary transition-colors">
              <ShoppingBag className="h-6 w-6" />
            </Link>
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              to="/about" 
              className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-border">
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
                    <div className="text-base font-medium text-foreground">{user?.name}</div>
                    <div className="text-sm font-medium text-muted-foreground">{user?.email}</div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link 
                    to={getDashboardLink()}
                    className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3 px-2 space-y-1">
                <Link 
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors"
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