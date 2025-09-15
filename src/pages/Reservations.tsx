import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Calendar, List, Plus, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import Input from '../components/Forms/Input';
import { Quadra, Reserva, ReservationType } from '../types';
import AgendaView from '../components/Reservations/AgendaView';
import ListView from '../components/Reservations/ListView';
import CalendarView from '../components/Reservations/CalendarView';
import ReservationModal from '../components/Reservations/ReservationModal';
import ReservationLegend from '../components/Reservations/ReservationLegend';
import FilterPanel from '../components/Reservations/FilterPanel';
import { startOfDay, format, startOfMonth, endOfMonth, isBefore, parse } from 'date-fns';
import { expandRecurringReservations, hasTimeConflict } from '../utils/reservationUtils';
import { parseDateStringAsLocal } from '../utils/dateUtils';

type ViewMode = 'agenda' | 'calendar' | 'list';

const Reservations: React.FC = () => {
  const { arena } = useAuth();
  const location = useLocation();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]); // Apenas as reservas "master"
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reserva | null>(null);
  const [newReservationSlot, setNewReservationSlot] = useState<{ quadraId: string, time: string } | null>(null);
  
  // Filtros
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | Reserva['status'],
    type: 'all' as 'all' | ReservationType,
    clientName: '',
    quadraId: 'all' as 'all' | string,
  });

  useEffect(() => {
    if (location.state?.selectedDate) {
      const dateFromState = new Date(location.state.selectedDate);
      if (!isNaN(dateFromState.getTime())) {
        setSelectedDate(startOfDay(dateFromState));
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (arena) {
      const savedQuadras = localStorage.getItem(`quadras_${arena.id}`);
      if (savedQuadras) setQuadras(JSON.parse(savedQuadras));
      const savedReservas = localStorage.getItem(`reservas_${arena.id}`);
      if (savedReservas) setReservas(JSON.parse(savedReservas));
    }
  }, [arena]);

  const displayedReservations = useMemo(() => {
    const viewStartDate = startOfMonth(selectedDate);
    const viewEndDate = endOfMonth(selectedDate);
    let allExpanded = expandRecurringReservations(reservas, viewStartDate, viewEndDate, quadras);

    // Aplicar filtros
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
      allExpanded = allExpanded.filter(r => 
        r.clientName?.toLowerCase().includes(filters.clientName.trim().toLowerCase())
      );
    }
    
    return allExpanded;
  }, [reservas, selectedDate, quadras, filters]);

  const filteredQuadras = useMemo(() => {
    if (filters.quadraId === 'all') return quadras;
    return quadras.filter(q => q.id === filters.quadraId);
  }, [quadras, filters.quadraId]);

  const activeFilterCount = Object.values(filters).filter(value => value !== 'all' && value !== '').length;

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      clientName: '',
      quadraId: 'all',
    });
    setIsFilterPanelOpen(false);
  };


  const handleSaveReservation = (reserva: Reserva) => {
    if (!arena) return;

    const isEditing = !!reservas.find(r => r.id === reserva.id);

    // Validação de horário de fim vs início
    const startTime = parse(reserva.start_time, 'HH:mm', new Date());
    const endTime = parse(reserva.end_time, 'HH:mm', new Date());

    if (isBefore(endTime, startTime) || startTime.getTime() === endTime.getTime()) {
      alert("O horário de fim não pode ser anterior ou igual ao horário de início.");
      return;
    }

    // Validação de horário passado (APENAS para novas reservas)
    if (!isEditing) {
      const now = new Date();
      const reservationDate = parseDateStringAsLocal(reserva.date);
      const reservationStartDateTime = parse(reserva.start_time, 'HH:mm', reservationDate);
      
      if (isBefore(reservationStartDateTime, now)) {
        alert("Não é possível criar uma reserva em um horário que já passou.");
        return;
      }
    }

    // Validação de conflito
    if (hasTimeConflict(reserva, reservas, quadras)) {
      alert("Este horário conflita com outra reserva existente (ou uma de suas futuras ocorrências).");
      return;
    }

    const updatedReservas = isEditing
      ? reservas.map(r => r.id === reserva.id ? reserva : r)
      : [...reservas, reserva];
    
    setReservas(updatedReservas);
    localStorage.setItem(`reservas_${arena.id}`, JSON.stringify(updatedReservas));
    alert(`Reserva ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
    closeModal();
  };

  const handleCancelReservation = (reservaId: string) => {
    if (!arena) return;
    const updatedReservas = reservas.map(r => r.id === reservaId ? { ...r, status: 'cancelada' } : r);
    setReservas(updatedReservas);
    localStorage.setItem(`reservas_${arena.id}`, JSON.stringify(updatedReservas));
    alert("Reserva cancelada.");
    closeModal();
  };

  const openNewReservationModal = (quadraId: string, time: string) => {
    setNewReservationSlot({ quadraId, time });
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
    // Se for uma instância virtual, abra o mestre para edição
    if (reserva.masterId) {
      const master = reservas.find(r => r.id === reserva.masterId);
      setSelectedReservation(master || null);
    } else {
      setSelectedReservation(reserva);
    }
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
    if (!isNaN(newDate.getTime())) {
        setSelectedDate(newDate);
    }
  };

  return (
    <Layout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Hub de Reservas</h1>
            <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Visualize e gerencie todas as suas reservas em um só lugar.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-4 mb-8 border border-brand-gray-200 dark:border-brand-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4">
            <div className="flex items-center space-x-1 bg-brand-gray-100 dark:bg-brand-gray-900 p-1 rounded-lg">
              {(['agenda', 'calendar', 'list'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${
                    viewMode === mode ? 'bg-white dark:bg-brand-gray-700 text-brand-blue-600 dark:text-white shadow' : 'text-brand-gray-600 dark:text-brand-gray-300 hover:bg-white/50 dark:hover:bg-brand-gray-700/50'
                  }`}
                >
                  {mode === 'agenda' && <LayoutGrid className="h-4 w-4 inline-block sm:mr-1" />}
                  {mode === 'calendar' && <Calendar className="h-4 w-4 inline-block sm:mr-1" />}
                  {mode === 'list' && <List className="h-4 w-4 inline-block sm:mr-1" />}
                  <span className="capitalize hidden sm:inline-block">{mode}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center flex-wrap justify-center gap-4">
              <Input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                className="py-1.5"
              />
              <div className="relative">
                <Button 
                  variant={activeFilterCount > 0 ? 'primary' : 'outline'}
                  onClick={() => setIsFilterPanelOpen(prev => !prev)}
                >
                  <SlidersHorizontal className="h-4 w-4 sm:mr-2" /> 
                  <span className="hidden sm:inline">Filtros</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-2 bg-white dark:bg-brand-gray-900 text-brand-blue-500 dark:text-brand-blue-400 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>
              <Button onClick={() => openNewReservationModal(filters.quadraId !== 'all' ? filters.quadraId : '', '')}><Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Nova Reserva</span></Button>
            </div>
          </div>
          <AnimatePresence>
            {isFilterPanelOpen && (
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={handleClearFilters}
                quadras={quadras}
              />
            )}
          </AnimatePresence>
        </div>
        
        <ReservationLegend />

        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode + filters.quadraId} // Re-render when quadra filter changes
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {(() => {
              switch (viewMode) {
                case 'agenda':
                  return <AgendaView quadras={filteredQuadras} reservas={displayedReservations} selectedDate={selectedDate} onSlotClick={openNewReservationModal} onReservationClick={openEditReservationModal} />;
                case 'calendar':
                  return <CalendarView quadras={quadras} reservas={displayedReservations} onReservationClick={openEditReservationModal} selectedDate={selectedDate} onDateChange={setSelectedDate} onDayDoubleClick={openNewReservationOnDay} onSlotClick={openNewReservationOnDay} />;
                case 'list':
                  return <ListView quadras={quadras} reservas={displayedReservations} onReservationClick={openEditReservationModal} />;
                default:
                  return null;
              }
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {isModalOpen && (
          <ReservationModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onSave={handleSaveReservation}
            onCancelReservation={handleCancelReservation}
            reservation={selectedReservation}
            newReservationSlot={newReservationSlot}
            quadras={quadras}
            arenaId={arena?.id || ''}
            selectedDate={selectedDate}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Reservations;
