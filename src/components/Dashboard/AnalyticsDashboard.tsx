import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, CheckCircle, AlertTriangle, DollarSign, Calendar, BarChart2, TrendingUp, Wallet } from 'lucide-react';
import { addMonths, subMonths, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import StatCard from './StatCard';
import OccupancyCalendar from './OccupancyCalendar';
import { Quadra, Reserva } from '../../types';
import { generateCalendarDays } from '../../utils/analytics';
import { expandRecurringReservations } from '../../utils/reservationUtils';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';

interface AnalyticsDashboardProps {
  onDayClick: (date: Date) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onDayClick }) => {
  const { arena } = useAuth();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedQuadraId, setSelectedQuadraId] = useState<'all' | string>('all');

  const loadData = useCallback(() => {
    if (arena) {
      const savedQuadras = localStorage.getItem(`quadras_${arena.id}`);
      if (savedQuadras) setQuadras(JSON.parse(savedQuadras));
      const savedReservas = localStorage.getItem(`reservas_${arena.id}`);
      if (savedReservas) setReservas(JSON.parse(savedReservas));
    }
  }, [arena]);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => {
      window.removeEventListener('focus', loadData);
    };
  }, [loadData]);


  const analyticsData = useMemo(() => {
    const totalQuadras = quadras.length;
    const quadrasAtivas = quadras.filter(q => q.status === 'ativa').length;
    const emManutencao = quadras.filter(q => q.status === 'manutencao').length;
    
    const avgPrice = quadras.length > 0
      ? quadras.reduce((sum, q) => sum + q.price_per_hour, 0) / quadras.length
      : 70; // fallback price
    
    const receitaEstimada = quadrasAtivas * avgPrice * 8 * 30 * 0.40;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const monthlyBookings = expandRecurringReservations(reservas, monthStart, monthEnd, quadras)
      .filter(r => r.status !== 'cancelada');

    const calendarDays = generateCalendarDays(currentMonth, monthlyBookings, quadras, selectedQuadraId);

    const receitaDoMes = monthlyBookings.reduce((sum, r) => {
      const quadra = quadras.find(q => q.id === r.quadra_id);
      return sum + (quadra?.price_per_hour || 0);
    }, 0);

    const todayBookings = monthlyBookings.filter(r => isSameDay(parseDateStringAsLocal(r.date), new Date())).length;

    const dailyOccupancies = calendarDays
      .filter(d => !d.isEmpty)
      .map(d => d.occupancyRate);
    
    const ocupacaoMedia = dailyOccupancies.length > 0 ? dailyOccupancies.reduce((a, b) => a + b, 0) / dailyOccupancies.length : 0;

    return {
      totalQuadras,
      quadrasAtivas,
      emManutencao,
      receitaEstimada,
      calendarDays,
      reservasNoMes: monthlyBookings.length,
      receitaDoMes,
      reservasHoje: todayBookings,
      ocupacaoMedia,
    };
  }, [quadras, reservas, currentMonth, selectedQuadraId]);

  const handleMonthChange = (direction: 'next' | 'prev') => {
    setCurrentMonth(current => direction === 'next' ? addMonths(current, 1) : subMonths(current, 1));
  };
  
  return (
    <div className="space-y-8 mb-12">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard index={0} icon={MapPin} label="Total de Quadras" value={analyticsData.totalQuadras} color="blue" />
        <StatCard index={1} icon={CheckCircle} label="Quadras Ativas" value={analyticsData.quadrasAtivas} color="green" />
        <StatCard index={2} icon={AlertTriangle} label="Em Manutenção" value={analyticsData.emManutencao} color="yellow" />
        <StatCard 
          index={3} 
          icon={DollarSign} 
          label="Receita Estimada" 
          value={`R$ ${analyticsData.receitaEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description={`${analyticsData.quadrasAtivas} quadras ativas × 40% ocupação (estimativa)`}
          color="red" 
        />
      </div>

      {/* Calendar and Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <OccupancyCalendar
            calendarDays={analyticsData.calendarDays}
            currentMonth={currentMonth}
            quadras={quadras}
            selectedQuadraId={selectedQuadraId}
            onMonthChange={handleMonthChange}
            onQuadraChange={setSelectedQuadraId}
            onDayClick={onDayClick}
          />
        </div>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white">Resumo do Mês</h3>
          <div className="space-y-4">
            <SummaryItem icon={Calendar} label="Reservas no Mês" value={analyticsData.reservasNoMes} />
            <SummaryItem icon={Wallet} label="Receita do Mês" value={`R$ ${analyticsData.receitaDoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            <SummaryItem icon={TrendingUp} label="Reservas Hoje" value={analyticsData.reservasHoje} />
            <SummaryItem icon={BarChart2} label="Ocupação Média" value={`${analyticsData.ocupacaoMedia.toFixed(0)}%`} />
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryItem: React.FC<{icon: React.ElementType, label: string, value: string | number}> = ({icon: Icon, label, value}) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
    className="flex items-center justify-between bg-white dark:bg-brand-gray-800 p-4 rounded-lg border border-brand-gray-200 dark:border-brand-gray-700"
  >
    <div className="flex items-center">
      <Icon className="h-5 w-5 text-brand-gray-500 mr-3" />
      <span className="text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">{label}</span>
    </div>
    <span className="font-bold text-brand-gray-900 dark:text-white">{value}</span>
  </motion.div>
);

export default AnalyticsDashboard;
