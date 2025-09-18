import React from 'react';
import { format, setHours, setMinutes, isWithinInterval, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Quadra, Reserva } from '../../types';
import { Plus } from 'lucide-react';
import { getReservationTypeDetails } from '../../utils/reservationUtils';

interface DayDetailViewProps {
  date: Date;
  reservas: Reserva[];
  quadras: Quadra[];
  onSlotClick: (time: string) => void;
}

const DayDetailView: React.FC<DayDetailViewProps> = ({ date, reservas, quadras, onSlotClick }) => {
  const timeSlots = Array.from({ length: (23 - 6) * 2 }, (_, i) => {
    const totalMinutes = 6 * 60 + i * 30;
    return setMinutes(setHours(new Date(), 0), totalMinutes);
  });

  const getReservationForSlot = (slot: Date) => {
    return reservas.find(r => {
      const startTime = parse(r.start_time, 'HH:mm', date);
      const endTime = parse(r.end_time, 'HH:mm', date);
      return isWithinInterval(slot, { start: startTime, end: new Date(endTime.getTime() - 1) });
    });
  };
  
  const getQuadraName = (id: string) => quadras.find(q => q.id === id)?.name || 'N/A';

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700 h-full">
      <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-1">
        {format(date, "eeee, dd 'de' MMMM", { locale: ptBR })}
      </h3>
      <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mb-6">Horários do Dia</p>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
        {timeSlots.map((slot, index) => {
          const reserva = getReservationForSlot(slot);
          if (reserva) {
            if (format(slot, 'HH:mm') !== reserva.start_time.slice(0, 5)) {
              return null;
            }
            
            const typeDetails = getReservationTypeDetails(reserva.type);
            const startTime = parse(reserva.start_time, 'HH:mm', date);
            const endTime = parse(reserva.end_time, 'HH:mm', date);
            const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 30);

            return (
              <div key={reserva.id} className={`p-3 rounded-lg text-white ${typeDetails.bgColor}`} style={{ minHeight: `${duration * 2.5}rem` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm">{reserva.clientName || typeDetails.label}</p>
                    <p className="text-xs opacity-90">{getQuadraName(reserva.quadra_id)}</p>
                  </div>
                  <p className="text-xs font-medium bg-black/20 px-1.5 py-0.5 rounded-full">{reserva.start_time.slice(0, 5)} - {reserva.end_time.slice(0, 5)}</p>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={index}
              onClick={() => onSlotClick(format(slot, 'HH:mm'))}
              className="h-10 flex items-center justify-between p-3 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-transparent hover:border-blue-300 dark:hover:border-blue-500/30 cursor-pointer transition-colors"
            >
              <span className="text-xs font-medium text-brand-gray-400">{format(slot, 'HH:mm')}</span>
              <Plus className="h-4 w-4 text-brand-gray-400" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayDetailView;
