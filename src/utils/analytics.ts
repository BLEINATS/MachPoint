import { Quadra, Reserva } from '../types';
import { getDay, parse, addMinutes, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { parseDateStringAsLocal } from './dateUtils';

/**
 * Calcula o número total de slots de reserva disponíveis para uma quadra em um dia específico.
 */
export const getAvailableSlotsForDay = (quadra: Quadra, date: Date): number => {
  if (quadra.status !== 'ativa') return 0;

  const dayOfWeek = getDay(date); // 0 = Dom, 1 = Seg, ...
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  const diasFuncionamento = quadra.horarios.diasFuncionamento;
  const diaDaSemanaStr = (['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const)[dayOfWeek];
  if (!diasFuncionamento[diaDaSemanaStr]) {
    return 0;
  }

  const horarioString = isWeekend ? quadra.horarios.horarioFimSemana : quadra.horarios.horarioSemana;
  if (!horarioString) return 0;

  let totalSlots = 0;
  const ranges = horarioString.split(',');
  for (const range of ranges) {
    const [startStr, endStr] = range.trim().split('-');
    if (!startStr || !endStr) continue;

    try {
      const startTime = parse(startStr, 'HH:mm', date);
      const endTime = parse(endStr, 'HH:mm', date);
      const intervalMinutes = quadra.booking_interval_minutes || 60;
      
      if (endTime > startTime) {
        const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        totalSlots += Math.floor(diffMinutes / intervalMinutes);
      }
    } catch (e) {
      console.error("Erro ao parsear horário:", range);
    }
  }
  return totalSlots;
};

/**
 * Calcula a taxa de ocupação para um dia específico, considerando um conjunto de quadras.
 */
export const calculateDailyOccupancy = (
  date: Date,
  allReservas: Reserva[],
  quadras: Quadra[],
  selectedQuadraId: string | 'all'
): { rate: number; booked: number; total: number } => {
  const relevantQuadras = selectedQuadraId === 'all'
    ? quadras.filter(q => q.status === 'ativa')
    : quadras.filter(q => q.id === selectedQuadraId && q.status === 'ativa');

  if (relevantQuadras.length === 0) {
    return { rate: 0, booked: 0, total: 0 };
  }

  const totalSlotsForDay = relevantQuadras.reduce((acc, quadra) => {
    return acc + getAvailableSlotsForDay(quadra, date);
  }, 0);

  const bookedSlotsForDay = allReservas.filter(reserva => {
    const reservaDate = parseDateStringAsLocal(reserva.date);
    return isSameDay(reservaDate, date) &&
           reserva.status !== 'cancelada' &&
           (selectedQuadraId === 'all' || reserva.quadra_id === selectedQuadraId);
  }).length;

  if (totalSlotsForDay === 0) {
    return { rate: 0, booked: bookedSlotsForDay, total: 0 };
  }

  const occupancyRate = (bookedSlotsForDay / totalSlotsForDay) * 100;

  return { rate: Math.min(occupancyRate, 100), booked: bookedSlotsForDay, total: totalSlotsForDay };
};

/**
 * Gera os dados para o calendário de ocupação.
 */
export const generateCalendarDays = (
  currentMonth: Date,
  allReservas: Reserva[],
  quadras: Quadra[],
  selectedQuadraId: string | 'all'
) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfMonth = getDay(monthStart); // 0 (Sun) - 6 (Sat)
  
  const calendarDays = [];

  // Adiciona dias vazios para o início do mês
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ key: `empty-${i}`, isEmpty: true });
  }

  // Adiciona os dias do mês
  for (const day of daysInMonth) {
    const occupancy = calculateDailyOccupancy(day, allReservas, quadras, selectedQuadraId);
    calendarDays.push({
      key: day.toISOString(),
      dayOfMonth: day.getDate(),
      date: day,
      occupancyRate: occupancy.rate,
      isEmpty: false,
    });
  }

  return calendarDays;
};
