import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, Sun, Moon, Settings, Bookmark, LayoutGrid, 
  User as UserIcon, LayoutDashboard, GraduationCap, Trophy, 
  PartyPopper, Calendar, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
  const { user, arena, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white dark:bg-brand-gray-800 shadow-sm border-b border-brand-gray-200 dark:border-brand-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to={profile?.role === 'admin_arena' ? "/dashboard" : "/perfil"} className="flex items-center">
              <Calendar className="h-8 w-8 text-brand-blue-500" />
              <span className="ml-2 text-xl font-bold text-brand-gray-900 dark:text-white">
                MatchPlay
              </span>
            </Link>
            {profile?.role === 'admin_arena' && arena && (
              <div className="ml-4 pl-4 border-l border-brand-gray-300 dark:border-brand-gray-600 hidden sm:flex items-center gap-3">
                {arena.logo_url ? (
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-brand-gray-200 dark:border-brand-gray-700">
                    <img src={arena.logo_url} alt={`Logo de ${arena.name}`} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center text-brand-gray-500 font-bold">
                    {arena.name ? arena.name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <span className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200">
                  {arena.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            {profile?.role === 'admin_arena' ? (
              <>
                <Link to="/quadras" title="Minhas Quadras" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <LayoutGrid className="h-5 w-5" />
                </Link>
                <Link to="/reservas" title="Reservas" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <Bookmark className="h-5 w-5" />
                </Link>
                <Link to="/alunos" title="Clientes e Alunos" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <GraduationCap className="h-5 w-5" />
                </Link>
                <Link to="/torneios" title="Torneios" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <Trophy className="h-5 w-5" />
                </Link>
                <Link to="/eventos" title="Eventos" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <PartyPopper className="h-5 w-5" />
                </Link>
                <Link to="/settings" title="Configurações" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <Settings className="h-5 w-5" />
                </Link>
              </>
            ) : (
               <div className="relative" ref={profileMenuRef}>
                  <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 p-2 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                    <div className="w-8 h-8 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-brand-gray-500" />
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-brand-gray-500 hidden sm:block" />
                  </button>
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-brand-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                      >
                        <div className="py-1">
                          <Link to="/perfil" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-brand-gray-700 dark:text-brand-gray-200 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                            <LayoutDashboard className="h-4 w-4 mr-2" /> Meu Painel
                          </Link>
                          <button onClick={handleSignOut} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <LogOut className="h-4 w-4 mr-2" /> Sair
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            )}

            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"
              whileTap={{ scale: 0.9, rotate: 90 }}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </motion.button>
            
            {user && profile?.role === 'admin_arena' && (
              <button
                onClick={handleSignOut}
                className="flex items-center text-brand-gray-500 dark:text-brand-gray-400 hover:text-brand-gray-700 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
