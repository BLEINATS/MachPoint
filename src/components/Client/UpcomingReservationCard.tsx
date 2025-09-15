import React from 'react';
import { motion } from 'framer-motion';
import { Reserva, Quadra } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, QrCode } from 'lucide-react';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface UpcomingReservationCardProps {
  reservation: Reserva;
  quadra?: Quadra;
  index: number;
}

const UpcomingReservationCard: React.FC<UpcomingReservationCardProps> = ({ reservation, quadra, index }) => {
  if (!quadra) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden flex flex-col"
    >
      <div className="p-5 flex-1">
        <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white mb-2">{quadra.name}</h3>
        <p className="text-sm text-brand-gray-500 mb-4">{quadra.sport_type}</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Calendar className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span className="font-medium">{format(parseDateStringAsLocal(reservation.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <Clock className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span className="font-medium">{reservation.start_time} - {reservation.end_time}</span>
          </div>
          <div className="flex items-center text-brand-gray-700 dark:text-brand-gray-300">
            <MapPin className="h-4 w-4 mr-2 text-brand-blue-500" />
            <span className="font-medium">{quadra.location}</span>
          </div>
        </div>
      </div>
      <div className="bg-brand-gray-50 dark:bg-brand-gray-700/50 p-4 flex items-center justify-center">
        <QrCode className="h-16 w-16 text-brand-gray-700 dark:text-brand-gray-300" />
      </div>
    </motion.div>
  );
};

export default UpcomingReservationCard;
