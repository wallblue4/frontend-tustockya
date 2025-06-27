import React from 'react';
import { Link } from 'react-router-dom';
import { Shovel as Shoe, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Shoe className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-white">TennisHub</span>
            </div>
            <p className="text-gray-400 mb-4">
              Providing premium sports tennis footwear for athletes and enthusiasts since 2022.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary">Home</Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-400 hover:text-primary">Products</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-primary">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-primary">Contact</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products?category=running" className="text-gray-400 hover:text-primary">Running</Link>
              </li>
              <li>
                <Link to="/products?category=tennis" className="text-gray-400 hover:text-primary">Tennis</Link>
              </li>
              <li>
                <Link to="/products?category=basketball" className="text-gray-400 hover:text-primary">Basketball</Link>
              </li>
              <li>
                <Link to="/products?category=casual" className="text-gray-400 hover:text-primary">Casual</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <span className="text-gray-400">123 Tennis Court Ave, Sports City, SC 12345</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-primary mr-2" />
                <span className="text-gray-400">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-primary mr-2" />
                <a href="mailto:info@tennishub.com" className="text-gray-400 hover:text-primary">info@tennishub.com</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} TennisHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};