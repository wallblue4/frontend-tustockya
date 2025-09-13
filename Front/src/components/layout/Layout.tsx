import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideFooter = false }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow bg-background">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};