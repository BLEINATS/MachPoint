import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, Settings, Bookmark, LayoutGrid, User as UserIcon, LayoutDashboard, Building, Replace } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import Button from '../Forms/Button';

const Header: React.FC = () => {
  const { user, arena, profile, signOut, selectedArenaContext, switchArenaContext } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSwitchArena = () => {
    switchArenaContext(null);
    navigate('/dashboard');
  }

  return (
    <header className="bg-white dark:bg-brand-gray-800 shadow-sm border-b border-brand-gray-200 dark:border-brand-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <img src="/logo.svg" alt="MatchPlay Logo" className="h-8 w-8"/>
              <span className="ml-2 text-xl font-bold text-brand-gray-900 dark:text-white">
                MatchPlay
              </span>
            </Link>
            {profile?.role === 'admin_arena' && arena && (
              <span className="ml-4 text-sm text-brand-gray-500 dark:text-brand-gray-400 hidden sm:block border-l border-brand-gray-300 dark:border-brand-gray-600 pl-4">
                {arena.name}
              </span>
            )}
            {profile?.role === 'cliente' && selectedArenaContext && (
               <div className="ml-4 text-sm text-brand-gray-500 dark:text-brand-gray-400 hidden sm:flex items-center border-l border-brand-gray-300 dark:border-brand-gray-600 pl-4">
                <Building className="h-4 w-4 mr-2"/>
                <span>{selectedArenaContext.name}</span>
                <Button variant="ghost" size="sm" className="ml-2" onClick={handleSwitchArena} title="Trocar de Arena">
                  <Replace className="h-4 w-4"/>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {user && (
              <span className="text-sm text-brand-gray-700 dark:text-brand-gray-300 hidden md:block">{profile?.name || user.email}</span>
            )}
            
            {profile?.role === 'admin_arena' ? (
              <>
                <Link to="/quadras" title="Minhas Quadras" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <LayoutGrid className="h-5 w-5" />
                </Link>
                <Link to="/reservas" title="Reservas" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <Bookmark className="h-5 w-5" />
                </Link>
                <Link to="/settings" title="Configurações" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <Settings className="h-5 w-5" />
                </Link>
              </>
            ) : (
               <>
                <Link to="/dashboard" title="Meu Dashboard" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
                <Link to="/perfil" title="Meu Perfil" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <UserIcon className="h-5 w-5" />
                </Link>
               </>
            )}

            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"
              whileTap={{ scale: 0.9, rotate: 90 }}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </motion.button>
            {user && (
              <button
                onClick={signOut}
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
