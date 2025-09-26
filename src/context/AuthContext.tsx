import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, supabaseWithRetry } from '../lib/supabaseClient';
import { AuthState, User, Profile, Arena, ArenaMembership, Aluno } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType extends AuthState {
  allArenas: Arena[];
  alunoProfileForSelectedArena: Aluno | null;
  signUp: (email: string, password: string, name?: string, role?: 'cliente' | 'admin_arena') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (updatedProfile: Partial<Profile>) => Promise<void>;
  updateArena: (updatedArena: Partial<Arena>) => Promise<void>;
  followArena: (arenaId: string) => Promise<void>;
  unfollowArena: (arenaId: string) => Promise<void>;
  switchArenaContext: (arena: Arena | null) => void;
  refreshAlunoProfile: () => void;
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
  const [arena, setArena] = useState<Arena | null>(null); // Arena do admin
  const [memberships, setMemberships] = useState<ArenaMembership[]>([]);
  const [allArenas, setAllArenas] = useState<Arena[]>([]);
  const [selectedArenaContext, setSelectedArenaContext] = useState<Arena | null>(null);
  const [alunoProfileForSelectedArena, setAlunoProfileForSelectedArena] = useState<Aluno | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const fetchAlunoProfile = useCallback(async (profileId: string, arenaId: string) => {
    const { data: alunoData, error: alunoError } = await supabaseWithRetry(() =>
      supabase
        .from('alunos')
        .select('*')
        .eq('profile_id', profileId)
        .eq('arena_id', arenaId)
        .single()
    );
    if (alunoError && alunoError.code !== 'PGRST116') {
      console.error("Erro ao buscar perfil de aluno:", alunoError);
    }
    setAlunoProfileForSelectedArena(alunoData || null);
  }, []);

  const refreshAlunoProfile = useCallback(() => {
    if (profile?.id && selectedArenaContext?.id) {
      fetchAlunoProfile(profile.id, selectedArenaContext.id);
    }
  }, [profile, selectedArenaContext, fetchAlunoProfile]);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch((error) => {
        console.error("Erro ao recuperar a sessão:", error);
        setSession(null);
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        setArena(null);
        setMemberships([]);
        setSelectedArenaContext(null);
        setAlunoProfileForSelectedArena(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const { data: allArenasData, error: allArenasError } = await supabaseWithRetry(() =>
          supabase.from('arenas').select('*')
        );
        if (allArenasError) throw allArenasError;
        setAllArenas(allArenasData || []);

        const { data: profileData, error: profileError } = await supabaseWithRetry(() =>
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
        );
        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        setProfile(profileData);

        if (profileData) {
          if (profileData.role === 'admin_arena') {
            const { data: adminArenaData, error: adminArenaError } = await supabaseWithRetry(() =>
              supabase
                .from('arenas')
                .select('*')
                .eq('owner_id', session.user.id)
                .single()
            );
            if (adminArenaError && adminArenaError.code !== 'PGRST116') throw adminArenaError;
            setArena(adminArenaData || null);
            setSelectedArenaContext(adminArenaData || null);
          } else {
            setArena(null);
            const { data: membershipsData, error: membershipsError } = await supabaseWithRetry(() =>
              supabase
                .from('arena_memberships')
                .select('*')
                .eq('profile_id', session.user.id)
            );
            if (membershipsError) throw membershipsError;
            setMemberships(membershipsData || []);
            
            const lastSelectedArenaId = localStorage.getItem('selectedArenaId');
            const lastSelectedArena = allArenasData.find(a => a.id === lastSelectedArenaId);
            const firstMembershipArena = membershipsData && membershipsData.length > 0
              ? allArenasData.find(a => a.id === membershipsData[0].arena_id)
              : null;
              
            let currentArena: Arena | null = null;
            if (lastSelectedArena && membershipsData?.some(m => m.arena_id === lastSelectedArena.id)) {
              currentArena = lastSelectedArena;
            } else if (firstMembershipArena) {
              currentArena = firstMembershipArena;
              localStorage.setItem('selectedArenaId', firstMembershipArena.id);
            }
            setSelectedArenaContext(currentArena);
            if (currentArena) {
              fetchAlunoProfile(profileData.id, currentArena.id);
            }
          }
        } else {
          setProfile(null);
          setArena(null);
          setMemberships([]);
          setSelectedArenaContext(null);
          setAlunoProfileForSelectedArena(null);
        }
      } catch (error: any) {
        console.error("Erro ao buscar dados do usuário e arenas:", error);
        addToast({ message: 'Falha ao carregar dados. Verifique sua conexão e recarregue a página.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [session, addToast, fetchAlunoProfile]);

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
    setMemberships([]);
    setSelectedArenaContext(null);
    setAlunoProfileForSelectedArena(null);
    localStorage.removeItem('selectedArenaId');
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
    if (!arena?.id) {
      addToast({ message: 'ID da arena não encontrado. Não é possível salvar.', type: 'error' });
      return;
    }
    const updateData = { ...updatedArenaData };
    delete (updateData as any).id;
    delete (updateData as any).owner_id;
    delete (updateData as any).created_at;
    delete (updateData as any).main_image;
    const { data, error } = await supabase
      .from('arenas')
      .update(updateData)
      .eq('id', arena.id)
      .select()
      .single();
    if (error) {
      console.error("Erro ao atualizar a arena:", error);
      addToast({ message: `Falha ao salvar: ${error.message}`, type: 'error' });
      throw error;
    }
    setArena(data);
    addToast({ message: 'Perfil da arena salvo com sucesso!', type: 'success' });
  };

  const followArena = async (arenaId: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from('arena_memberships')
      .insert({ profile_id: profile.id, arena_id: arenaId });
      
    if (error && error.code !== '23505') { // Ignore duplicate key error
      addToast({ message: `Erro ao seguir arena: ${error.message}`, type: 'error' });
      return;
    }
    
    setMemberships(prev => {
      if (prev.some(m => m.arena_id === arenaId)) return prev;
      return [...prev, { profile_id: profile.id, arena_id: arenaId }];
    });
    addToast({ message: 'Arena seguida com sucesso!', type: 'success' });
  };

  const unfollowArena = async (arenaId: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from('arena_memberships')
      .delete()
      .match({ profile_id: profile.id, arena_id: arenaId });
    if (error) {
      addToast({ message: `Erro ao deixar de seguir arena: ${error.message}`, type: 'error' });
      return;
    }
    setMemberships(prev => prev.filter(m => m.arena_id !== arenaId));
    if (selectedArenaContext?.id === arenaId) {
      setSelectedArenaContext(null);
      localStorage.removeItem('selectedArenaId');
    }
    addToast({ message: 'Você deixou de seguir a arena.', type: 'info' });
  };

  const switchArenaContext = (arena: Arena | null) => {
    setSelectedArenaContext(arena);
    if (arena) {
      localStorage.setItem('selectedArenaId', arena.id);
      if (profile) {
        fetchAlunoProfile(profile.id, arena.id);
      }
    } else {
      localStorage.removeItem('selectedArenaId');
      setAlunoProfileForSelectedArena(null);
    }
  };
  
  const authState: AuthState = { user, profile, arena, memberships, selectedArenaContext, isLoading };

  return (
    <AuthContext.Provider value={{ ...authState, allArenas, alunoProfileForSelectedArena, signUp, signIn, signOut, updateProfile, updateArena, followArena, unfollowArena, switchArenaContext, refreshAlunoProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
