{/*
  ====================================================================
  || ATENÇÃO: CÓDIGO PROTEGIDO (BLINDADO) POR SOLICITAÇÃO DO USUÁRIO ||
  ====================================================================
  || Este arquivo contém a lógica crítica para salvar e cancelar     ||
  || reservas, incluindo a aplicação de créditos.                   ||
  ||                                                                ||
  || NÃO FAÇA ALTERAÇÕES NESTA LÓGICA SEM CONFIRMAÇÃO EXPLÍCITA.    ||
  || Antes de qualquer mudança, pergunte ao usuário:                ||
  || "Você confirma que deseja alterar a lógica de crédito/reserva?"  ||
  ====================================================================
*/}
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Calendar, List, Plus, SlidersHorizontal, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import Input from '../components/Forms/Input';
import { Quadra, Reserva, ReservationType, Aluno } from '../types';
import AgendaView from '../components/Reservations/AgendaView';
import ListView from '../components/Reservations/ListView';
import CalendarView from '../components/Reservations/CalendarView';
import ReservationModal from '../components/Reservations/ReservationModal';
import CancellationModal from '../components/Reservations/CancellationModal';
import ManualCancellationModal from '../components/Reservations/ManualCancellationModal';
import ReservationLegend from '../components/Reservations/ReservationLegend';
import FilterPanel from '../components/Reservations/FilterPanel';
import { startOfDay, format, startOfMonth, endOfMonth, isBefore, parse, addYears, subDays, getDay, addDays, endOfDay } from 'date-fns';
import { expandRecurringReservations } from '../utils/reservationUtils';
import { parseDateStringAsLocal } from '../utils/dateUtils';

type ViewMode = 'agenda' | 'calendar' | 'list';

const Reservations: React.FC = () => {
  const { arena } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reserva | null>(null);
  const [newReservationSlot, setNewReservationSlot] = useState<{ quadraId: string, time: string, type?: ReservationType } | null>(null);
  
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | Reserva['status'],
    type: 'all' as 'all' | ReservationType,
    clientName: '',
    quadraId: 'all' as 'all' | string,
  });

  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [isManualCancelModalOpen, setIsManualCancelModalOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<Reserva | null>(null);

  const loadData = useCallback(async () => {
    if (!arena) return;
    setIsLoading(true);
    try {
      const { data: quadrasData, error: quadrasError } = await supabase.from('quadras').select('*, pricing_rules(*)').eq('arena_id', arena.id);
      if (quadrasError) throw quadrasError;
      setQuadras(quadrasData || []);

      const { data: reservasData, error: reservasError } = await supabase
        .from('reservas')
        .select('id, arena_id, quadra_id, profile_id, turma_id, torneio_id, evento_id, clientName, clientPhone, date, start_time, end_time, status, type, total_price, credit_used, payment_status, sport_type, notes, isRecurring, recurringType, recurringEndDate, master_id, created_at, updated_at, rented_items')
        .eq('arena_id', arena.id);
      if (reservasError) throw reservasError;
      setReservas(reservasData || []);

      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('id, arena_id, profile_id, name, email, phone, status, sport, plan_name, monthly_fee, join_date, created_at, avatar_url, credit_balance')
        .eq('arena_id', arena.id);
      if (alunosError) throw alunosError;
      setAlunos(alunosData || []);

    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let stateHandled = false;
    if (location.state?.selectedDate) {
      const dateFromState = new Date(location.state.selectedDate);
      if (!isNaN(dateFromState.getTime())) {
        setSelectedDate(startOfDay(dateFromState));
        stateHandled = true;
      }
    }
    if (location.state?.quadraId) {
      setFilters(prev => ({ ...prev, quadraId: location.state.quadraId }));
      setIsFilterPanelOpen(true);
      setViewMode('agenda');
      stateHandled = true;
    }
     if (location.state?.openModal) {
      const type = location.state.type || 'normal';
      setNewReservationSlot({ quadraId: '', time: '', type });
      setSelectedReservation(null);
      setIsModalOpen(true);
      stateHandled = true;
    }
    if (stateHandled) navigate(location.pathname, { replace: true });
  }, [location.state, navigate]);

  const displayedReservations = useMemo(() => {
    let viewStartDate, viewEndDate;

    if (viewMode === 'list') {
      viewStartDate = new Date(2020, 0, 1);
      viewEndDate = addYears(new Date(), 5);
    } else if (viewMode === 'calendar') {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      viewStartDate = startOfDay(subDays(monthStart, getDay(monthStart)));
      viewEndDate = endOfDay(addDays(monthEnd, 6 - getDay(monthEnd)));
    } else { // 'agenda'
      viewStartDate = startOfDay(selectedDate);
      viewEndDate = endOfDay(selectedDate);
    }

    let allExpanded = expandRecurringReservations(reservas, viewStartDate, viewEndDate, quadras);

    if (filters.quadraId !== 'all') {
      allExpanded = allExpanded.filter(r => r.quadra_id === filters.quadraId);
    }
    if (filters.status !== 'all') {
      allExpanded = allExpanded.filter(r => r.status === filters.status);
    }
    if (filters.type !== 'all') {
      allExpanded = allExpanded.filter(r => r.type === filters.type);
    }
    if (filters.clientName.trim() !== '') {
      allExpanded = allExpanded.filter(r => r.clientName?.toLowerCase().includes(filters.clientName.trim().toLowerCase()));
    }
    
    return allExpanded;
  }, [reservas, selectedDate, quadras, filters, viewMode]);

  const filteredQuadras = useMemo(() => {
    if (filters.quadraId === 'all') return quadras;
    return quadras.filter(q => q.id === filters.quadraId);
  }, [quadras, filters.quadraId]);

  const activeFilterCount = Object.values(filters).filter(value => value !== 'all' && value !== '').length;

  const handleClearFilters = () => {
    setFilters({ status: 'all', type: 'all', clientName: '', quadraId: 'all' });
    setIsFilterPanelOpen(false);
  };

  const handleSaveReservation = async (reservaData: Omit<Reserva, 'id' | 'created_at'> | Reserva) => {
    if (!arena) return;
    const isEditing = 'id' in reservaData;
  
    try {
      const startTime = parse(reservaData.start_time, 'HH:mm', new Date());
      const endTime = parse(reservaData.end_time, 'HH:mm', new Date());
      if (isBefore(endTime, startTime) || startTime.getTime() === endTime.getTime()) {
        addToast({ message: "O horário de fim não pode ser anterior ou igual ao horário de início.", type: 'error' });
        return;
      }
      
      let alunoForReservation: { id: string; profile_id: string | null | undefined; } | null = null;
      const isNewClientEntry = !(reservaData as any).aluno_id && reservaData.clientName;

      if (isNewClientEntry) {
        const { data: existingAluno, error: findError } = await supabase
          .from('alunos')
          .select('id, profile_id')
          .eq('arena_id', arena.id)
          .or(`name.eq.${reservaData.clientName},phone.eq.${reservaData.clientPhone || 'INVALID_PHONE'}`)
          .limit(1)
          .single();

        if (findError && findError.code !== 'PGRST116') throw findError;

        if (existingAluno) {
          alunoForReservation = existingAluno;
        } else {
          const { data: newAlunoData, error: newAlunoError } = await supabase.from('alunos').insert({
            arena_id: arena.id,
            name: reservaData.clientName,
            phone: reservaData.clientPhone || null,
            email: null,
            status: 'ativo',
            plan_name: 'Avulso',
            join_date: format(new Date(), 'yyyy-MM-dd'),
          }).select('id, profile_id').single();

          if (newAlunoError) {
            addToast({ message: `Reserva criada, mas falha ao adicionar '${reservaData.clientName}' à lista de clientes.`, type: 'error'});
          } else if (newAlunoData) {
            alunoForReservation = newAlunoData;
          }
        }
      } else if ((reservaData as any).aluno_id) {
        const selected = alunos.find(a => a.id === (reservaData as any).aluno_id);
        if (selected) {
          alunoForReservation = { id: selected.id, profile_id: selected.profile_id };
        }
      }
  
      const dataToUpsert: Partial<Reserva> = { 
        ...reservaData, 
        arena_id: arena.id,
        profile_id: alunoForReservation?.profile_id || null,
      };
      
      // If we have an aluno record but no profile_id, try to find the profile via email
      if (alunoForReservation && !alunoForReservation.profile_id) {
        const alunoRecord = alunos.find(a => a.id === alunoForReservation!.id);
        if (alunoRecord && alunoRecord.email) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', alunoRecord.email)
              .single();
            
            if (profileData && !profileError) {
              dataToUpsert.profile_id = profileData.id;
      
              // Proactively update the aluno record for future use
              await supabase
                .from('alunos')
                .update({ profile_id: profileData.id })
                .eq('id', alunoRecord.id);
            }
          } catch (e) {
            console.warn("Could not find or link profile for aluno:", e);
          }
        }
      }

      delete (dataToUpsert as any).originalCreditUsed;
      delete (dataToUpsert as any).aluno_id;
        
      if (!dataToUpsert.profile_id) {
        delete dataToUpsert.profile_id;
      }
      if (!isEditing) {
        delete dataToUpsert.id;
      }
      
      const { data: savedReserva, error } = await supabase.from('reservas').upsert(dataToUpsert).select().single();
      if (error) throw error;
  
      if (savedReserva && savedReserva.credit_used && savedReserva.credit_used > 0) {
        const creditAmountUsed = savedReserva.credit_used;
        const originalCreditUsed = (reservaData as any).originalCreditUsed || 0;
        const newlyAppliedCredit = creditAmountUsed - originalCreditUsed;
        
        if (newlyAppliedCredit > 0 && alunoForReservation?.id) {
          const { error: rpcError } = await supabase.rpc('add_credit_to_aluno', {
            aluno_id_to_update: alunoForReservation.id,
            arena_id_to_check: arena.id,
            amount_to_add: -newlyAppliedCredit
          });
          if (rpcError) throw rpcError;
  
          await supabase.from('credit_transactions').insert({
            aluno_id: alunoForReservation.id,
            arena_id: arena.id,
            amount: -newlyAppliedCredit,
            type: 'reservation_payment',
            description: `Pagamento da reserva #${savedReserva.id.substring(0, 8)}`,
            related_reservation_id: savedReserva.id,
          });
        }
      }
  
      addToast({ message: `Reserva ${isEditing ? 'atualizada' : 'criada'} com sucesso!`, type: 'success' });
      closeModal();
      await loadData();
  
    } catch (error: any) {
      addToast({ message: `Erro ao salvar reserva: ${error.message}`, type: 'error' });
    }
  };

  const handleCancelReservation = async (reserva: Reserva) => {
    const masterId = reserva.masterId || reserva.id;

    const { data: masterReserva, error } = await supabase
      .from('reservas')
      .select('*')
      .eq('id', masterId)
      .single();

    if (error || !masterReserva) {
      addToast({ message: 'Erro ao encontrar a reserva original para cancelar.', type: 'error' });
      return;
    }
  
    if (masterReserva.total_price && masterReserva.total_price > 0) {
      setReservationToCancel(masterReserva);
      setIsCancellationModalOpen(true);
    } else {
      setReservationToCancel(masterReserva);
      setIsManualCancelModalOpen(true);
    }
    closeModal();
  };

  const handleConfirmManualCancel = async (reservaId: string) => {
    try {
        const { data: reserva, error: fetchError } = await supabase
            .from('reservas')
            .select('total_price')
            .eq('id', reservaId)
            .single();
        
        if (fetchError) throw fetchError;

        const updatePayload: { status: 'cancelada', payment_status?: 'pago' } = { status: 'cancelada' };
        if (reserva && reserva.total_price && reserva.total_price > 0) {
            updatePayload.payment_status = 'pago';
        }

        const { error } = await supabase.from('reservas').update(updatePayload).eq('id', reservaId);
        if (error) throw error;
        addToast({ message: 'Reserva cancelada com sucesso!', type: 'success' });
        await loadData();
    } catch (error: any) {
        addToast({ message: `Erro ao cancelar reserva: ${error.message}`, type: 'error' });
    } finally {
        setIsManualCancelModalOpen(false);
        setReservationToCancel(null);
    }
  };

  const handleConfirmCancellation = async (reservaId: string, creditAmount: number, reason: string) => {
    if (!arena) return;

    try {
        const { data: reserva, error: fetchError } = await supabase
            .from('reservas')
            .select('*')
            .eq('id', reservaId)
            .single();

        if (fetchError || !reserva) {
            throw fetchError || new Error('Reserva não encontrada para cancelamento.');
        }

        const updatePayload: { status: 'cancelada', payment_status?: 'pago' } = { status: 'cancelada' };
        if (creditAmount === 0 && reserva.total_price && reserva.total_price > 0) {
            updatePayload.payment_status = 'pago';
        }

        await supabase.from('reservas').update(updatePayload).eq('id', reservaId);

        if (creditAmount > 0) {
            let targetAluno: Aluno | undefined = undefined;

            if (reserva.profile_id) {
                targetAluno = alunos.find(a => a.profile_id === reserva.profile_id);
            }

            if (!targetAluno && reserva.clientName) {
                targetAluno = alunos.find(a => a.name === reserva.clientName);
            }

            if (targetAluno) {
                const { error: rpcError } = await supabase.rpc('add_credit_to_aluno', {
                    aluno_id_to_update: targetAluno.id,
                    arena_id_to_check: arena.id,
                    amount_to_add: creditAmount
                });
                if (rpcError) throw rpcError;
                
                await supabase.from('credit_transactions').insert({
                    aluno_id: targetAluno.id,
                    arena_id: arena.id,
                    amount: creditAmount,
                    type: 'cancellation_credit',
                    description: `Crédito (${reason}) da reserva #${reserva.id.substring(0, 8)}`,
                    related_reservation_id: reserva.id,
                });
                
                addToast({ message: 'Reserva cancelada e crédito aplicado com sucesso!', type: 'success' });
            } else {
                addToast({ 
                    message: `Reserva cancelada. O crédito de ${creditAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} deve ser gerenciado manualmente, pois o cliente não foi encontrado.`, 
                    type: 'info' 
                });
            }
        } else {
            addToast({ message: 'Reserva cancelada com sucesso!', type: 'success' });
        }

        setIsCancellationModalOpen(false);
        setReservationToCancel(null);
        await loadData();

    } catch (error: any) {
        addToast({ message: `Erro ao processar cancelamento: ${error.message}`, type: 'error' });
    }
  };

  const openNewReservationModal = (quadraId: string, time: string) => {
    setNewReservationSlot({ quadraId, time, type: 'normal' });
    setSelectedReservation(null);
    setIsModalOpen(true);
  };
  
  const openNewReservationOnDay = (date: Date, time?: string) => {
    setSelectedDate(date);
    setNewReservationSlot({ quadraId: filters.quadraId !== 'all' ? filters.quadraId : '', time: time || '' });
    setSelectedReservation(null);
    setIsModalOpen(true);
  };

  const openEditReservationModal = (reserva: Reserva) => {
    const master = reserva.masterId ? reservas.find(r => r.id === reserva.masterId) : reserva;
    setSelectedReservation(master || null);
    setNewReservationSlot(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
    setNewReservationSlot(null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseDateStringAsLocal(e.target.value);
    if (!isNaN(newDate.getTime())) setSelectedDate(newDate);
  };

  return (
    <Layout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Voltar para o Dashboard</Link>
          <div>
            <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Hub de Reservas</h1>
            <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Visualize e gerencie todas as suas reservas em um só lugar.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-4 mb-8 border border-brand-gray-200 dark:border-brand-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4">
            <div className="flex items-center space-x-1 bg-brand-gray-100 dark:bg-brand-gray-900 p-1 rounded-lg">
              {(['agenda', 'calendar', 'list'] as ViewMode[]).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${viewMode === mode ? 'bg-white dark:bg-brand-gray-700 text-brand-blue-600 dark:text-white shadow' : 'text-brand-gray-600 dark:text-brand-gray-300 hover:bg-white/50 dark:hover:bg-brand-gray-700/50'}`}>
                  {mode === 'agenda' && <LayoutGrid className="h-4 w-4 inline-block sm:mr-1" />}
                  {mode === 'calendar' && <Calendar className="h-4 w-4 inline-block sm:mr-1" />}
                  {mode === 'list' && <List className="h-4 w-4 inline-block sm:mr-1" />}
                  <span className="capitalize hidden sm:inline-block">{mode}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center flex-wrap justify-center gap-4">
              <Input type="date" value={format(selectedDate, 'yyyy-MM-dd')} onChange={handleDateChange} className="py-1.5"/>
              <div className="relative">
                <Button variant={activeFilterCount > 0 ? 'primary' : 'outline'} onClick={() => setIsFilterPanelOpen(prev => !prev)}>
                  <SlidersHorizontal className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Filtros</span>
                  {activeFilterCount > 0 && <span className="ml-2 bg-white dark:bg-brand-gray-900 text-brand-blue-500 dark:text-brand-blue-400 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}
                </Button>
              </div>
              <Button onClick={() => openNewReservationModal(filters.quadraId !== 'all' ? filters.quadraId : '', '')}><Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Nova Reserva</span></Button>
            </div>
          </div>
          <AnimatePresence>{isFilterPanelOpen && <FilterPanel filters={filters} onFilterChange={setFilters} onClearFilters={handleClearFilters} quadras={quadras}/>}</AnimatePresence>
        </div>
        <ReservationLegend />
        <AnimatePresence mode="wait">
          <motion.div key={viewMode + filters.quadraId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {isLoading ? <div className="text-center py-16"><Loader2 className="w-8 h-8 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (() => {
              switch (viewMode) {
                case 'agenda': return <AgendaView quadras={filteredQuadras} reservas={displayedReservations} selectedDate={selectedDate} onSlotClick={openNewReservationModal} onReservationClick={openEditReservationModal} />;
                case 'calendar': return <CalendarView quadras={quadras} reservas={displayedReservations} onReservationClick={openEditReservationModal} selectedDate={selectedDate} onDateChange={setSelectedDate} onDayDoubleClick={openNewReservationOnDay} onSlotClick={openNewReservationOnDay} />;
                case 'list': return <ListView quadras={quadras} reservas={displayedReservations} onReservationClick={openEditReservationModal} />;
                default: return null;
              }
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isModalOpen && <ReservationModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSaveReservation} onCancelReservation={handleCancelReservation} reservation={selectedReservation} newReservationSlot={newReservationSlot} quadras={quadras} alunos={alunos} allReservations={reservas} arenaId={arena?.id || ''} selectedDate={selectedDate} />}
      </AnimatePresence>
      <AnimatePresence>
        {isCancellationModalOpen && (
            <CancellationModal
                isOpen={isCancellationModalOpen}
                onClose={() => {
                    setIsCancellationModalOpen(false);
                    setReservationToCancel(null);
                }}
                onConfirm={handleConfirmCancellation}
                reserva={reservationToCancel}
            />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isManualCancelModalOpen && (
            <ManualCancellationModal
                isOpen={isManualCancelModalOpen}
                onClose={() => {
                    setIsManualCancelModalOpen(false);
                    setReservationToCancel(null);
                }}
                onConfirm={() => reservationToCancel && handleConfirmManualCancel(reservationToCancel.id)}
                reservaName={reservationToCancel?.clientName || 'Reserva'}
            />
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Reservations;
