import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Quadra, Reserva, Aluno, Turma, Professor, CreditTransaction, Profile, Arena } from '../../types';
import { Calendar, History, Compass, Search, Sparkles, GraduationCap, CreditCard, LayoutDashboard, Loader2, CheckCircle, AlertCircle, ShoppingBag, Clock, Heart, DollarSign } from 'lucide-react';
import { isAfter, startOfDay, isSameDay, format, parse, getDay, addDays, isBefore, endOfDay, isPast, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import UpcomingReservationCard from './UpcomingReservationCard';
import Button from '../Forms/Button';
import ArenaSelector from './ArenaSelector';
import NextClassCard from './Student/NextClassCard';
import ReservationModal from '../Reservations/ReservationModal';
import { useToast } from '../../context/ToastContext';
import { expandRecurringReservations } from '../../utils/reservationUtils';
import DatePickerCalendar from './DatePickerCalendar';
import RecommendationCard from './RecommendationCard';
import ClientCancellationModal from './ClientCancellationModal';
import ArenaInfoCard from './ArenaInfoCard';

type TabType = 'overview' | 'reservations' | 'credits';

const ClientDashboard: React.FC = () => {
  const { profile, selectedArenaContext, switchArenaContext, memberships, allArenas, alunoProfileForSelectedArena, refreshAlunoProfile } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [allArenaReservations, setAllArenaReservations] = useState<Reserva[]>([]);
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSlot, setModalSlot] = useState<{ quadraId: string; time: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<Reserva | null>(null);

  const myArenas = useMemo(() => {
    return allArenas.filter(arena => memberships.some(m => m.arena_id === arena.id));
  }, [allArenas, memberships]);
  
  const loadData = useCallback(async () => {
    if (!selectedArenaContext || !profile) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [quadrasRes, clientReservasRes, allReservasRes, turmasRes, profsRes] = await Promise.all([
        supabase.from('quadras').select('*, pricing_rules(*)').eq('arena_id', selectedArenaContext.id),
        supabase.from('reservas').select('id, quadra_id, date, start_time, end_time, status, total_price, payment_status, credit_used, rented_items, clientName, clientPhone, sport_type').eq('profile_id', profile.id).eq('arena_id', selectedArenaContext.id),
        supabase.from('reservas').select('id, quadra_id, date, start_time, end_time, status, isRecurring, recurringType, recurringEndDate, master_id, type').eq('arena_id', selectedArenaContext.id),
        supabase.from('turmas').select('id, name, quadra_id, professor_id, start_time, daysOfWeek, student_ids').eq('arena_id', selectedArenaContext.id),
        supabase.from('professores').select('id, name').eq('arena_id', selectedArenaContext.id),
      ]);

      if (quadrasRes.error) throw quadrasRes.error;
      if (clientReservasRes.error) throw clientReservasRes.error;
      if (allReservasRes.error) throw allReservasRes.error;
      if (turmasRes.error) throw turmasRes.error;
      if (profsRes.error) throw profsRes.error;

      setQuadras(quadrasRes.data as Quadra[] || []);
      setReservas(clientReservasRes.data as Reserva[] || []);
      setAllArenaReservations(allReservasRes.data as Reserva[] || []);
      setTurmas(turmasRes.data as Turma[] || []);
      setProfessores(profsRes.data as Professor[] || []);

      if (alunoProfileForSelectedArena?.id) {
        const { data: creditData, error: creditError } = await supabase
          .from('credit_transactions')
          .select('id, amount, type, description, created_at')
          .eq('aluno_id', alunoProfileForSelectedArena.id)
          .eq('arena_id', selectedArenaContext.id)
          .order('created_at', { ascending: false });
        
        if (creditError) throw creditError;
        setCreditHistory(creditData || []);
      } else {
        setCreditHistory([]);
      }

    } catch (error: any) {
      console.error("Erro ao carregar dados do cliente:", error);
      addToast({ message: 'Erro ao carregar os dados do painel.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedArenaContext, profile, addToast, alunoProfileForSelectedArena]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSlotClick = (time: string, quadraId: string) => {
    setModalSlot({ quadraId, time });
    setIsModalOpen(true);
  };
  
  const handleSaveClientReservation = async (reservationData: Omit<Reserva, 'id' | 'created_at' | 'arena_id'> | Reserva) => {
    if (!selectedArenaContext || !profile) {
      addToast({ message: 'Erro: Contexto do usuário ou da arena não encontrado.', type: 'error' });
      return;
    }

    const params = {
        p_arena_id: selectedArenaContext.id,
        p_quadra_id: reservationData.quadra_id,
        p_date: reservationData.date,
        p_start_time: reservationData.start_time,
        p_end_time: reservationData.end_time,
        p_profile_id: profile.id,
        p_sport_type: reservationData.sport_type,
        p_total_price: reservationData.total_price,
        p_credit_to_use: reservationData.credit_used || 0,
        p_rented_items: reservationData.rented_items || [],
        p_client_name: profile.name,
        p_client_phone: profile.phone || '',
    };

    try {
        const { error } = await supabase.rpc('create_client_reservation', params);
        if (error) throw error;
        
        addToast({ message: 'Reserva criada com sucesso!', type: 'success' });

    } catch (error: any) {
        console.error("Erro ao criar reserva (Dashboard):", error);
        addToast({ message: `Erro ao criar reserva: ${error.message}`, type: 'error' });
    } finally {
        setIsModalOpen(false);
        setModalSlot(null);
        refreshAlunoProfile();
        await loadData();
    }
  };

  const handleOpenCancelModal = (reserva: Reserva) => {
    if (reserva.total_price === 0) {
      addToast({ message: 'Reservas gratuitas não podem ser canceladas por aqui.', type: 'info' });
      return;
    }
    setReservationToCancel(reserva);
    setIsCancelModalOpen(true);
  };
  
  const handleConfirmCancellation = async (reservaId: string) => {
    if (!profile) {
      addToast({ message: 'Erro: Perfil do usuário não encontrado.', type: 'error' });
      return;
    }
    try {
      const { error } = await supabase.rpc('handle_client_cancellation_final', {
        p_reserva_id: reservaId,
        p_profile_id: profile.id
      });

      if (error) {
        console.error("Erro ao cancelar reserva:", error);
        throw error;
      }

      addToast({ message: 'Reserva cancelada e crédito aplicado com sucesso!', type: 'success' });
      await loadData();
      refreshAlunoProfile();

    } catch (error: any) {
      console.error("Erro ao cancelar reserva:", error);
      addToast({ message: `Erro ao cancelar reserva: ${error.message}`, type: 'error' });
    } finally {
      setIsCancelModalOpen(false);
      setReservationToCancel(null);
    }
  };

  const recommendation = useMemo(() => {
    if (reservas.length < 3) return null;

    const frequencyMap = new Map<string, number>();
    reservas.forEach(r => {
        const key = `${r.quadra_id}|${r.start_time.slice(0, 5)}`;
        frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
    });

    if (frequencyMap.size === 0) return null;

    const [mostFrequentPattern] = [...frequencyMap.entries()].sort((a, b) => b[1] - a[1])[0];
    const [preferredQuadraId, preferredTime] = mostFrequentPattern.split('|');

    const preferredQuadra = quadras.find(q => q.id === preferredQuadraId);
    if (!preferredQuadra) return null;

    const today = startOfDay(new Date());
    const expandedAllReservations = expandRecurringReservations(allArenaReservations, today, addDays(today, 7), quadras);

    for (let i = 0; i < 7; i++) {
        const checkDate = addDays(today, i);
        
        const slotDateTime = parse(preferredTime, 'HH:mm', checkDate);
        if (isPast(slotDateTime)) continue;

        const isBooked = expandedAllReservations.some(r => 
            r.quadra_id === preferredQuadraId &&
            isSameDay(parseDateStringAsLocal(r.date), checkDate) &&
            r.start_time.slice(0, 5) === preferredTime &&
            r.status !== 'cancelada'
        );

        if (!isBooked) {
            return {
                quadra: preferredQuadra,
                date: checkDate,
                time: preferredTime,
            };
        }
    }

    return null;
  }, [reservas, allArenaReservations, quadras]);


  const upcomingReservations = useMemo(() => {
    const now = new Date();
    return reservas
      .filter(r => {
        if (r.status !== 'confirmada') return false;
        try {
          const reservationDate = parseDateStringAsLocal(r.date);
          const [endHours, endMinutes] = r.end_time.split(':').map(Number);
          const endDateTime = new Date(reservationDate.setHours(endHours, endMinutes, 0, 0));
          return isAfter(endDateTime, now);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        try {
          const aDate = parseDateStringAsLocal(a.date);
          const [aStartHours, aStartMinutes] = a.start_time.split(':').map(Number);
          const aDateTime = new Date(aDate.setHours(aStartHours, aStartMinutes, 0, 0));

          const bDate = parseDateStringAsLocal(b.date);
          const [bStartHours, bStartMinutes] = b.start_time.split(':').map(Number);
          const bDateTime = new Date(bDate.setHours(bStartHours, bStartMinutes, 0, 0));
          
          return aDateTime.getTime() - bDateTime.getTime();
        } catch {
          return 0;
        }
      });
  }, [reservas]);

  const pastReservations = useMemo(() => {
    const now = new Date();
    return reservas
      .filter(r => {
        try {
          const reservationDate = parseDateStringAsLocal(r.date);
          const [endHours, endMinutes] = r.end_time.split(':').map(Number);
          const endDateTime = new Date(reservationDate.setHours(endHours, endMinutes, 0, 0));
          return isBefore(endDateTime, now);
        } catch {
          return true; // If parsing fails, assume it's in the past to be safe
        }
      })
      .sort((a, b) => {
        try {
          const aDate = parseDateStringAsLocal(a.date);
          const [aStartHours, aStartMinutes] = a.start_time.split(':').map(Number);
          const aDateTime = new Date(aDate.setHours(aStartHours, aStartMinutes, 0, 0));

          const bDate = parseDateStringAsLocal(b.date);
          const [bStartHours, bStartMinutes] = b.start_time.split(':').map(Number);
          const bDateTime = new Date(bDate.setHours(bStartHours, bStartMinutes, 0, 0));

          return bDateTime.getTime() - aDateTime.getTime();
        } catch {
          return 0;
        }
      });
  }, [reservas]);

  const isStudent = useMemo(() => !!alunoProfileForSelectedArena?.plan_name && alunoProfileForSelectedArena.plan_name.toLowerCase() !== 'avulso', [alunoProfileForSelectedArena]);

  const studentTurmas = useMemo(() => {
    if (!isStudent || !alunoProfileForSelectedArena) return [];
    return turmas.filter(t => t.student_ids.includes(alunoProfileForSelectedArena.id));
  }, [isStudent, alunoProfileForSelectedArena, turmas]);

  const nextClass = useMemo(() => {
    if (!isStudent || studentTurmas.length === 0) return null;
    const now = new Date();
    let upcomingClasses: any[] = [];

    studentTurmas.forEach(turma => {
      let runDate = startOfDay(new Date());
      for (let i = 0; i < 30; i++) {
        if (turma.daysOfWeek.includes(getDay(runDate))) {
          const classDateTime = parse(turma.start_time, 'HH:mm', runDate);
          if (isAfter(classDateTime, now)) {
            upcomingClasses.push({
              turma,
              date: new Date(runDate),
              dateTime: classDateTime,
              quadra: quadras.find(q => q.id === turma.quadra_id),
              professor: professores.find(p => p.id === turma.professor_id),
            });
          }
        }
        runDate = addDays(runDate, 1);
      }
    });

    if (upcomingClasses.length === 0) return null;
    upcomingClasses.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    return upcomingClasses[0];
  }, [isStudent, studentTurmas, quadras, professores]);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Início', icon: LayoutDashboard },
    { id: 'reservations', label: 'Reservas', icon: Calendar },
    { id: 'credits', label: 'Créditos', icon: CreditCard },
  ];

  if (myArenas.length === 0) {
    return (
      <div className="text-center py-16">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <Compass className="h-16 w-16 text-brand-blue-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Bem-vindo, {profile?.name}!</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-4 max-w-md mx-auto">Parece que você ainda não segue nenhuma arena. Explore e encontre seu próximo local de jogo!</p>
          <Button size="lg" className="mt-8" onClick={() => navigate('/arenas')}>
            <Search className="h-5 w-5 mr-2" />
            Encontrar Arenas
          </Button>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>;
    
    switch (activeTab) {
      case 'overview':
        return <OverviewTab 
                  creditBalance={alunoProfileForSelectedArena?.credit_balance || 0} 
                  nextReservation={upcomingReservations[0]} 
                  nextClass={nextClass} 
                  quadras={quadras}
                  reservas={allArenaReservations}
                  onSlotClick={handleSlotClick}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  profile={profile}
                  arenaName={selectedArenaContext?.name}
                  recommendation={recommendation}
                  selectedArena={selectedArenaContext}
               />;
      case 'reservations':
        return <ReservationsTab upcoming={upcomingReservations} past={pastReservations} quadras={quadras} arenaName={selectedArenaContext?.name} onCancel={handleOpenCancelModal} />;
      case 'credits':
        return <CreditsTab balance={alunoProfileForSelectedArena?.credit_balance || 0} history={creditHistory} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Meu Painel</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">
            Gerencie suas reservas, aulas e créditos.
          </p>
        </div>
        <ArenaSelector arenas={myArenas} selectedArena={selectedArenaContext} onSelect={switchArenaContext} />
      </motion.div>

      {!selectedArenaContext ? (
        <div className="text-center py-16 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <Compass className="h-12 w-12 text-brand-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-200">Selecione uma arena</h2>
            <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Escolha uma das suas arenas para ver seus dados.</p>
          </motion.div>
        </div>
      ) : (
        <>
          <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 mb-8">
            <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400'
                      : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 dark:hover:border-brand-gray-600'
                  }`}
                >
                  <tab.icon className="mr-2 h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </>
      )}
      <AnimatePresence>
        {isModalOpen && modalSlot && selectedArenaContext && (
          <ReservationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveClientReservation}
            onCancelReservation={() => {}}
            newReservationSlot={{ quadraId: modalSlot.quadraId, time: modalSlot.time, type: 'avulsa' }}
            quadras={quadras}
            alunos={[]}
            allReservations={allArenaReservations}
            arenaId={selectedArenaContext.id}
            selectedDate={selectedDate}
            isClientBooking={true}
            userProfile={profile}
            clientProfile={alunoProfileForSelectedArena}
          />
        )}
      </AnimatePresence>
       <AnimatePresence>
        {isCancelModalOpen && reservationToCancel && selectedArenaContext && (
          <ClientCancellationModal
            isOpen={isCancelModalOpen}
            onClose={() => setIsCancelModalOpen(false)}
            onConfirm={handleConfirmCancellation}
            reserva={reservationToCancel}
            policyText={selectedArenaContext.cancellation_policy}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const OverviewTab: React.FC<{
  creditBalance: number, 
  nextReservation?: Reserva, 
  nextClass?: any, 
  quadras: Quadra[], 
  reservas: Reserva[], 
  onSlotClick: (time: string, quadraId: string) => void,
  selectedDate: Date,
  setSelectedDate: (date: Date) => void,
  profile: Profile | null,
  arenaName?: string,
  recommendation: { quadra: Quadra; date: Date; time: string } | null;
  selectedArena: Arena | null;
}> = ({creditBalance, nextReservation, nextClass, quadras, reservas, onSlotClick, selectedDate, setSelectedDate, profile, arenaName, recommendation, selectedArena}) => {
  const [favoriteQuadras, setFavoriteQuadras] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.id) {
      const savedFavorites = localStorage.getItem(`favorite_quadras_${profile.id}`);
      if (savedFavorites) setFavoriteQuadras(JSON.parse(savedFavorites));
    }
  }, [profile?.id]);
  
  const toggleFavorite = (quadraId: string) => {
    if (!profile) return;
    const newFavorites = favoriteQuadras.includes(quadraId)
      ? favoriteQuadras.filter(id => id !== quadraId)
      : [...favoriteQuadras, quadraId];
    setFavoriteQuadras(newFavorites);
    localStorage.setItem(`favorite_quadras_${profile.id}`, JSON.stringify(newFavorites));
  };
  
  const sortedQuadras = useMemo(() => {
    return [...quadras].sort((a, b) => {
      const aIsFav = favoriteQuadras.includes(a.id);
      const bIsFav = favoriteQuadras.includes(b.id);
      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [quadras, favoriteQuadras]);

  const handleRecommendationClick = () => {
    if (recommendation) {
      setSelectedDate(recommendation.date);
      onSlotClick(recommendation.time, recommendation.quadra.id);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content - Appears first on mobile */}
      <div className="lg:w-2/3 space-y-8 order-1 lg:order-none">
        {nextClass && <NextClassCard date={nextClass.date} turmaName={nextClass.turma.name} quadraName={nextClass.quadra?.name} professorName={nextClass.professor?.name} startTime={nextClass.turma.start_time} arenaName={arenaName} />}
        {nextReservation && <UpcomingReservationCard reservation={nextReservation} quadra={quadras.find(q => q.id === nextReservation.quadra_id)} index={0} arenaName={arenaName} />}
        
        {!nextClass && !nextReservation && selectedArena && (
          <ArenaInfoCard arena={selectedArena} />
        )}
        {!nextClass && !nextReservation && !selectedArena && (
          <EmptyState message="Você não tem nenhuma atividade agendada." />
        )}

        <QuickBookingWidget 
          quadras={sortedQuadras}
          reservas={reservas}
          onSlotClick={onSlotClick}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          favoriteQuadras={favoriteQuadras}
          toggleFavorite={toggleFavorite}
          profile={profile}
        />
      </div>
      {/* Sidebar - Appears second on mobile */}
      <div className="lg:w-1/3 space-y-8 order-2 lg:order-none">
        <CreditBalanceCard balance={creditBalance} />
        {recommendation ? (
          <RecommendationCard 
            quadraName={recommendation.quadra.name}
            day={format(recommendation.date, 'EEEE', { locale: ptBR })}
            time={recommendation.time}
            onClick={handleRecommendationClick}
          />
        ) : (
          <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 p-6">
            <h3 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 mb-4 flex items-center"><Sparkles className="h-5 w-5 mr-2 text-yellow-400" /> Recomendações</h3>
            <p className="text-sm text-brand-gray-500">Em breve, você verá aqui horários recomendados para você.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickBookingWidget: React.FC<{
  quadras: Quadra[], 
  reservas: Reserva[], 
  onSlotClick: (time: string, quadraId: string) => void,
  selectedDate: Date,
  setSelectedDate: (date: Date) => void,
  favoriteQuadras: string[],
  toggleFavorite: (quadraId: string) => void,
  profile: Profile | null,
}> = ({quadras, reservas, onSlotClick, selectedDate, setSelectedDate, favoriteQuadras, toggleFavorite, profile}) => {
  
  const displayedReservations = useMemo(() => {
    const viewStartDate = startOfDay(new Date());
    const viewEndDate = endOfDay(addDays(new Date(), 365));
    return expandRecurringReservations(reservas, viewStartDate, viewEndDate, quadras);
  }, [reservas, quadras]);

  const generateTimeSlots = (quadra: Quadra) => {
    const slots = [];
    const dayOfWeek = getDay(selectedDate);
    
    let horario;
    if (dayOfWeek === 0) horario = quadra.horarios?.sunday;
    else if (dayOfWeek === 6) horario = quadra.horarios?.saturday;
    else horario = quadra.horarios?.weekday;

    if (!horario || !horario.start || !horario.end) return [];

    let currentTime = parse(horario.start.slice(0,5), 'HH:mm', selectedDate);
    let endTime = parse(horario.end.slice(0,5), 'HH:mm', selectedDate);
    if (endTime <= currentTime) endTime = addDays(endTime, 1);

    const interval = quadra.booking_duration_minutes || 60;

    while (currentTime < endTime) {
        slots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, interval);
    }
    return slots;
  };
  
  const getSlotStatus = (time: string, quadraId: string) => {
    const slotDateTime = parse(time, 'HH:mm', selectedDate);

    if (isPast(slotDateTime) && !isSameDay(selectedDate, startOfDay(new Date()))) {
      return { status: 'past', data: null };
    } else if (isPast(slotDateTime) && isSameDay(selectedDate, startOfDay(new Date()))) {
      return { status: 'past', data: null };
    }

    const reserva = displayedReservations.find(r => 
      r.quadra_id === quadraId && 
      isSameDay(parseDateStringAsLocal(r.date), selectedDate) && 
      r.start_time.slice(0, 5) === time && 
      r.status !== 'cancelada'
    );
    if (reserva) return { status: 'booked', data: reserva };

    return { status: 'available', data: null };
  };
  
  const getPriceRange = (quadra: Quadra) => {
    if (!quadra.pricing_rules || quadra.pricing_rules.length === 0) return "A definir";
    const activePrices = quadra.pricing_rules.filter(r => r.is_active).map(r => r.price_single);
    if (activePrices.length === 0) return "A definir";
    const minPrice = Math.min(...activePrices);
    const maxPrice = Math.max(...activePrices);
    if (minPrice === maxPrice) return minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return `${minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - ${maxPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
  };
  
  const renderSlotButton = (quadra: Quadra, time: string) => {
    const { status, data } = getSlotStatus(time, quadra.id);
    let styles = 'bg-brand-gray-100 text-brand-gray-500 dark:bg-brand-gray-700 dark:text-brand-gray-400';
    let icon = <Clock className="h-3 w-3 mr-1" />;
    
    if (status === 'available') {
      styles = 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/20';
    } else if (status === 'past') {
      styles = 'bg-brand-gray-100 text-brand-gray-400 dark:bg-brand-gray-700/50 dark:text-brand-gray-500 cursor-not-allowed';
    } else if (status === 'booked' && data) {
      styles = 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 cursor-not-allowed';
    }

    return (
      <motion.button 
        key={time} 
        whileHover={{ scale: status === 'available' ? 1.05 : 1 }} 
        whileTap={{ scale: status === 'available' ? 0.95 : 1 }} 
        onClick={() => onSlotClick(time, quadra.id)} 
        disabled={status !== 'available'}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-center ${styles}`}
      >
        <div className="flex items-center justify-center">
          {icon}
          {time.slice(0,5)}
        </div>
      </motion.button>
    );
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 p-6">
      <h3 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 mb-4 flex items-center"><Calendar className="h-5 w-5 mr-2 text-brand-blue-500" /> Reserva Rápida</h3>
      <div className="mb-6">
        <DatePickerCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>
      <div className="space-y-6">
        {quadras.map(quadra => (
          <div key={quadra.id}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{quadra.name}</h4>
                <p className="text-sm text-brand-gray-500">{quadra.sports.join(', ')} - <span className="font-medium text-green-600">{getPriceRange(quadra)}</span></p>
              </div>
              {profile && (
                <button onClick={() => toggleFavorite(quadra.id)} className="p-2 rounded-full hover:bg-red-100/50 dark:hover:bg-red-500/10 transition-colors">
                  <Heart className={`h-5 w-5 transition-all ${favoriteQuadras.includes(quadra.id) ? 'fill-current text-red-500' : 'text-brand-gray-400'}`} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {generateTimeSlots(quadra).map(time => renderSlotButton(quadra, time))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const ReservationsTab: React.FC<{upcoming: Reserva[], past: Reserva[], quadras: Quadra[], arenaName?: string, onCancel: (reserva: Reserva) => void}> = ({upcoming, past, quadras, arenaName, onCancel}) => (
  <div className="space-y-8">
    <ReservationList title="Próximas Reservas" reservations={upcoming} quadras={quadras} arenaName={arenaName} onCancel={onCancel} />
    <ReservationList title="Histórico de Reservas" reservations={past} quadras={quadras} arenaName={arenaName} isPast />
  </div>
);

const ReservationList: React.FC<{title: string, reservations: Reserva[], quadras: Quadra[], arenaName?: string, isPast?: boolean, onCancel?: (reserva: Reserva) => void}> = ({title, reservations, quadras, arenaName, isPast, onCancel}) => (
  <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
    <h3 className="text-xl font-semibold p-6">{title}</h3>
    {reservations.length === 0 ? (
      <p className="px-6 pb-6 text-brand-gray-500">Nenhuma reserva encontrada.</p>
    ) : (
      <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
        {reservations.map(res => (
          <li key={res.id} className="p-4 sm:p-6 hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <p className="font-bold text-brand-gray-900 dark:text-white">{quadras.find(q => q.id === res.quadra_id)?.name} <span className="font-normal text-brand-gray-500">• {arenaName}</span></p>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
                  {format(parseDateStringAsLocal(res.date), "dd/MM/yyyy")} • {res.start_time.slice(0, 5)} - {res.end_time.slice(0, 5)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-brand-gray-800 dark:text-white">{(res.total_price || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                  <div className="flex items-center justify-end gap-2 text-xs text-brand-gray-500">
                    {res.payment_status === 'pago' && <><CheckCircle className="h-3 w-3 text-green-500"/> Pago</>}
                    {res.payment_status === 'pendente' && <><AlertCircle className="h-3 w-3 text-yellow-500"/> Pendente</>}
                    {res.credit_used && res.credit_used > 0 && <CreditCard className="h-3 w-3 text-blue-500" title="Pago com crédito" />}
                    {res.rented_items && res.rented_items.length > 0 && <ShoppingBag className="h-3 w-3 text-purple-500" title="Itens alugados" />}
                  </div>
                </div>
                {!isPast && onCancel && (
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onCancel(res); }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const CreditsTab: React.FC<{balance: number, history: CreditTransaction[]}> = ({balance, history}) => (
  <div className="space-y-8">
    <CreditBalanceCard balance={balance} />
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
      <h3 className="text-xl font-semibold p-6">Histórico de Transações</h3>
      {history.length === 0 ? (
        <p className="px-6 pb-6 text-brand-gray-500">Nenhuma transação de crédito encontrada.</p>
      ) : (
        <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
          {history.map(item => (
            <li key={item.id} className="p-4 sm:p-6 flex justify-between items-center">
              <div>
                <p className={`font-medium ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{item.amount > 0 ? 'Crédito Adicionado' : 'Crédito Utilizado'}</p>
                <p className="text-sm text-brand-gray-500">{item.description}</p>
                <p className="text-xs text-brand-gray-400 mt-1">{item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm') : ''}</p>
              </div>
              <p className={`text-lg font-bold ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

const CreditBalanceCard: React.FC<{balance: number}> = ({balance}) => (
  <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white p-6 rounded-lg shadow-lg">
    <div className="flex justify-between items-center">
      <h3 className="font-semibold">Saldo de Crédito</h3>
      <CreditCard className="h-6 w-6" />
    </div>
    <p className="text-4xl font-bold mt-2">{balance.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
    <p className="text-sm opacity-80 mt-1">Use seu crédito para abater o valor de novas reservas.</p>
  </div>
);

const EmptyState: React.FC<{message: string}> = ({ message }) => (
  <div className="text-center h-full flex flex-col justify-center items-center py-10 px-6 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-700">
    <p className="text-brand-gray-600 dark:text-brand-gray-400">{message}</p>
  </div>
);

export default ClientDashboard;
