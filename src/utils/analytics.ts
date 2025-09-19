import { Quadra, Reserva } from '../types';
import { getDay, parse, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { parseDateStringAsLocal } from './dateUtils';

export const getAvailableSlotsForDay = (quadra: Quadra, date: Date): number => {
  if (quadra.status !== 'ativa' || !quadra.horarios) return 0;

  const dayOfWeek = getDay(date);
  
  let horario;
  if (dayOfWeek === 0) {
    horario = quadra.horarios.sunday;
  } else if (dayOfWeek === 6) {
    horario = quadra.horarios.saturday;
  } else {
    horario = quadra.horarios.weekday;
  }

  if (!horario || !horario.start || !horario.end) return 0;

  try {
    const startTime = parse(horario.start, 'HH:mm', date);
    let endTime = parse(horario.end, 'HH:mm', date);

    // Robustness check for invalid time strings
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return 0;
    }

    if (endTime <= startTime) endTime = addDays(endTime, 1);
    
    const intervalMinutes = quadra.booking_duration_minutes || 60;
    if (intervalMinutes <= 0) return 0;

    const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const slots = Math.floor(diffMinutes / intervalMinutes);
    return isNaN(slots) ? 0 : slots;
  } catch (e) {
    console.error("Erro ao parsear horário:", horario);
    return 0;
  }
};

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

export const generateCalendarDays = (
  currentMonth: Date,
  allReservas: Reserva[],
  quadras: Quadra[],
  selectedQuadraId: string | 'all'
) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfMonth = getDay(monthStart);
  
  const calendarDays = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ key: `empty-${i}`, isEmpty: true });
  }

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

export const calculateMonthlyOccupancy = (
  month: Date,
  allReservas: Reserva[],
  quadras: Quadra[]
): number => {
  const activeQuadras = quadras.filter(q => q.status === 'ativa');
  if (activeQuadras.length === 0) return 0;

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });

  let totalBookedHours = 0;
  let totalAvailableHours = 0;

  const calculateHoursInDay = (horario?: { start: string; end: string }): number => {
    if (!horario || !horario.start || !horario.end) return 0;
    try {
        const start = parse(horario.start, 'HH:mm', new Date());
        let end = parse(horario.end, 'HH:mm', new Date());
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return 0;
        }

        if (end <= start) {
            end = addDays(end, 1);
        }
        const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return isNaN(diff) ? 0 : diff;
    } catch (e) {
        return 0;
    }
  };

  for (const day of daysInMonth) {
    const dayOfWeek = getDay(day);
    
    for (const quadra of activeQuadras) {
        if (quadra.horarios) {
            let horario;
            if (dayOfWeek === 0) { // Sunday
                horario = quadra.horarios.sunday;
            } else if (dayOfWeek === 6) { // Saturday
                horario = quadra.horarios.saturday;
            } else { // Weekday
                horario = quadra.horarios.weekday;
            }
            totalAvailableHours += calculateHoursInDay(horario);
        }
    }
  }

  const monthlyBookings = allReservas.filter(r => {
    const rDate = parseDateStringAsLocal(r.date);
    return r.status !== 'cancelada' && rDate >= startOfMonth(month) && rDate <= endOfMonth(month);
  });

  totalBookedHours = monthlyBookings.reduce((sum, r) => {
    if (!r.start_time || !r.end_time) return sum;
    
    const startTime = parse(r.start_time, 'HH:mm', new Date());
    let endTime = parse(r.end_time, 'HH:mm', new Date());

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return sum;
    }

    if (endTime <= startTime) endTime = addDays(endTime, 1);
    
    const diffHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return sum + (isNaN(diffHours) ? 0 : diffHours);
  }, 0);

  if (totalAvailableHours === 0) return 0;

  const monthlyRate = (totalBookedHours / totalAvailableHours) * 100;
  return isNaN(monthlyRate) ? 0 : Math.min(monthlyRate, 100);
};
