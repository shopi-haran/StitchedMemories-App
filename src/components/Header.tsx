import React, { useState } from 'react';
import { Sparkles, BookOpen, ShoppingBag, ShoppingCart, Tag, User, LogIn, UserPlus, LogOut, ChevronDown, Check, Info, MessageSquare } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { CartDrawer } from './CartDrawer';

interface UserProfile {
  name: string;
  email: string;
}

interface HeaderProps {
  onOpenConverter: () => void;
  onNavigateToSection: (sectionId: string) => void;
  activeSection?: string;
  user?: UserProfile | null;
  onLoginSuccess?: (user: UserProfile) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenConverter,
  onNavigateToSection,
  user: externalUser,
  onLoginSuccess: externalLoginSuccess,
  onLogout: externalLogout,
}) => {
  // Local state fallbacks if parent doesn't pass user handlers
  const [internalUser, setInternalUser] = useState<UserProfile | null>(null);
  const user = externalUser !== undefined ? externalUser : internalUser;

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'signup'>('login');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLoginSuccess = (userProfile: UserProfile) => {
    if (externalLoginSuccess) {
      externalLoginSuccess(userProfile);
    } else {
      setInternalUser(userProfile);
    }
  };

  const handleLogout = () => {
    if (externalLogout) {
      externalLogout();
    } else {
      setInternalUser(null);
    }
    setIsProfileDropdownOpen(false);
  };

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthDefaultTab(tab);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF6EE]/90 backdrop-blur-md border-b border-[#E8E1D2]/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          
          {/* Brand Text */}
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onNavigateToSection('home'); }}
            className="flex flex-col group text-decoration-none"
          >
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D231E]">
              Stitched<span className="text-[#E06C38]">Memories</span>
            </span>
            <span className="text-[10px] tracking-wider uppercase text-[#6B7869] font-medium">
              Your Photo, Stitched into a Keepsake
            </span>
          </a>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 whitespace-nowrap shrink-0">
            <button
              onClick={onOpenConverter}
              className="text-sm font-medium text-[#3A4538] hover:text-[#E06C38] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-[#E06C38]" />
              <span>Convert a Photo</span>
            </button>

            <button
              onClick={() => onNavigateToSection('pricing-section')}
              className="text-sm font-medium text-[#3A4538] hover:text-[#E06C38] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Tag className="w-4 h-4 text-[#93A28F]" />
              <span>Pricing</span>
            </button>

            <button
              onClick={() => onNavigateToSection('blog-page')}
              className="text-sm font-medium text-[#3A4538] hover:text-[#E06C38] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-[#93A28F]" />
              <span>Learning Hub</span>
            </button>

            <div className="relative group whitespace-nowrap">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  alert('Marketplace store is coming soon! Stay tuned for physical kits, thread bundles, and artisan supplies.');
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-[#788576] hover:text-[#556653] cursor-not-allowed transition-colors whitespace-nowrap"
                title="Marketplace coming soon"
              >
                <ShoppingBag className="w-4 h-4 text-[#A5B3A2]" />
                <span>Marketplace</span>
                <span className="ml-0.5 px-2 py-0.5 text-[10px] font-bold bg-[#E8EFE5] text-[#556653] rounded-full border border-[#D0DCD0] whitespace-nowrap">
                  Coming Soon
                </span>
              </button>
            </div>

            <button
              onClick={() => onNavigateToSection('about-page')}
              className="text-sm font-medium text-[#3A4538] hover:text-[#E06C38] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Info className="w-4 h-4 text-[#93A28F]" />
              <span>About Us</span>
            </button>
          </nav>

          {/* Right Header Section: Shopping Cart & User Auth (CTA Removed) */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Shopping Cart Icon Button */}
            <div className="relative group">
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative p-2.5 rounded-full text-[#3A4538] hover:text-[#E06C38] hover:bg-[#E8E1D2]/50 transition-all cursor-pointer flex items-center justify-center border border-[#E8E1D2]/80"
                aria-label="Shopping Cart"
                title="Shopping Cart (Shop Kits Launching Soon)"
              >
                <ShoppingCart className="w-5 h-5" />
                {/* Cart Badge */}
                <span className="absolute -top-1 -right-1 bg-[#E06C38] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  0
                </span>
              </button>

              {/* Tooltip on Hover */}
              <div className="absolute right-0 top-full mt-2 w-48 p-2.5 bg-[#1D231E] text-white text-[11px] rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center leading-snug hidden sm:block">
                Shopping Cart <br />
                <span className="text-[#93A28F] text-[10px]">Physical Kits Launching Soon!</span>
              </div>
            </div>

            {/* User Login / Sign Up or Logged In Profile */}
            {user ? (
              /* Logged In User Pill & Dropdown */
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 pl-3 pr-2.5 py-1.5 bg-white hover:bg-[#F2EFE8] border border-[#E8E1D2] rounded-full shadow-xs transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-[#E06C38]/15 text-[#E06C38] font-bold text-xs flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-[#1D231E] max-w-[100px] truncate hidden sm:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6B7869]" />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white border border-[#E8E1D2] rounded-2xl shadow-xl py-2 z-50 animate-fadeIn"
                    onMouseLeave={() => setIsProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-[#E8E1D2]/60">
                      <p className="text-xs font-bold text-[#1D231E] truncate">{user.name}</p>
                      <p className="text-[11px] text-[#6B7869] truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onOpenConverter();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#3A4538] hover:bg-[#FAF6EE] flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#E06C38]" />
                        <span>My Saved Patterns</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setIsCartDrawerOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#3A4538] hover:bg-[#FAF6EE] flex items-center gap-2 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#93A28F]" />
                        <span>Kit Reservations</span>
                      </button>
                    </div>

                    <div className="border-t border-[#E8E1D2]/60 pt-1 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs text-[#C0453B] hover:bg-[#FAF6EE] flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Logged Out: Log In & Sign Up buttons */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth('login')}
                  className="px-3.5 py-2 text-xs font-semibold text-[#3A4538] hover:text-[#1D231E] hover:bg-[#E8E1D2]/50 rounded-full transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#6B7869]" />
                  <span>Log In</span>
                </button>

                <button
                  onClick={() => openAuth('signup')}
                  className="px-4 py-2 text-xs font-semibold bg-[#1D231E] hover:bg-[#323D34] text-white rounded-full shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#93A28F]" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authDefaultTab}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onOpenConverter={onOpenConverter}
      />
    </>
  );
};
