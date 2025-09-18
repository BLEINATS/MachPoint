import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calendar, Clock, User, Phone, Repeat, Tag, DollarSign, Info, AlertTriangle } from 'lucide-react';
import { Aluno, Quadra, Reservation, PricingRule, DurationDiscount } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { format, parse, getDay, addDays } from 'date-fns';
import CreatableClientSelect from '../Forms/CreatableClientSelect';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: Omit<Reservation, 'id' | 'created_at' | 'arena_id'> | Reservation) => void;
  onCancelReservation: (reservationId: string) => void;
  reservation?: Reservation | null;
  newReservationSlot?: { quadraId: string, time: string, type?: Reservation['type'] } | null;
  quadras: Quadra[];
  alunos: Aluno[];
  arenaId: string;
  selectedDate: Date;
}

const ALL_SPORTS = ['Beach Tennis', 'Futevôlei', 'Vôlei de Praia', 'Tênis', 'Padel', 'Futebol Society', 'Outro'];

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, onSave, onCancelReservation, reservation, newReservationSlot, quadras, alunos, arenaId, selectedDate }) => {
  const { addToast } = useToast();
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [durationDiscounts, setDurationDiscounts] = useState<DurationDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerType, setCustomerType] = useState<'Avulso' | 'Mensalista' | null>(null);

  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedDiscountPercentage, setAppliedDiscountPercentage] = useState(0);

  const [formData, setFormData] = useState({
    date: format(selectedDate, 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    quadra_id: '',
    aluno_id: '',
    customer_name: '',
    customer_phone: '',
    status: 'confirmada' as Reservation['status'],
    type: 'avulsa' as Reservation['type'],
    sport_type: 'Beach Tennis',
    total_price: 0,
    is_recurring: false,
    recurring_end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  });

  const isEditing = !!reservation;

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !arenaId) return;
      setIsLoading(true);
      try {
        const [rulesRes, discountsRes] = await Promise.all([
          supabase.from('pricing_rules').select('*').eq('arena_id', arenaId),
          supabase.from('duration_discounts').select('*').eq('arena_id', arenaId)
        ]);
        if (rulesRes.error) throw rulesRes.error;
        if (discountsRes.error) throw discountsRes.error;

        setPricingRules(rulesRes.data || []);
        setDurationDiscounts(discountsRes.data || []);

      } catch (error: any) {
        addToast('Erro ao carregar regras de preço e descontos.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isOpen, arenaId, addToast]);

  useEffect(() => {
    if (isOpen) {
      if (reservation) {
        const customer = alunos.find(a => a.id === reservation.aluno_id);
        setFormData({
          date: reservation.date,
          start_time: reservation.start_time.slice(0, 5),
          end_time: reservation.end_time.slice(0, 5),
          quadra_id: reservation.quadra_id,
          aluno_id: reservation.aluno_id || '',
          customer_name: reservation.customer_name || customer?.name || '',
          customer_phone: reservation.customer_phone || customer?.phone || '',
          status: reservation.status,
          type: reservation.type,
          sport_type: reservation.sport_type || 'Outro',
          total_price: reservation.total_price || 0,
          is_recurring: reservation.is_recurring || false,
          recurring_end_date: reservation.recurring_end_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        });
      } else if (newReservationSlot) {
        const startTime = newReservationSlot.time || '09:00';
        const endTimeDate = addDays(parse(startTime, 'HH:mm', new Date()), 1);
        const endTime = format(endTimeDate, 'HH:mm');

        setFormData(prev => ({
          ...prev,
          date: format(selectedDate, 'yyyy-MM-dd'),
          quadra_id: newReservationSlot.quadraId || (quadras.length > 0 ? quadras[0].id : ''),
          start_time: startTime,
          end_time: endTime,
          type: newReservationSlot.type || 'avulsa',
        }));
      } else {
         setFormData(prev => ({
          ...prev,
          date: format(selectedDate, 'yyyy-MM-dd'),
          quadra_id: quadras.length > 0 ? quadras[0].id : '',
        }));
      }
    }
  }, [reservation, newReservationSlot, isOpen, selectedDate, quadras, alunos]);

  const findMatchingRule = (
    rules: PricingRule[], quadraId: string, sport: string, date: string, startTime: string
  ): { price: number | null, isMonthly: boolean } => {
    const reservationDay = getDay(parse(date, 'yyyy-MM-dd', new Date()));
    const selectedAluno = alunos.find(a => a.id === formData.aluno_id);
    const isMonthlyCustomer = !!(selectedAluno && selectedAluno.monthly_fee && selectedAluno.monthly_fee > 0);

    const specificRules = rules.filter(rule =>
        rule.quadra_id === quadraId &&
        !rule.is_default &&
        rule.is_active &&
        rule.days_of_week.includes(reservationDay) &&
        (rule.sport_type === sport || rule.sport_type === 'Qualquer Esporte') &&
        startTime >= rule.start_time && startTime < rule.end_time
    );
    
    let targetRule = specificRules.find(r => r.sport_type === sport) || specificRules.find(r => r.sport_type === 'Qualquer Esporte');

    if (!targetRule) {
        const defaultRules = rules.filter(rule =>
            rule.quadra_id === quadraId &&
            rule.is_default &&
            rule.is_active &&
            (rule.sport_type === sport || rule.sport_type === 'Qualquer Esporte')
        );
        targetRule = defaultRules.find(r => r.sport_type === sport) || defaultRules.find(r => r.sport_type === 'Qualquer Esporte');
    }

    if (targetRule) {
        return { price: isMonthlyCustomer ? targetRule.price_monthly : targetRule.price_single, isMonthly: isMonthlyCustomer };
    }
    return { price: null, isMonthly: isMonthlyCustomer };
  };

  useEffect(() => {
    const { quadra_id, sport_type, date, start_time, end_time } = formData;
    
    if (quadra_id && date && start_time && end_time && pricingRules.length > 0) {
      const { price: pricePerHour } = findMatchingRule(pricingRules, quadra_id, sport_type, date, start_time);
      
      if (pricePerHour !== null) {
        const start = parse(start_time, 'HH:mm', new Date());
        const end = parse(end_time, 'HH:mm', new Date());
        let durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (durationHours < 0) durationHours += 24;

        const currentSubtotal = pricePerHour * durationHours;
        setSubtotal(currentSubtotal);

        const matchingDiscount = durationDiscounts
          .filter(d => d.is_active && durationHours >= d.duration_hours)
          .sort((a, b) => b.duration_hours - a.duration_hours)[0];
        
        let currentDiscountAmount = 0;
        let finalPrice = currentSubtotal;

        if (matchingDiscount) {
          currentDiscountAmount = currentSubtotal * (matchingDiscount.discount_percentage / 100);
          finalPrice = currentSubtotal - currentDiscountAmount;
          setAppliedDiscountPercentage(matchingDiscount.discount_percentage);
        } else {
          setAppliedDiscountPercentage(0);
        }
        setDiscountAmount(currentDiscountAmount);
        setFormData(prev => ({ ...prev, total_price: finalPrice }));
      } else {
        setSubtotal(0);
        setDiscountAmount(0);
        setAppliedDiscountPercentage(0);
        setFormData(prev => ({ ...prev, total_price: 0 }));
      }
    }
  }, [formData.quadra_id, formData.sport_type, formData.date, formData.start_time, formData.end_time, formData.aluno_id, pricingRules, durationDiscounts, alunos]);


  const handleSaveClick = () => {
    const finalData = { ...formData };
    if (finalData.aluno_id === '') {
      // @ts-ignore
      delete finalData.aluno_id;
    }
    onSave(isEditing ? { ...reservation, ...finalData } : finalData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">
                {isEditing ? 'Editar Reserva' : 'Nova Reserva'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-6 h-6 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <CreatableClientSelect
                        alunos={alunos}
                        value={{ id: formData.aluno_id, name: formData.customer_name }}
                        onChange={(selection) => {
                          setFormData(prev => ({
                            ...prev,
                            aluno_id: selection.id || '',
                            customer_name: selection.name,
                            customer_phone: selection.phone || '',
                          }));
                          const selectedAluno = alunos.find(a => a.id === selection.id);
                          setCustomerType(selectedAluno?.monthly_fee && selectedAluno.monthly_fee > 0 ? 'Mensalista' : 'Avulso');
                        }}
                        placeholder="Digite ou selecione o cliente"
                      />
                      {customerType && <span className={`text-xs mt-1 font-semibold ${customerType === 'Mensalista' ? 'text-green-600' : 'text-blue-600'}`}>{customerType}</span>}
                    </div>
                    <Input label="Telefone do Cliente" name="customer_phone" value={formData.customer_phone} onChange={e => setFormData(p => ({...p, customer_phone: e.target.value}))} icon={<Phone className="h-4 w-4 text-brand-gray-400"/>} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Quadra</label>
                      <select name="quadra_id" value={formData.quadra_id} onChange={e => setFormData(p => ({...p, quadra_id: e.target.value}))} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600">
                        <option value="">Selecione a quadra</option>
                        {quadras.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                      </select>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Esporte</label>
                      <select name="sport_type" value={formData.sport_type} onChange={e => setFormData(p => ({...p, sport_type: e.target.value}))} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600">
                        {ALL_SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="Data" name="date" type="date" value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                    <Input label="Início" name="start_time" type="time" value={formData.start_time} onChange={e => setFormData(p => ({...p, start_time: e.target.value.slice(0,5)}))} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} />
                    <Input label="Fim" name="end_time" type="time" value={formData.end_time} onChange={e => setFormData(p => ({...p, end_time: e.target.value.slice(0,5)}))} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} />
                  </div>
                  
                  <div className="p-4 rounded-lg bg-brand-blue-50 dark:bg-brand-gray-800 space-y-2 border border-brand-gray-200 dark:border-brand-gray-700">
                      <div className="flex justify-between text-sm">
                          <span className="text-brand-gray-600 dark:text-brand-gray-400">Subtotal</span>
                          <span className="font-medium text-brand-gray-800 dark:text-white">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                      {discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                              <span>Desconto por Duração ({appliedDiscountPercentage}%)</span>
                              <span>- {discountAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t border-brand-blue-200 dark:border-brand-gray-700 pt-2 mt-2">
                          <span className="text-brand-gray-800 dark:text-white">Valor Total</span>
                          <span className="text-brand-blue-600 dark:text-brand-blue-300">{formData.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                  </div>

                  {formData.total_price === 0 && subtotal === 0 && (
                    <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/50 flex items-start text-yellow-700 dark:text-yellow-300">
                        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/>
                        <p className="text-xs">O valor é R$ 0,00. Verifique se existe uma regra de preço (padrão ou promocional) para este esporte, dia e horário.</p>
                    </div>
                  )}

                  <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.is_recurring} onChange={e => setFormData(p => ({...p, is_recurring: e.target.checked}))} className="form-checkbox h-4 w-4 rounded text-brand-blue-600"/>
                        <span className="text-sm font-medium">Reserva Recorrente</span>
                     </label>
                     {formData.is_recurring && (
                        <div className="mt-3 pl-6">
                            <Input label="Repetir até" name="recurring_end_date" type="date" value={formData.recurring_end_date} onChange={e => setFormData(p => ({...p, recurring_end_date: e.target.value}))} icon={<Repeat className="h-4 w-4 text-brand-gray-400"/>} />
                        </div>
                     )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
              <div>
                {isEditing && (
                  <Button variant="outline" className="text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onCancelReservation(reservation.id)}>
                    Cancelar Reserva
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>Fechar</Button>
                <Button onClick={handleSaveClick} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2"/> {isEditing ? 'Salvar Alterações' : 'Criar Reserva'}
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
