import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { AuthState, User, Profile, Arena, ArenaMembership } from '../types';
import { useToast } from './ToastContext';

// Mock de todas as arenas disponíveis no sistema
const ALL_ARENAS_MOCK: Arena[] = [
  { id: 'arena_1', owner_id: '', name: 'Arena Beira Rio', slug: 'arena-beira-rio', city: 'Porto Alegre', state: 'RS', main_image: 'https://img-wrapper.vercel.app/image?url=https://images.unsplash.com/photo-1589551290986-c5a89352c3e4?q=80&w=1974&auto=format&fit=crop', created_at: new Date().toISOString() },
  { id: 'arena_2', owner_id: '', name: 'Arena Ipanema Sports', slug: 'arena-ipanema-sports', city: 'Rio de Janeiro', state: 'RJ', main_image: 'https://img-wrapper.vercel.app/image?url=https://images.unsplash.com/photo-1620952796191-3c82a2312c6c?q=80&w=2070&auto=format&fit=crop', created_at: new Date().toISOString() },
  { id: 'arena_3', owner_id: '', name: 'SP Beach Club', slug: 'sp-beach-club', city: 'São Paulo', state: 'SP', main_image: 'https://img-wrapper.vercel.app/image?url=https://images.unsplash.com/photo-1594420314183-78d3c59a405d?q=80&w=2070&auto=format&fit=crop', created_at: new Date().toISOString() },
];

interface AuthContextType extends AuthState {
  allArenas: Arena[];
  signUp: (email: string, password: string, name?: string, role?: 'cliente' | 'admin_arena') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (updatedProfile: Partial<Profile>) => Promise<void>;
  updateArena: (updatedArena: Partial<Arena>) => Promise<void>;
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [arena, setArena] = useState<Arena | null>(null);
  const [memberships, setMemberships] = useState<ArenaMembership[]>([]);
  const [selectedArenaContext, setSelectedArenaContext] = useState<Arena | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  // Efeito 1: Gerencia a sessão de autenticação
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch((error) => {
        console.error("Erro ao recuperar a sessão:", error);
        setSession(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        setArena(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Efeito 2: Busca dados do perfil e da arena quando a sessão muda
  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Passo 1: Buscar o perfil do usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignora o erro "nenhuma linha encontrada"
          throw profileError;
        }

        if (profileData) {
          setProfile(profileData);

          // Passo 2: Se for um admin, buscar a arena correspondente
          if (profileData.role === 'admin_arena') {
            const { data: arenaData, error: arenaError } = await supabase
              .from('arenas')
              .select('*')
              .eq('owner_id', session.user.id)
              .single();

            if (arenaError && arenaError.code !== 'PGRST116') {
              throw arenaError;
            }
            setArena(arenaData || null);
          } else {
            setArena(null); // Garante que a arena seja nula para não-admins
          }
        } else {
          setProfile(null);
          setArena(null);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        setProfile(null);
        setArena(null);
        addToast({ message: 'Erro ao carregar dados do usuário.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session, addToast]);

  const user: User | null = session ? {
    id: session.user.id,
    email: session.user.email || '',
    created_at: session.user.created_at,
  } : null;

  const signUp = async (email: string, password: string, name?: string, role: 'cliente' | 'admin_arena' = 'cliente') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name: name || email.split('@')[0],
          role: role,
          clientType: role === 'cliente' ? 'cliente' : undefined,
        },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setArena(null);
  };

  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update(updatedProfile)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
  };

  const updateArena = async (updatedArenaData: Partial<Arena>) => {
    // 1. Get the current arena ID from the context. If it's not there, we can't update.
    if (!arena?.id) {
      addToast({ message: 'ID da arena não encontrado. Não é possível salvar.', type: 'error' });
      return;
    }
  
    // 2. Create a clean object for the update, starting from the form data.
    const updateData = { ...updatedArenaData };
  
    // 3. Remove fields that should never be updated manually.
    //    This prevents errors and protects data integrity.
    delete (updateData as any).id;
    delete (updateData as any).owner_id;
    delete (updateData as any).created_at;
    delete (updateData as any).main_image; // Deprecated field
  
    // 4. Perform the update operation.
    const { data, error } = await supabase
      .from('arenas')
      .update(updateData)
      .eq('id', arena.id) // Target the correct arena using its ID.
      .select()
      .single();
  
    // 5. Handle the result.
    if (error) {
      console.error("Erro ao atualizar a arena:", error);
      addToast({ message: `Falha ao salvar: ${error.message}`, type: 'error' });
      throw error; // Re-throw the error so the UI can know it failed.
    }
  
    // 6. Update the local state and notify the user.
    setArena(data);
    addToast({ message: 'Perfil da arena salvo com sucesso!', type: 'success' });
  };

  const followArena = (arenaId: string) => {
    if (!profile) return;
    const newMembership: ArenaMembership = { profile_id: profile.id, arena_id: arenaId };
    setMemberships(prev => [...prev, newMembership]);
  };

  const unfollowArena = (arenaId: string) => {
    setMemberships(prev => prev.filter(m => m.arena_id !== arenaId));
  };

  const switchArenaContext = (arena: Arena | null) => {
    setSelectedArenaContext(arena);
  };
  
  const authState: AuthState = { user, profile, arena, memberships, selectedArenaContext, isLoading };

  return (
    <AuthContext.Provider value={{ ...authState, allArenas: ALL_ARENAS_MOCK, signUp, signIn, signOut, updateProfile, updateArena, followArena, unfollowArena, switchArenaContext }}>
      {children}
    </AuthContext.Provider>
  );
};
