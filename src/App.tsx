import React, { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ThreeEntryPoints } from './components/ThreeEntryPoints';
import { PricingSection } from './components/PricingSection';
import { PhotoConverterModal } from './components/PhotoConverterModal';
import { BlogPreview } from './components/BlogPreview';
import { ShopKitsPreview } from './components/ShopKitsPreview';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';

import { AboutContactPage } from './pages/AboutContactPage';
import { BlogPage } from './pages/BlogPage';
import { ShopPage } from './pages/ShopPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'about-contact' | 'blog' | 'shop'>('home');
  const [aboutScrollTarget, setAboutScrollTarget] = useState<'about' | 'contact'>('about');
  const [isConverterOpen, setIsConverterOpen] = useState(false);

  const handleNavigateToSection = (sectionId: string) => {
    if (sectionId === 'home') {
      setCurrentPage('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'about-page' || sectionId === 'about-section') {
      setAboutScrollTarget('about');
      setCurrentPage('about-contact');
      return;
    }

    if (sectionId === 'contact-page' || sectionId === 'contact-section') {
      setAboutScrollTarget('contact');
      setCurrentPage('about-contact');
      return;
    }

    if (sectionId === 'blog-page' || sectionId === 'blog-section') {
      setCurrentPage('blog');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (sectionId === 'shop-page' || sectionId === 'shop-kits-section' || sectionId === 'shop-section') {
      setCurrentPage('shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Default: Home page section navigation
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6EE] text-[#1D231E] font-sans selection:bg-[#E06C38]/20 selection:text-[#E06C38]">
      
      {/* Top Header Navigation */}
      <Header
        onOpenConverter={() => setIsConverterOpen(true)}
        onNavigateToSection={handleNavigateToSection}
      />

      {/* Main Content Flow */}
      <main className="flex-grow">
        {currentPage === 'home' && (
          <>
            <Hero
              onOpenConverter={() => setIsConverterOpen(true)}
              onNavigateToSection={handleNavigateToSection}
            />

            {/* Three Entry Points (Convert a Photo, Browse Blog, Shop Kits) */}
            <ThreeEntryPoints
              onOpenConverter={() => setIsConverterOpen(true)}
              onNavigateToBlog={() => handleNavigateToSection('blog-page')}
            />

            {/* Pricing & Subscription Section */}
            <PricingSection
              onOpenConverter={() => setIsConverterOpen(true)}
              onNavigateToSection={handleNavigateToSection}
            />

            {/* Blog & Editorial Section Preview */}
            <BlogPreview
              onNavigateToBlogPage={() => handleNavigateToSection('blog-page')}
              onOpenConverter={() => setIsConverterOpen(true)}
            />

            {/* Future Shop Kits Preview */}
            <ShopKitsPreview onNavigateToShopPage={() => handleNavigateToSection('shop-page')} />
          </>
        )}

        {currentPage === 'about-contact' && (
          <AboutContactPage
            onGoHome={() => handleNavigateToSection('home')}
            onOpenConverter={() => setIsConverterOpen(true)}
            scrollToSection={aboutScrollTarget}
          />
        )}

        {currentPage === 'blog' && (
          <BlogPage
            onGoHome={() => handleNavigateToSection('home')}
            onOpenConverter={() => setIsConverterOpen(true)}
          />
        )}

        {currentPage === 'shop' && (
          <ShopPage
            onGoHome={() => handleNavigateToSection('home')}
            onOpenConverter={() => setIsConverterOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenConverter={() => setIsConverterOpen(true)}
        onNavigateToSection={handleNavigateToSection}
      />

      {/* Interactive Photo to DMC Converter Demo Modal */}
      <PhotoConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
      />

      {/* Floating Back to Top Button */}
      <BackToTop />
    </div>
  );
}
