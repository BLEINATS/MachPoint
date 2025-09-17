import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Check, Phone, StickyNote, Repeat, DollarSign, Dribbble } from 'lucide-react';
import { format, addMinutes, isBefore, parse, getDay } from 'date-fns';
import { Reserva, Quadra, ReservationType, RecurringType, Aluno, PricingRule } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { getReservationTypeDetails } from '../../utils/reservationUtils';
import { maskPhone } from '../../utils/masks';
import CreatableClientSelect from '../Forms/CreatableClientSelect';
import { parseDateStringAsLocal } from '../../utils/dateUtils';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reserva: Omit<Reserva, 'id' | 'created_at'> | Reserva) => void;
  onCancelReservation: (reservaId: string) => void;
  reservation: Reserva | null;
  newReservationSlot: { quadraId: string, time: string, type?: ReservationType } | null;
  quadras: Quadra[];
  alunos: Aluno[];
  arenaId: string;
  selectedDate: Date;
}

const defaultReservationState: Partial<Reserva> = {
  clientName: '', clientPhone: '', profile_id: '', quadra_id: '',
  status: 'confirmada', date: '', start_time: '', end_time: '',
  type: 'normal', notes: '', total_price: 0, isRecurring: false,
  recurringType: 'weekly', recurringEndDate: null, sport_type: '',
};

const findMatchingRule = (quadra: Quadra, sport: string, date: Date, time: string): PricingRule | null => {
    if (!quadra || !quadra.pricing_rules) return null;
    const dayOfWeek = getDay(date);
    const reservationTime = parse(time, 'HH:mm', date);

    const activeRules = quadra.pricing_rules.filter(r => r.is_active);

    // Prioritize specific sport
    for (const rule of activeRules) {
        if (rule.sport_type !== sport) continue;
        if (!rule.days_of_week.includes(dayOfWeek)) continue;
        
        const ruleStartTime = parse(rule.start_time, 'HH:mm', date);
        const ruleEndTime = parse(rule.end_time, 'HH:mm', date);

        if (reservationTime >= ruleStartTime && reservationTime < ruleEndTime) {
            return rule;
        }
    }
    // Fallback to "Qualquer Esporte"
    for (const rule of activeRules) {
        if (rule.sport_type !== 'Qualquer Esporte') continue;
        if (!rule.days_of_week.includes(dayOfWeek)) continue;
        
        const ruleStartTime = parse(rule.start_time, 'HH:mm', date);
        const ruleEndTime = parse(rule.end_time, 'HH:mm', date);

        if (reservationTime >= ruleStartTime && reservationTime < ruleEndTime) {
            return rule;
        }
    }
    return null;
};

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, onSave, onCancelReservation, reservation, newReservationSlot, quadras, alunos, arenaId, selectedDate }) => {
  const [formData, setFormData] = useState<Partial<Reserva>>(defaultReservationState);

  const { selectedQuadra, totalPrice } = useMemo(() => {
    const quadra = quadras.find(q => q.id === formData.quadra_id);
    if (!quadra || !formData.start_time || !formData.end_time || !formData.date || !formData.sport_type) {
        return { selectedQuadra: null, totalPrice: 0 };
    }

    try {
        const date = parseDateStringAsLocal(formData.date);
        const startTime = parse(formData.start_time, 'HH:mm', date);
        const endTime = parse(formData.end_time, 'HH:mm', date);
        if (isBefore(endTime, startTime) || startTime.getTime() === endTime.getTime()) {
            return { selectedQuadra: quadra, totalPrice: 0 };
        }
        
        const selectedClient = formData.profile_id ? alunos.find(a => a.profile_id === formData.profile_id) : null;
        const isMensalista = selectedClient ? selectedClient.monthly_fee > 0 : false;

        const rule = findMatchingRule(quadra, formData.sport_type, date, formData.start_time);
        if (!rule) return { selectedQuadra: quadra, totalPrice: 0 };

        const pricePerHour = isMensalista ? rule.price_monthly : rule.price_single;
        
        const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        const price = (diffMinutes / 60) * pricePerHour;
        return { selectedQuadra: quadra, totalPrice: price };
    } catch (error) {
        console.error("Erro ao calcular preço:", error);
        return { selectedQuadra: quadra, totalPrice: 0 };
    }
  }, [formData.quadra_id, formData.start_time, formData.end_time, formData.date, formData.sport_type, formData.profile_id, quadras, alunos]);

  useEffect(() => {
    const parseTime = (timeStr: string): Date => parse(timeStr, 'HH:mm', new Date());
    if (reservation) {
      const quadra = quadras.find(q => q.id === reservation.quadra_id);
      setFormData({ ...defaultReservationState, ...reservation, sport_type: reservation.sport_type || quadra?.sport_type || '' });
    } else if (newReservationSlot) {
      const quadra = quadras.find(q => q.id === newReservationSlot.quadraId);
      const endTime = newReservationSlot.time && quadra ? format(addMinutes(parseTime(newReservationSlot.time), quadra.booking_interval_minutes || 60), 'HH:mm') : '';
      setFormData({ ...defaultReservationState, quadra_id: newReservationSlot.quadraId, date: format(selectedDate, 'yyyy-MM-dd'), start_time: newReservationSlot.time, end_time: endTime, status: 'confirmada', type: newReservationSlot.type || 'normal', sport_type: quadra?.sport_type || '' });
    } else {
      setFormData({ ...defaultReservationState, date: format(new Date(), 'yyyy-MM-dd') });
    }
  }, [reservation, newReservationSlot, selectedDate, quadras]);

  const sportTypes = useMemo(() => ['Beach Tennis', 'Futevôlei', 'Futebol Society', 'Vôlei', 'Tênis', 'Padel', 'Basquete', 'Futsal', 'Outro'], []);

  const handleSave = () => {
    const finalData = { ...formData, total_price: totalPrice, arena_id: arenaId } as Omit<Reserva, 'id' | 'created_at'> | Reserva;
    onSave(finalData);
  };
  
  const isNew = !reservation;
  const reservationTypes = ['normal', 'aula', 'torneio', 'bloqueio'] as ReservationType[];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, clientPhone: maskPhone(e.target.value) }));
  const handleClientSelect = (selection: { id: string | null; name: string; phone?: string }) => setFormData(prev => ({ ...prev, clientName: selection.name, profile_id: selection.id || '', clientPhone: selection.phone || '' }));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700 flex-shrink-0">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">{isNew ? 'Nova Reserva Manual' : 'Detalhes da Reserva'}</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"><X className="h-5 w-5 text-brand-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CreatableClientSelect alunos={alunos} value={{ id: formData.profile_id || null, name: formData.clientName || '' }} onChange={handleClientSelect} placeholder="Selecione ou crie um cliente" />
                <Input label="Telefone do Cliente" icon={<Phone className="h-4 w-4 text-brand-gray-400"/>} value={formData.clientPhone || ''} onChange={handlePhoneChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Esporte</label>
                  <select value={formData.sport_type || ''} onChange={e => setFormData(p => ({ ...p, sport_type: e.target.value }))} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                      <option value="">Selecione...</option>
                      {sportTypes.map(sport => <option key={sport} value={sport}>{sport}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Quadra</label>
                  <select value={formData.quadra_id || ''} onChange={e => setFormData(p => ({ ...p, quadra_id: e.target.value }))} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                    <option value="">Selecione...</option>
                    {quadras.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Data" type="date" value={formData.date || ''} onChange={e => setFormData(p => ({...p, date: e.target.value}))} />
                <Input label="Horário de Início" type="time" value={formData.start_time || ''} onChange={e => setFormData(p => ({...p, start_time: e.target.value}))} />
                <Input label="Horário de Fim" type="time" value={formData.end_time || ''} onChange={e => setFormData(p => ({...p, end_time: e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Status</label>
                  <select value={formData.status || 'pendente'} onChange={e => setFormData(p => ({...p, status: e.target.value as Reserva['status']}))} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                    <option value="pendente">Pendente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Valor Total</label>
                    <div className="flex items-center p-3 rounded-md bg-brand-gray-50 dark:bg-brand-gray-800 border border-brand-gray-200 dark:border-brand-gray-700">
                        <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">{totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Tipo de Agendamento</label>
                <div className="flex flex-wrap gap-2">
                  {reservationTypes.map(type => {
                    const typeDetails = getReservationTypeDetails(type);
                    const isSelected = formData.type === type;
                    return <button key={type} type="button" onClick={() => setFormData(p => ({...p, type}))} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center ${isSelected ? `${typeDetails.bgColor} text-white border-transparent shadow-md` : 'bg-white text-brand-gray-700 border-brand-gray-300 hover:bg-brand-gray-100 dark:bg-brand-gray-700 dark:text-brand-gray-300 dark:border-brand-gray-600 dark:hover:bg-brand-gray-600'}`}><typeDetails.icon className="h-4 w-4 mr-2" />{typeDetails.label}</button>
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
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Frequência</label>
                      <select value={formData.recurringType || 'weekly'} onChange={e => setFormData(p => ({ ...p, recurringType: e.target.value as RecurringType }))} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"><option value="weekly">Semanal</option><option value="daily">Diário</option></select>
                    </div>
                    <Input label="Repetir até (opcional)" type="date" value={formData.recurringEndDate || ''} onChange={e => setFormData(p => ({...p, recurringEndDate: e.target.value}))} placeholder="Deixe em branco para repetir indefinidamente" />
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>
            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
              {!isNew && formData.id ? <Button variant="outline" className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/50" onClick={() => onCancelReservation(formData.id!)}><Trash2 className="h-4 w-4 mr-2" /> Cancelar Reserva</Button> : <div className="hidden sm:block"></div>}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>Fechar</Button>
                <Button onClick={handleSave} className="w-full sm:w-auto">{isNew ? <><Check className="h-4 w-4 mr-2"/>Criar Reserva</> : <><Save className="h-4 w-4 mr-2"/>Salvar</>}</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReservationModal;
