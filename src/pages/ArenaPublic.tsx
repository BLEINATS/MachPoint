import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign, User, X, Heart, Repeat, Check } from 'lucide-react';
import { format, addDays, startOfDay, addMinutes, isSameDay, isPast, parse, getDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import { Arena, Quadra, Reserva } from '../types';
import { getReservationTypeDetails, expandRecurringReservations } from '../utils/reservationUtils';
import { parseDateStringAsLocal } from '../utils/dateUtils';

const ArenaPublic: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile, memberships, followArena, switchArenaContext, allArenas } = useAuth();
  
  const [arena, setArena] = useState<Arena | null>(null);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [favoriteQuadras, setFavoriteQuadras] = useState<string[]>([]);
  
  const isMember = useMemo(() => {
    return arena ? memberships.some(m => m.arena_id === arena.id) : false;
  }, [memberships, arena]);

  useEffect(() => {
    const currentArena = allArenas.find(a => a.slug === slug);
    if (currentArena) {
      setArena(currentArena);
      const savedQuadras = localStorage.getItem(`quadras_${currentArena.id}`);
      if (savedQuadras) setQuadras(JSON.parse(savedQuadras));
      const savedReservas = localStorage.getItem(`reservas_${currentArena.id}`);
      if (savedReservas) setReservas(JSON.parse(savedReservas));
    }
    
    if (profile?.id) {
      const savedFavorites = localStorage.getItem(`favorite_quadras_${profile.id}`);
      if (savedFavorites) setFavoriteQuadras(JSON.parse(savedFavorites));
    }
  }, [slug, profile?.id, allArenas]);

  const displayedReservations = useMemo(() => {
    const viewStartDate = startOfDay(new Date());
    const viewEndDate = endOfDay(addDays(new Date(), 7));
    return expandRecurringReservations(reservas, viewStartDate, viewEndDate, quadras);
  }, [reservas, quadras]);

  const handleFollowAndBook = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (arena && !isMember) {
      followArena(arena.id);
    }
    if (arena) {
      switchArenaContext(arena);
    }
    // A lógica de reserva real será tratada pelo clique no slot
    alert(`Agora você está seguindo ${arena?.name}! Escolha um horário para reservar.`);
  };

  const handleSlotClick = (time: string, quadra: Quadra) => {
    if (profile?.role === 'admin_arena') {
      alert('Administradores devem gerenciar reservas pelo Hub de Reservas.');
      return;
    }
    if (!user) {
      navigate('/auth');
      return;
    }
    if (arena && !isMember) {
      followArena(arena.id);
    }
    if (arena) {
      switchArenaContext(arena);
    }
    // Lógica para ir para a reserva
    navigate('/dashboard'); // Simplificado: navega para o dashboard onde o contexto já está setado
  };

  const toggleFavorite = (quadraId: string) => {
    if (!profile) return;
    const newFavorites = favoriteQuadras.includes(quadraId)
      ? favoriteQuadras.filter(id => id !== quadraId)
      : [...favoriteQuadras, quadraId];
    setFavoriteQuadras(newFavorites);
    localStorage.setItem(`favorite_quadras_${profile.id}`, JSON.stringify(newFavorites));
  };

  const generateTimeSlots = (quadra: Quadra) => {
    const slots = [];
    const dayOfWeek = getDay(selectedDate);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const horarioString = isWeekend ? quadra.horarios.horarioFimSemana : quadra.horarios.horarioSemana;

    if (!horarioString) return [];

    const ranges = horarioString.split(',');
    for (const range of ranges) {
      const [startStr, endStr] = range.split('-');
      if (!startStr || !endStr) continue;
      
      let currentTime = parse(startStr.trim(), 'HH:mm', selectedDate);
      const endTime = parse(endStr.trim(), 'HH:mm', selectedDate);

      while (currentTime < endTime) {
        slots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, quadra.booking_interval_minutes || 60);
      }
    }
    return slots;
  };

  const getSlotStatus = (time: string, quadraId: string) => {
    const slotDateTime = parse(time, 'HH:mm', selectedDate);

    if (isPast(slotDateTime) && !isSameDay(selectedDate, startOfDay(new Date()))) {
    } else if (isPast(slotDateTime)) {
      return { status: 'past', data: null };
    }

    const reserva = displayedReservations.find(r => 
      r.quadra_id === quadraId && 
      isSameDay(parseDateStringAsLocal(r.date), selectedDate) && 
      r.start_time === time && 
      r.status !== 'cancelada'
    );
    if (reserva) return { status: 'booked', data: reserva };

    return { status: 'available', data: null };
  };

  if (!arena) return <Layout><div className="text-center p-8">Arena não encontrada</div></Layout>;

  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const renderSlotButton = (quadra: Quadra, time: string) => {
    const { status, data } = getSlotStatus(time, quadra.id);
    let styles = '';
    let icon;
    
    if (status === 'available') {
      styles = 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/20';
      icon = <Clock className="h-3 w-3 mr-1" />;
    } else if (status === 'past') {
      styles = 'bg-brand-gray-100 text-brand-gray-400 dark:bg-brand-gray-700/50 dark:text-brand-gray-500 cursor-not-allowed';
      icon = <Clock className="h-3 w-3 mr-1" />;
    } else if (status === 'booked' && data) {
      const typeDetails = getReservationTypeDetails(data.type);
      styles = `${typeDetails.publicBgColor} ${typeDetails.publicTextColor} cursor-not-allowed`;
      icon = <typeDetails.icon className="h-3 w-3 mr-1" />;
    }

    return (
      <motion.button 
        key={time} 
        whileHover={{ scale: status === 'available' ? 1.05 : 1 }} 
        whileTap={{ scale: status === 'available' ? 0.95 : 1 }} 
        onClick={() => handleSlotClick(time, quadra)} 
        disabled={status !== 'available'}
        className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${styles}`}
      >
        <div className="flex items-center justify-center">
          {icon}
          {data?.isRecurring && <Repeat className="h-3 w-3 mr-1" />}
          {time}
        </div>
      </motion.button>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">{arena.name}</h1>
          <div className="flex items-center mt-2 text-brand-gray-600 dark:text-brand-gray-400">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{arena.city}, {arena.state}</span>
          </div>
        </motion.div>
        
        {user && profile?.role === 'cliente' && (
          <div className="mb-8">
            <Button onClick={handleFollowAndBook} size="lg" className="w-full md:w-auto">
              {isMember ? <><Check className="h-5 w-5 mr-2" /> Você segue esta arena</> : 'Seguir Arena e Reservar'}
            </Button>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 p-4 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-brand-gray-900 dark:text-white mb-4">Escolha a data</h2>
          <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2">
            {nextDays.map((date, index) => (
              <button key={index} onClick={() => setSelectedDate(startOfDay(date))} className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all min-w-[80px] ${isSameDay(date, selectedDate) ? 'border-brand-blue-500 bg-blue-50 dark:bg-brand-blue-500/10 text-brand-blue-700 dark:text-brand-blue-300' : 'border-brand-gray-200 dark:border-brand-gray-700 hover:border-brand-blue-400 dark:hover:border-brand-blue-500'}`}>
                <span className="text-xs font-medium uppercase">{format(date, 'EEE', { locale: ptBR })}</span>
                <span className="text-lg font-bold">{format(date, 'dd')}</span>
                <span className="text-xs">{format(date, 'MMM', { locale: ptBR })}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-8">
          {quadras.map((quadra) => (
            <div key={quadra.id} className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 px-6 py-4 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">{quadra.name}</h3>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-blue-100">{quadra.sport_type}</span>
                    <div className="flex items-center ml-4"><DollarSign className="h-4 w-4 mr-1" /><span className="font-semibold">R$ {quadra.price_per_hour.toFixed(2)}/hora</span></div>
                  </div>
                </div>
                {profile?.role === 'cliente' && (
                  <button onClick={() => toggleFavorite(quadra.id)} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                    <Heart className={`h-6 w-6 text-white transition-all ${favoriteQuadras.includes(quadra.id) ? 'fill-current text-red-400' : ''}`} />
                  </button>
                )}
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {generateTimeSlots(quadra).map(time => renderSlotButton(quadra, time))}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
};

export default ArenaPublic;
