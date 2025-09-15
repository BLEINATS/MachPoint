import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Quadra, Reserva, Arena } from '../../types';
import { Calendar, History, Heart, Compass, Plus, Building, Search } from 'lucide-react';
import { isAfter, startOfDay, isSameDay } from 'date-fns';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import UpcomingReservationCard from './UpcomingReservationCard';
import FavoriteCourtCard from './FavoriteCourtCard';
import Button from '../Forms/Button';

const ClientDashboard: React.FC = () => {
  const { profile, selectedArenaContext, switchArenaContext, memberships, allArenas } = useAuth();
  const navigate = useNavigate();

  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  const myArenas = useMemo(() => {
    return allArenas.filter(arena => memberships.some(m => m.arena_id === arena.id));
  }, [allArenas, memberships]);
  
  const loadArenaData = useCallback(() => {
    if (selectedArenaContext) {
      const savedQuadras = localStorage.getItem(`quadras_${selectedArenaContext.id}`);
      if (savedQuadras) setQuadras(JSON.parse(savedQuadras)); else setQuadras([]);
      
      const savedReservas = localStorage.getItem(`reservas_${selectedArenaContext.id}`);
      if (savedReservas) setReservas(JSON.parse(savedReservas)); else setReservas([]);
    } else {
      setQuadras([]);
      setReservas([]);
    }
  }, [selectedArenaContext]);

  useEffect(() => {
    loadArenaData();
  }, [loadArenaData]);

  const clientReservations = useMemo(() => {
    return reservas.filter(r => r.profile_id === profile?.id);
  }, [reservas, profile]);

  const upcomingReservations = useMemo(() => {
    const today = startOfDay(new Date());
    return clientReservations
      .filter(r => (isAfter(parseDateStringAsLocal(r.date), today) || isSameDay(parseDateStringAsLocal(r.date), today)) && r.status === 'confirmada')
      .sort((a, b) => parseDateStringAsLocal(a.date).getTime() - parseDateStringAsLocal(b.date).getTime() || a.start_time.localeCompare(b.start_time));
  }, [clientReservations]);

  const favoriteQuadraIds = useMemo(() => {
    const saved = localStorage.getItem(`favorite_quadras_${profile?.id}`);
    return saved ? JSON.parse(saved) : [];
  }, [profile?.id]);

  const favoriteQuadras = useMemo(() => {
    return quadras.filter(q => favoriteQuadraIds.includes(q.id));
  }, [quadras, favoriteQuadraIds]);
  
  if (!selectedArenaContext) {
    return (
      <div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Minhas Arenas</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Selecione uma arena para ver suas reservas e quadras favoritas.</p>
        </motion.div>
        {myArenas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myArenas.map(arena => (
              <ArenaCard key={arena.id} arena={arena} onSelect={() => switchArenaContext(arena)} />
            ))}
            <AddArenaCard />
          </div>
        ) : (
          <EmptyState 
            message="Você ainda não segue nenhuma arena." 
            actionText="Encontrar Arenas" 
            link="/arenas"
            icon={Search}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Olá, {profile?.name || 'Cliente'}!</h1>
        <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Pronto para a próxima partida em <span className="font-semibold text-brand-blue-500">{selectedArenaContext.name}</span>?</p>
      </motion.div>

      <div className="space-y-12">
        <DashboardSection icon={Calendar} title="Próximas Reservas">
          {upcomingReservations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingReservations.slice(0,3).map((res, index) => (
                <UpcomingReservationCard key={res.id} reservation={res} quadra={quadras.find(q => q.id === res.quadra_id)} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState message="Você não tem nenhuma reserva confirmada nesta arena." actionText="Ver quadras disponíveis" link={`/${selectedArenaContext.slug}`} />
          )}
        </DashboardSection>

        {favoriteQuadras.length > 0 && (
          <DashboardSection icon={Heart} title="Suas Quadras Favoritas">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {favoriteQuadras.map((quadra, index) => (
                <FavoriteCourtCard key={quadra.id} quadra={quadra} index={index} arenaSlug={selectedArenaContext.slug} />
              ))}
            </div>
          </DashboardSection>
        )}
      </div>
    </div>
  );
};

const ArenaCard: React.FC<{arena: Arena, onSelect: () => void}> = ({ arena, onSelect }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden cursor-pointer"
    onClick={onSelect}
  >
    <div className="h-40 bg-brand-gray-200 dark:bg-brand-gray-700 overflow-hidden">
      <img src={arena.main_image || `https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/400x300?text=${arena.name}`} alt={arena.name} className="w-full h-full object-cover" />
    </div>
    <div className="p-5">
      <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{arena.name}</h3>
      <p className="text-sm text-brand-gray-500">{arena.city}, {arena.state}</p>
    </div>
  </motion.div>
);

const AddArenaCard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-transparent border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-700 rounded-lg flex flex-col items-center justify-center text-center p-5 cursor-pointer hover:border-brand-blue-500 hover:text-brand-blue-500 transition-all h-full min-h-[244px]"
      onClick={() => navigate('/arenas')}
    >
      <Plus className="h-10 w-10 text-brand-gray-400 mb-2" />
      <h3 className="font-bold text-lg text-brand-gray-700 dark:text-brand-gray-300">Seguir Nova Arena</h3>
      <p className="text-sm text-brand-gray-500">Explore e adicione mais arenas à sua lista.</p>
    </motion.div>
  );
};

const DashboardSection: React.FC<{icon: React.ElementType, title: string, children: React.ReactNode}> = ({ icon: Icon, title, children }) => (
  <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
    <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-200 mb-6 flex items-center">
      <Icon className="h-6 w-6 mr-3 text-brand-blue-500" />
      {title}
    </h2>
    {children}
  </motion.section>
);

const EmptyState: React.FC<{message: string, actionText: string, link: string, icon?: React.ElementType}> = ({ message, actionText, link, icon: Icon }) => (
  <div className="text-center py-10 px-6 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-700">
    {Icon && <Icon className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />}
    <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-4">{message}</p>
    <Button onClick={() => useNavigate()(link)}>
      <Plus className="h-4 w-4 mr-2" />
      {actionText}
    </Button>
  </div>
);

export default ClientDashboard;
