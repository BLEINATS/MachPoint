import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LogOut, Sun, Moon, Settings, Bookmark, LayoutGrid, 
  User as UserIcon, LayoutDashboard, GraduationCap, Trophy, 
  PartyPopper, Calendar 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const { user, arena, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-brand-gray-800 shadow-sm border-b border-brand-gray-200 dark:border-brand-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <Calendar className="h-8 w-8 text-brand-blue-500" />
              <span className="ml-2 text-xl font-bold text-brand-gray-900 dark:text-white">
                MatchPlay
              </span>
            </Link>
            {profile?.role === 'admin_arena' && arena && (
              <div className="ml-4 pl-4 border-l border-brand-gray-300 dark:border-brand-gray-600 hidden sm:flex items-center gap-3">
                {arena.logo_url ? (
                  <img src={arena.logo_url} alt={`Logo de ${arena.name}`} className="h-8 w-8 rounded-full object-cover" />
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
                <Link to="/alunos" title="Alunos e Turmas" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
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
               <>
                <Link to="/dashboard" title="Meu Dashboard" className="p-2 rounded-full text-brand-gray-500 dark:text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                  <LayoutDashboard className="h-5 w-5" />
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
