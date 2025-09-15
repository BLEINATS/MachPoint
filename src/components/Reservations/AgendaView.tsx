import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parse, isSameDay } from 'date-fns';
import { Quadra, Reserva } from '../../types';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { Repeat, Plus } from 'lucide-react';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface AgendaViewProps {
  quadras: Quadra[];
  reservas: Reserva[];
  selectedDate: Date;
  onSlotClick: (quadraId: string, time: string) => void;
  onReservationClick: (reserva: Reserva) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ quadras, reservas, selectedDate, onSlotClick, onReservationClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const timeSlots = Array.from({ length: (23 - 6) * 2 + 1 }, (_, i) => {
    const totalMinutes = 6 * 60 + i * 30;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setMinutes(totalMinutes);
    return format(date, 'HH:mm');
  });

  useEffect(() => {
    const am8 = containerRef.current?.querySelector('[data-time-label="08:00"]');
    if (am8) {
      am8.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, []);

  const reservationsForDay = reservas.filter(r => isSameDay(parseDateStringAsLocal(r.date), selectedDate) && r.status !== 'cancelada');

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden">
      <div ref={containerRef} className="max-h-[70vh] overflow-auto relative">
        {/* Camada de Fundo: Grade e Células Clicáveis */}
        <div className="grid" style={{ gridTemplateColumns: `60px repeat(${quadras.length}, minmax(150px, 1fr))` }}>
          {/* Header Fixo */}
          <div className="sticky top-0 z-20 bg-brand-gray-50 dark:bg-brand-gray-700 p-2 border-b border-r border-brand-gray-200 dark:border-brand-gray-600"></div>
          {quadras.map((quadra) => (
            <div key={`${quadra.id}-header`} className="sticky top-0 z-20 bg-brand-gray-50 dark:bg-brand-gray-700 p-3 text-center border-b border-r border-brand-gray-200 dark:border-brand-gray-600">
              <p className="font-semibold text-sm text-brand-gray-900 dark:text-white truncate">{quadra.name}</p>
            </div>
          ))}

          {/* Coluna de Horários */}
          <div className="col-start-1 col-end-2 row-start-2">
            {timeSlots.map(time => (
              <div key={time} data-time-label={time} className="h-12 flex items-center justify-center border-r border-b border-brand-gray-200 dark:border-brand-gray-700">
                <span className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{time}</span>
              </div>
            ))}
          </div>

          {/* Colunas das Quadras com Células Vazias Clicáveis */}
          {quadras.map((quadra, quadraIndex) => (
            <div key={`${quadra.id}-slots`} style={{ gridColumnStart: quadraIndex + 2, gridRowStart: 2 }}>
              {timeSlots.map(time => (
                <div
                  key={time}
                  onClick={() => onSlotClick(quadra.id, time)}
                  className="h-12 border-r border-b border-brand-gray-200 dark:border-brand-gray-700 hover:bg-blue-50 dark:hover:bg-brand-blue-500/10 cursor-pointer group flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 text-brand-gray-300 dark:text-brand-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Camada de Overlay: Blocos de Reserva */}
        <div 
          className="absolute top-[49px] left-0 w-full h-full grid" 
          style={{ gridTemplateColumns: `60px repeat(${quadras.length}, minmax(150px, 1fr))`, pointerEvents: 'none' }}
        >
          {/* Coluna vazia para alinhar com os horários */}
          <div /> 

          {/* Colunas para renderizar os blocos */}
          {quadras.map((quadra, quadraIndex) => (
            <div key={`${quadra.id}-reservations`} className="relative" style={{ gridColumnStart: quadraIndex + 2 }}>
              {reservationsForDay
                .filter(r => r.quadra_id === quadra.id)
                .map(reservation => {
                  const startTime = parse(reservation.start_time, 'HH:mm', new Date());
                  const endTime = parse(reservation.end_time, 'HH:mm', new Date());
                  
                  let startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
                  let endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
                  if (endMinutes <= startMinutes) endMinutes += 24 * 60;
                  
                  const topOffsetMinutes = startMinutes - (6 * 60);
                  const durationMinutes = endMinutes - startMinutes;
                  
                  const top = (topOffsetMinutes / 30) * 3;
                  const height = (durationMinutes / 30) * 3;

                  if (height <= 0) return null;

                  const typeDetails = getReservationTypeDetails(reservation.type);
                  const Icon = typeDetails.icon;

                  return (
                    <motion.div
                      key={reservation.id}
                      onClick={(e) => { e.stopPropagation(); onReservationClick(reservation); }}
                      className={`absolute w-[calc(100%-4px)] m-0.5 p-2 rounded-lg text-white text-xs cursor-pointer shadow-lg z-10 flex flex-col overflow-hidden ${typeDetails.bgColor} bg-opacity-90 border-l-4 ${typeDetails.borderColor}`}
                      style={{
                          top: `${top}rem`,
                          height: `calc(${height}rem - 4px)`,
                          pointerEvents: 'auto', // Re-abilita eventos de clique para este bloco
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      layout
                    >
                      <p className="font-bold flex items-center flex-shrink-0">
                        <Icon className="h-3 w-3 mr-1 flex-shrink-0" />
                        {reservation.isRecurring && <Repeat className="h-3 w-3 mr-1 flex-shrink-0" />}
                        <span className="truncate">{reservation.clientName || 'Cliente'}</span>
                      </p>
                      <p className="flex-shrink-0">{reservation.start_time} - {reservation.end_time}</p>
                      {reservation.notes && <p className="text-xs opacity-80 mt-1 italic truncate">{reservation.notes}</p>}
                    </motion.div>
                  );
                })
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgendaView;
