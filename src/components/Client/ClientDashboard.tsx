import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Quadra, Reserva, Aluno, Turma, Professor, CreditTransaction, ReservationType, Profile } from '../../types';
import { Calendar, History, Compass, Search, Sparkles, GraduationCap, CreditCard, LayoutDashboard, Loader2, CheckCircle, AlertCircle, ShoppingBag, Clock } from 'lucide-react';
import { isAfter, startOfDay, isSameDay, format, parse, getDay, addDays, isBefore, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import UpcomingReservationCard from './UpcomingReservationCard';
import Button from '../Forms/Button';
import ArenaSelector from './ArenaSelector';
import NextClassCard from './Student/NextClassCard';
import ReservationModal from '../Reservations/ReservationModal';
import { useToast } from '../../context/ToastContext';
import { getAvailableTimeRangesForDay } from '../../utils/analytics';
import { expandRecurringReservations } from '../../utils/reservationUtils';

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
        supabase.from('quadras').select('id, name, sport_type, location, horarios, status, booking_duration_minutes').eq('arena_id', selectedArenaContext.id),
        supabase.from('reservas').select('id, quadra_id, date, start_time, end_time, status, total_price, payment_status, credit_used, rented_items').eq('profile_id', profile.id).eq('arena_id', selectedArenaContext.id),
        supabase.from('reservas').select('id, quadra_id, date, start_time, end_time, status, isRecurring, recurringType, recurringEndDate, master_id').eq('arena_id', selectedArenaContext.id),
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
    
    try {
      let alunoRecord: Aluno | null = alunoProfileForSelectedArena;
      if (!alunoRecord) {
        const { data: alunoId, error: rpcError } = await supabase.rpc('get_or_create_my_aluno_profile', {
          p_arena_id: selectedArenaContext.id
        });

        if (rpcError) throw rpcError;
        if (!alunoId) throw new Error("Não foi possível criar o perfil de cliente na arena.");

        const { data: newAlunoData, error: fetchError } = await supabase
          .from('alunos')
          .select('*')
          .eq('id', alunoId)
          .single();

        if (fetchError) throw fetchError;
        
        alunoRecord = newAlunoData;
        refreshAlunoProfile();
      }

      if (!alunoRecord) {
        addToast({ message: 'Erro ao obter ou criar perfil de cliente na arena.', type: 'error' });
        return;
      }

      const dataToUpsert: Partial<Reserva> = {
        ...reservationData,
        arena_id: selectedArenaContext.id,
        profile_id: profile.id,
        clientName: profile.name,
        clientPhone: reservationData.clientPhone || alunoRecord.phone || '',
      };

      delete (dataToUpsert as any).originalCreditUsed;
      delete dataToUpsert.id;
        
      const { data: savedReservas, error } = await supabase.from('reservas').insert(dataToUpsert).select();
      if (error) throw error;
      
      const savedReserva = savedReservas?.[0];
      if (!savedReserva) {
        throw new Error("A reserva foi criada, mas não foi possível obter os dados de confirmação.");
      }

      if (savedReserva && savedReserva.credit_used && savedReserva.credit_used > 0) {
        const { error: rpcError } = await supabase.rpc('add_credit_to_aluno', {
          aluno_id_to_update: alunoRecord.id,
          arena_id_to_check: selectedArenaContext.id,
          amount_to_add: -savedReserva.credit_used
        });
        if (rpcError) throw rpcError;

        await supabase.from('credit_transactions').insert({
          aluno_id: alunoRecord.id,
          arena_id: selectedArenaContext.id,
          amount: -savedReserva.credit_used,
          type: 'reservation_payment',
          description: `Pagamento da reserva #${savedReserva.id.substring(0, 8)}`,
          related_reservation_id: savedReserva.id,
        });
      }

      addToast({ message: 'Reserva criada com sucesso!', type: 'success' });
      setIsModalOpen(false);
      setModalSlot(null);
      refreshAlunoProfile();
      await loadData();

    } catch (error: any) {
      addToast({ message: `Erro ao criar reserva: ${error.message}`, type: 'error' });
    }
  };


  const upcomingReservations = useMemo(() => {
    const today = startOfDay(new Date());
    return reservas
      .filter(r => (isAfter(parseDateStringAsLocal(r.date), today) || isSameDay(parseDateStringAsLocal(r.date), today)) && r.status === 'confirmada')
      .sort((a, b) => parseDateStringAsLocal(a.date).getTime() - parseDateStringAsLocal(a.start_time).getTime() || a.start_time.localeCompare(b.start_time));
  }, [reservas]);

  const pastReservations = useMemo(() => {
    const today = startOfDay(new Date());
    return reservas
      .filter(r => isBefore(parseDateStringAsLocal(r.date), today))
      .sort((a, b) => parseDateStringAsLocal(b.date).getTime() - parseDateStringAsLocal(a.date).getTime());
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
    { id: 'reservations', label: 'Minhas Reservas', icon: Calendar },
    { id: 'credits', label: 'Meus Créditos', icon: CreditCard },
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
               />;
      case 'reservations':
        return <ReservationsTab upcoming={upcomingReservations} past={pastReservations} quadras={quadras} />;
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
            selectedDate={new Date()}
            isClientBooking={true}
            userProfile={profile}
            clientProfile={alunoProfileForSelectedArena}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const OverviewTab: React.FC<{creditBalance: number, nextReservation?: Reserva, nextClass?: any, quadras: Quadra[], reservas: Reserva[], onSlotClick: (time: string, quadraId: string) => void}> = ({creditBalance, nextReservation, nextClass, quadras, reservas, onSlotClick}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-8">
      {nextClass && <NextClassCard date={nextClass.date} turmaName={nextClass.turma.name} quadraName={nextClass.quadra?.name} professorName={nextClass.professor?.name} startTime={nextClass.turma.start_time} />}
      {nextReservation && <UpcomingReservationCard reservation={nextReservation} quadra={quadras.find(q => q.id === nextReservation.quadra_id)} index={0} />}
      {!nextClass && !nextReservation && <EmptyState message="Você não tem nenhuma atividade agendada." />}
      <AvailableSlotsWidget quadras={quadras} reservas={reservas} onSlotClick={onSlotClick} />
    </div>
    <div className="space-y-8">
      <CreditBalanceCard balance={creditBalance} />
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 p-6">
        <h3 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 mb-4 flex items-center"><Sparkles className="h-5 w-5 mr-2 text-yellow-400" /> Recomendações</h3>
        <p className="text-sm text-brand-gray-500">Em breve, você verá aqui horários recomendados para você.</p>
      </div>
    </div>
  </div>
);

const AvailableSlotsWidget: React.FC<{quadras: Quadra[], reservas: Reserva[], onSlotClick: (time: string, quadraId: string) => void}> = ({quadras, reservas, onSlotClick}) => {
  const availableSlots = useMemo(() => {
    const today = new Date();
    const allExpandedReservations = expandRecurringReservations(reservas, startOfDay(today), endOfDay(today), quadras);
    return getAvailableTimeRangesForDay(quadras, allExpandedReservations, today);
  }, [quadras, reservas]);

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 p-6">
      <h3 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 mb-4 flex items-center"><Clock className="h-5 w-5 mr-2 text-brand-blue-500" /> Horários Livres Hoje</h3>
      {availableSlots.length > 0 ? (
        <div className="space-y-4">
          {availableSlots.map(court => (
            <div key={court.courtId}>
              <h4 className="font-semibold text-sm text-brand-gray-700 dark:text-brand-gray-300 mb-2">{court.courtName}</h4>
              <div className="flex flex-wrap gap-2">
                {court.ranges.slice(0, 5).map(range => {
                  const startTime = range.split(' - ')[0];
                  return (
                    <Button key={`${court.courtId}-${range}`} size="sm" variant="outline" onClick={() => onSlotClick(startTime, court.courtId)}>
                      {range}
                    </Button>
                  );
                })}
                {court.ranges.length > 5 && <span className="text-xs text-brand-gray-500 self-center">...e mais</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-brand-gray-500">Nenhum horário livre encontrado para hoje.</p>
      )}
    </div>
  );
};

const ReservationsTab: React.FC<{upcoming: Reserva[], past: Reserva[], quadras: Quadra[]}> = ({upcoming, past, quadras}) => (
  <div className="space-y-8">
    <ReservationList title="Próximas Reservas" reservations={upcoming} quadras={quadras} />
    <ReservationList title="Histórico de Reservas" reservations={past} quadras={quadras} isPast />
  </div>
);

const ReservationList: React.FC<{title: string, reservations: Reserva[], quadras: Quadra[], isPast?: boolean}> = ({title, reservations, quadras, isPast}) => (
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
                <p className="font-bold text-brand-gray-900 dark:text-white">{quadras.find(q => q.id === res.quadra_id)?.name}</p>
                <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
                  {format(parseDateStringAsLocal(res.date), "dd/MM/yyyy")} • {res.start_time} - {res.end_time}
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
                {!isPast && (
                  <Button variant="outline" size="sm" onClick={() => alert('Função de cancelamento em desenvolvimento.')}>
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
      <h3 className="font-semibold">Meu Saldo de Crédito</h3>
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
