import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Check, User, Phone, Tag, StickyNote, Repeat, AlertCircle } from 'lucide-react';
import { format, addMinutes, isBefore } from 'date-fns';
import { Reserva, Quadra, ReservationType, RecurringType } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { maskPhone } from '../../utils/masks';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reserva: Reserva) => void;
  onCancelReservation: (reservaId: string) => void;
  reservation: Reserva | null;
  newReservationSlot: { quadraId: string, time: string } | null;
  quadras: Quadra[];
  arenaId: string;
  selectedDate: Date;
}

const defaultReservationState: Partial<Reserva> = {
  clientName: '',
  clientPhone: '',
  quadra_id: '',
  status: 'confirmada',
  date: '',
  start_time: '',
  end_time: '',
  type: 'normal',
  notes: '',
  isRecurring: false,
  recurringType: 'weekly',
  recurringEndDate: null,
};


const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen, onClose, onSave, onCancelReservation, reservation, newReservationSlot, quadras, arenaId, selectedDate
}) => {
  const [formData, setFormData] = useState<Partial<Reserva>>(defaultReservationState);

  useEffect(() => {
    const parseTime = (timeStr: string): Date => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    if (reservation) {
      // MODO EDIÇÃO: Carrega os dados da reserva existente
      setFormData({ ...defaultReservationState, ...reservation });
    } else if (newReservationSlot) {
      // MODO CRIAÇÃO (via clique no slot): Usa a data e o slot selecionados
      const quadra = quadras.find(q => q.id === newReservationSlot.quadraId);
      const endTime = newReservationSlot.time && quadra
        ? format(addMinutes(parseTime(newReservationSlot.time), quadra.booking_interval_minutes || 60), 'HH:mm')
        : '';

      setFormData({
        ...defaultReservationState,
        quadra_id: newReservationSlot.quadraId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: newReservationSlot.time,
        end_time: endTime,
        status: 'confirmada',
        type: 'normal',
      });
    } else {
      // MODO CRIAÇÃO (via botão "Nova Reserva"): Usa a data de hoje como padrão
      setFormData({
        ...defaultReservationState,
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [reservation, newReservationSlot, selectedDate, quadras]);

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleSave = () => {
    let finalEndTime = formData.end_time;
    if (!finalEndTime && formData.start_time && formData.quadra_id) {
        const quadra = quadras.find(q => q.id === formData.quadra_id);
        if (quadra) {
            finalEndTime = format(addMinutes(parseTime(formData.start_time), quadra.booking_interval_minutes || 60), 'HH:mm');
        }
    }

    const finalData: Reserva = {
      id: formData.id || 'reserva_' + Date.now(),
      arena_id: arenaId,
      profile_id: formData.profile_id || '',
      created_at: formData.created_at || new Date().toISOString(),
      type: formData.type || 'normal',
      isRecurring: formData.isRecurring || false,
      recurringType: formData.isRecurring ? (formData.recurringType || 'weekly') : undefined,
      recurringEndDate: formData.isRecurring ? (formData.recurringEndDate || null) : null,
      ...formData,
      end_time: finalEndTime,
    } as Reserva;
    onSave(finalData);
  };
  
  const isNew = !reservation;
  const reservationTypes = ['normal', 'aula', 'evento', 'bloqueio'] as ReservationType[];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(p => ({ ...p, clientPhone: maskPhone(e.target.value) }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700 flex-shrink-0">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">
                {isNew ? 'Nova Reserva Manual' : 'Detalhes da Reserva'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nome do Cliente" icon={<User className="h-4 w-4 text-brand-gray-400"/>} value={formData.clientName || ''} onChange={e => setFormData(p => ({...p, clientName: e.target.value}))} />
                <Input label="Telefone do Cliente" icon={<Phone className="h-4 w-4 text-brand-gray-400"/>} value={formData.clientPhone || ''} onChange={handlePhoneChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Quadra</label>
                  <select value={formData.quadra_id || ''} onChange={e => setFormData(p => ({...p, quadra_id: e.target.value}))} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                    <option value="">Selecione...</option>
                    {quadras.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Status</label>
                  <select value={formData.status || 'pendente'} onChange={e => setFormData(p => ({...p, status: e.target.value as Reserva['status']}))} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                    <option value="pendente">Pendente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Data" type="date" value={formData.date || ''} onChange={e => setFormData(p => ({...p, date: e.target.value}))} />
                <Input label="Horário de Início" type="time" value={formData.start_time || ''} onChange={e => setFormData(p => ({...p, start_time: e.target.value}))} />
                <Input label="Horário de Fim" type="time" value={formData.end_time || ''} onChange={e => setFormData(p => ({...p, end_time: e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Tipo de Agendamento</label>
                <div className="flex flex-wrap gap-2">
                  {reservationTypes.map(type => {
                    const typeDetails = getReservationTypeDetails(type);
                    const isSelected = formData.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(p => ({...p, type}))}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center ${
                          isSelected 
                            ? `${typeDetails.bgColor} text-white border-transparent shadow-md`
                            : 'bg-white text-brand-gray-700 border-brand-gray-300 hover:bg-brand-gray-100 dark:bg-brand-gray-700 dark:text-brand-gray-300 dark:border-brand-gray-600 dark:hover:bg-brand-gray-600'
                        }`}
                      >
                        <typeDetails.icon className="h-4 w-4 mr-2" />
                        {typeDetails.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <Input label="Notas (opcional)" icon={<StickyNote className="h-4 w-4 text-brand-gray-400"/>} value={formData.notes || ''} onChange={e => setFormData(p => ({...p, notes: e.target.value}))} placeholder="Ex: Pagamento adiantado, aniversário, etc." />
              
              <div className="space-y-3 pt-2 bg-brand-gray-50 dark:bg-brand-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center">
                  <input type="checkbox" id="recorrencia" className="form-checkbox h-4 w-4 rounded text-brand-blue-600" checked={formData.isRecurring || false} onChange={e => setFormData(p => ({...p, isRecurring: e.target.checked}))} />
                  <label htmlFor="recorrencia" className="ml-2 text-sm text-brand-gray-700 dark:text-brand-gray-300">Tornar este agendamento recorrente</label>
                </div>
                <AnimatePresence>
                {formData.isRecurring && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-2"
                  >
                    <div>
                      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Frequência</label>
                      <select 
                        value={formData.recurringType || 'weekly'} 
                        onChange={e => setFormData(p => ({ ...p, recurringType: e.target.value as RecurringType }))}
                        className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
                      >
                        <option value="weekly">Semanal</option>
                        <option value="daily">Diário</option>
                      </select>
                    </div>
                    <Input label="Repetir até (opcional)" type="date" value={formData.recurringEndDate || ''} onChange={e => setFormData(p => ({...p, recurringEndDate: e.target.value}))} placeholder="Deixe em branco para repetir indefinidamente" />
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
              {!isNew && formData.id ? (
                <Button variant="outline" className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/50" onClick={() => onCancelReservation(formData.id!)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Cancelar Reserva
                </Button>
              ) : <div className="hidden sm:block"></div>}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>Fechar</Button>
                <Button onClick={handleSave} className="w-full sm:w-auto">
                  {isNew ? <><Check className="h-4 w-4 mr-2"/>Criar Reserva</> : <><Save className="h-4 w-4 mr-2"/>Salvar</>}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReservationModal;
