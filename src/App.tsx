import React, { useState, useEffect } from 'react';
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
import { DashboardPage, DashboardTab } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { supabase, fetchUserProfile } from './lib/supabase';

export type PageName = 'home' | 'about-contact' | 'blog' | 'shop' | 'dashboard' | 'login';

export default function App() {
  const [user, setUser] = useState<{ id?: string; name: string; email: string; avatar_url?: string } | null>(() => {
    try {
      const saved = localStorage.getItem('stitched_memories_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.id && parsed.email) {
          parsed.id = 'usr_' + parsed.email.replace(/[^a-zA-Z0-9]/g, '_');
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [currentPage, setCurrentPage] = useState<PageName>('home');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('overview');
  const [aboutScrollTarget, setAboutScrollTarget] = useState<'about' | 'contact'>('about');
  const [isConverterOpen, setIsConverterOpen] = useState(false);

  // Initialize Supabase Auth state listener
  useEffect(() => {
    const syncSessionUser = async (session: any) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id, session.user.email);
        const displayName = profile?.display_name || session.user.user_metadata?.full_name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Crafter';
        const avatarUrl = profile?.avatar_url || session.user.user_metadata?.avatar_url || '';

        const userObj = {
          id: session.user.id,
          name: displayName,
          email: session.user.email || '',
          avatar_url: avatarUrl,
        };
        setUser(userObj);
        try {
          localStorage.setItem('stitched_memories_user', JSON.stringify(userObj));
        } catch {}

        // If user is logged in and currently on /login or /signup, redirect to /dashboard
        const path = window.location.pathname.toLowerCase();
        if (path.startsWith('/login') || path.startsWith('/signin') || path.startsWith('/signup')) {
          window.history.replaceState({}, '', '/dashboard');
          setCurrentPage('dashboard');
        }
      } else {
        setUser(null);
        try {
          localStorage.removeItem('stitched_memories_user');
        } catch {}

        // If user is logged out and on /dashboard, redirect to /login
        const path = window.location.pathname.toLowerCase();
        if (path.startsWith('/dashboard')) {
          window.history.replaceState({}, '', '/login');
          setCurrentPage('login');
        }
      }
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        syncSessionUser(session);
      }
    });

    // Listen for state changes (e.g., OAuth redirects, sign ins, sign outs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSessionUser(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync initial URL pathname and popstate history
  useEffect(() => {
    const handleUrlSync = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/dashboard')) {
        if (user) {
          setCurrentPage('dashboard');
        } else {
          // Protected route: Redirect logged-out user to /login
          window.history.replaceState({}, '', '/login');
          setCurrentPage('login');
        }
      } else if (path.startsWith('/login') || path.startsWith('/signin') || path.startsWith('/signup')) {
        if (user) {
          // If already logged in, redirect from /login or /signup to /dashboard
          window.history.replaceState({}, '', '/dashboard');
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('login');
        }
      } else if (path.startsWith('/blog')) {
        setCurrentPage('blog');
      } else if (path.startsWith('/shop')) {
        setCurrentPage('shop');
      } else if (path.startsWith('/about') || path.startsWith('/contact')) {
        setCurrentPage('about-contact');
      } else if (path === '/') {
        setCurrentPage('home');
      }
    };

    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, [user]);

  const handleLoginSuccess = (userProfile: { id?: string; name: string; email: string; avatar_url?: string }) => {
    setUser(userProfile);
    try {
      localStorage.setItem('stitched_memories_user', JSON.stringify(userProfile));
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
    }
    // Redirect logged-in user straight to /dashboard
    setDashboardTab('overview');
    setCurrentPage('dashboard');
    window.history.pushState({}, '', '/dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    try {
      localStorage.removeItem('stitched_memories_user');
    } catch (e) {
      console.error('Failed to clear user from localStorage', e);
    }
    // If user was on dashboard, redirect to home
    if (currentPage === 'dashboard') {
      setCurrentPage('home');
      window.history.pushState({}, '', '/');
    }
  };

  const navigateToPage = (page: PageName, path: string) => {
    // Route protection check for dashboard
    if (page === 'dashboard' && !user) {
      window.history.pushState({}, '', '/login');
      setCurrentPage('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentPage(page);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToSection = (sectionId: string) => {
    if (sectionId === 'home') {
      navigateToPage('home', '/');
      return;
    }

    if (sectionId === 'dashboard' || sectionId === 'dashboard-page') {
      setDashboardTab('overview');
      navigateToPage('dashboard', '/dashboard');
      return;
    }

    if (sectionId === 'profile' || sectionId === 'dashboard-profile') {
      setDashboardTab('profile');
      navigateToPage('dashboard', '/dashboard');
      return;
    }

    if (sectionId === 'login' || sectionId === 'login-page') {
      navigateToPage('login', '/login');
      return;
    }

    if (sectionId === 'about-page' || sectionId === 'about-section') {
      setAboutScrollTarget('about');
      navigateToPage('about-contact', '/about');
      return;
    }

    if (sectionId === 'contact-page' || sectionId === 'contact-section') {
      setAboutScrollTarget('contact');
      navigateToPage('about-contact', '/about');
      return;
    }

    if (sectionId === 'blog-page' || sectionId === 'blog-section') {
      navigateToPage('blog', '/blog');
      return;
    }

    if (sectionId === 'shop-page' || sectionId === 'shop-kits-section' || sectionId === 'shop-section') {
      navigateToPage('shop', '/shop');
      return;
    }

    // Default: Home page section navigation
    if (currentPage !== 'home') {
      setCurrentPage('home');
      window.history.pushState({}, '', '/');
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
      
      {/* Top Header Navigation (Hide header on pure standalone login page if desired or keep consistent) */}
      {currentPage !== 'login' && (
        <Header
          user={user}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onOpenConverter={() => setIsConverterOpen(true)}
          onNavigateToSection={handleNavigateToSection}
        />
      )}

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

        {currentPage === 'dashboard' && user && (
          <DashboardPage
            user={user}
            onLogout={handleLogout}
            onGoHome={() => handleNavigateToSection('home')}
            onOpenConverter={() => setIsConverterOpen(true)}
            onNavigateToSection={handleNavigateToSection}
            initialTab={dashboardTab}
          />
        )}

        {currentPage === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onGoHome={() => handleNavigateToSection('home')}
          />
        )}
      </main>

      {/* Footer */}
      {currentPage !== 'login' && (
        <Footer
          onOpenConverter={() => setIsConverterOpen(true)}
          onNavigateToSection={handleNavigateToSection}
        />
      )}

      {/* Interactive Photo to DMC Converter Demo Modal */}
      <PhotoConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        user={user}
      />

      {/* Floating Back to Top Button */}
      <BackToTop />
    </div>
  );
}
