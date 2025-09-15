import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Reserva, Quadra } from '../../types';
import { Calendar, Clock, Repeat } from 'lucide-react';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface ListViewProps {
  reservas: Reserva[];
  quadras: Quadra[];
  onReservationClick: (reserva: Reserva) => void;
}

const ListView: React.FC<ListViewProps> = ({ reservas, quadras, onReservationClick }) => {
  const getStatusClasses = (status: Reserva['status']) => {
    switch (status) {
      case 'confirmada': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-brand-gray-100 text-brand-gray-800 dark:bg-brand-gray-700 dark:text-brand-gray-200';
    }
  };

  const sortedReservas = [...reservas].sort((a, b) => parseDateStringAsLocal(b.date).getTime() - parseDateStringAsLocal(a.date).getTime() || a.start_time.localeCompare(b.start_time));
  
  const getQuadraName = (id: string) => quadras.find(q => q.id === id)?.name || 'Quadra não encontrada';

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
          <thead className="bg-brand-gray-50 dark:bg-brand-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Cliente / Tipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Data & Hora</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Quadra</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            {sortedReservas.map(reserva => {
              const typeDetails = getReservationTypeDetails(reserva.type);
              return (
                <tr key={reserva.id} onClick={() => onReservationClick(reserva)} className="hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mr-3 flex-shrink-0 ${typeDetails.bgColor}`}></div>
                      <div>
                        <div className="text-sm font-medium text-brand-gray-900 dark:text-white flex items-center">
                          {reserva.clientName || 'Cliente App'}
                          {reserva.isRecurring && <Repeat className="h-3 w-3 ml-1.5 text-brand-gray-400" title="Reserva Recorrente"/>}
                        </div>
                        <div className="text-xs text-brand-gray-500">{typeDetails.label}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-gray-900 dark:text-white flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-brand-gray-400" />
                      {format(parseDateStringAsLocal(reserva.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    <div className="text-sm text-brand-gray-500 dark:text-brand-gray-400 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {reserva.start_time} - {reserva.end_time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">{getQuadraName(reserva.quadra_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(reserva.status)}`}>
                      {reserva.status.charAt(0).toUpperCase() + reserva.status.slice(1)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListView;
