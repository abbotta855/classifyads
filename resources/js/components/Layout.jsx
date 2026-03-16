import React from 'react';
import Header from './Header';
import Footer from './Footer';

function Layout({ children, showFooter = true }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

export default Layout;

