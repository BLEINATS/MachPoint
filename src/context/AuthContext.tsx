import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User, Profile, Arena, ArenaMembership } from '../types';

// Mock de todas as arenas disponíveis no sistema
const ALL_ARENAS_MOCK: Arena[] = [
  { id: 'arena_1', name: 'Arena Beira Rio', slug: 'arena-beira-rio', city: 'Porto Alegre', state: 'RS', main_image: 'https://img-wrapper.vercel.app/image?url=https://images.unsplash.com/photo-1589551290986-c5a89352c3e4?q=80&w=1974&auto=format&fit=crop', created_at: new Date().toISOString() },
  { id: 'arena_2', name: 'Arena Ipanema Sports', slug: 'arena-ipanema-sports', city: 'Rio de Janeiro', state: 'RJ', main_image: 'https://img-wrapper.vercel.app/image?url=https://images.unsplash.com/photo-1620952796191-3c82a2312c6c?q=80&w=2070&auto=format&fit=crop', created_at: new Date().toISOString() },
  { id: 'arena_3', name: 'SP Beach Club', slug: 'sp-beach-club', city: 'São Paulo', state: 'SP', main_image: 'https://img-wrapper.vercel.app/image?url=https://images.unsplash.com/photo-1594420314183-78d3c59a405d?q=80&w=2070&auto=format&fit=crop', created_at: new Date().toISOString() },
];

interface AuthContextType extends AuthState {
  allArenas: Arena[];
  signUp: (email: string, password: string, arenaName?: string, clientName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (updatedProfile: Partial<Profile>) => void;
  followArena: (arenaId: string) => void;
  unfollowArena: (arenaId: string) => void;
  switchArenaContext: (arena: Arena | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Função centralizada para criar um estado seguro a partir de dados brutos
const createSafeAuthState = (data: any): Omit<AuthState, 'isLoading'> | null => {
  if (data && data.user?.id && data.profile?.id) {
    return {
      user: data.user,
      profile: data.profile,
      arena: data.arena || null,
      memberships: data.memberships || [],
      selectedArenaContext: (data.selectedArenaContext && data.selectedArenaContext.id) ? data.selectedArenaContext : null,
    };
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    arena: null,
    memberships: [],
    selectedArenaContext: null,
    isLoading: true,
  });

  const persistAuthState = (state: Omit<AuthState, 'isLoading'>) => {
    localStorage.setItem('matchplay_auth', JSON.stringify(state));
  };

  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('matchplay_auth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        const safeState = createSafeAuthState(authData);

        if (safeState) {
          setAuthState({ ...safeState, isLoading: false });
          // Auto-cura: salva o estado sanitizado de volta no localStorage
          persistAuthState(safeState);
        } else {
          // Dados inválidos, limpa e define o estado como deslogado
          localStorage.removeItem('matchplay_auth');
          setAuthState({ user: null, profile: null, arena: null, memberships: [], selectedArenaContext: null, isLoading: false });
        }
      } else {
        // Nenhum dado salvo, apenas termina o carregamento
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Falha ao processar sessão do localStorage. Limpando dados corrompidos.", error);
      localStorage.removeItem('matchplay_auth');
      setAuthState({ user: null, profile: null, arena: null, memberships: [], selectedArenaContext: null, isLoading: false });
    }
  }, []);

  const signUp = async (email: string, password: string, arenaName?: string, clientName?: string) => {
    const userId = 'user_' + Date.now();
    const user: User = { id: userId, email, created_at: new Date().toISOString() };

    let profile: Profile;
    let arena: Arena | null = null;
    const memberships: ArenaMembership[] = [];
    const selectedArenaContext: Arena | null = null;

    if (arenaName) { // Cadastro de dono de arena
      const arenaId = 'arena_' + Date.now();
      arena = { id: arenaId, name: arenaName, slug: arenaName.toLowerCase().replace(/\s+/g, '-'), created_at: new Date().toISOString() };
      profile = { id: 'profile_' + Date.now(), user_id: userId, arena_id: arenaId, role: 'admin_arena', created_at: new Date().toISOString() };
    } else { // Cadastro de cliente
      profile = { id: 'profile_' + Date.now(), user_id: userId, role: 'cliente', name: clientName || email.split('@')[0], clientType: 'cliente', created_at: new Date().toISOString() };
    }

    const newAuthState = { user, profile, arena, memberships, selectedArenaContext };
    setAuthState({ ...newAuthState, isLoading: false });
    persistAuthState(newAuthState);
  };

  const signIn = async (email: string, password: string) => {
    const savedAuth = localStorage.getItem('matchplay_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      if (authData.user?.email === email) {
        const safeState = createSafeAuthState(authData);
        if (safeState) {
          setAuthState({ ...safeState, isLoading: false });
          persistAuthState(safeState); // Re-persiste para garantir que está no formato mais recente
          return;
        }
      }
    }
    throw new Error('Credenciais inválidas ou usuário não encontrado.');
  };

  const signOut = () => {
    localStorage.removeItem('matchplay_auth');
    setAuthState({ user: null, profile: null, arena: null, memberships: [], selectedArenaContext: null, isLoading: false });
  };

  const updateProfile = (updatedProfile: Partial<Profile>) => {
    setAuthState(prev => {
      if (!prev.profile) return prev;
      const newProfile = { ...prev.profile, ...updatedProfile };
      const { isLoading, ...rest } = { ...prev, profile: newProfile };
      persistAuthState(rest);
      return { ...rest, isLoading: prev.isLoading };
    });
  };

  const followArena = (arenaId: string) => {
    setAuthState(prev => {
      if (!prev.profile || prev.memberships.some(m => m.arena_id === arenaId)) return prev;
      const newMembership: ArenaMembership = { profile_id: prev.profile.id, arena_id: arenaId };
      const newMemberships = [...prev.memberships, newMembership];
      const { isLoading, ...rest } = { ...prev, memberships: newMemberships };
      persistAuthState(rest);
      return { ...rest, isLoading: prev.isLoading };
    });
  };

  const unfollowArena = (arenaId: string) => {
    setAuthState(prev => {
      if (!prev.profile) return prev;
      const newMemberships = prev.memberships.filter(m => m.arena_id !== arenaId);
      const { isLoading, ...rest } = { ...prev, memberships: newMemberships };
      persistAuthState(rest);
      return { ...rest, isLoading: prev.isLoading };
    });
  };

  const switchArenaContext = (arena: Arena | null) => {
    setAuthState(prev => {
      const { isLoading, ...rest } = { ...prev, selectedArenaContext: arena };
      persistAuthState(rest);
      return { ...rest, isLoading: prev.isLoading };
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, allArenas: ALL_ARENAS_MOCK, signUp, signIn, signOut, updateProfile, followArena, unfollowArena, switchArenaContext }}>
      {children}
    </AuthContext.Provider>
  );
};
