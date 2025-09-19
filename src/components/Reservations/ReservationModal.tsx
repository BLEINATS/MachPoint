import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calendar, Clock, User, Phone, Repeat, Tag, DollarSign, Info, AlertTriangle, CreditCard } from 'lucide-react';
import { Aluno, Quadra, Reservation, PricingRule, DurationDiscount, ReservationType } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { format, parse, getDay, addDays, addMinutes, isBefore } from 'date-fns';
import CreatableClientSelect from '../Forms/CreatableClientSelect';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reservation: Omit<Reservation, 'id' | 'created_at' | 'arena_id'> | Reservation) => void;
  onCancelReservation: (reservation: Reservation) => void;
  reservation?: Reservation | null;
  newReservationSlot?: { quadraId: string, time: string, type?: ReservationType } | null;
  quadras: Quadra[];
  alunos: Aluno[];
  arenaId: string;
  selectedDate: Date;
}

const ALL_SPORTS = ['Beach Tennis', 'Futevôlei', 'Vôlei de Praia', 'Tênis', 'Padel', 'Futebol Society', 'Outro'];

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return -1;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return -1;
    return hours * 60 + minutes;
  } catch (e) {
    return -1;
  }
};

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, onSave, onCancelReservation, reservation, newReservationSlot, quadras, alunos, arenaId, selectedDate }) => {
  const { addToast } = useToast();
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [durationDiscounts, setDurationDiscounts] = useState<DurationDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerType, setCustomerType] = useState<'Avulso' | 'Mensalista' | null>(null);

  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInfo, setDiscountInfo] = useState<{ percentage: number; duration: number } | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<{ description: string; subtotal: number }[]>([]);
  const [useCredit, setUseCredit] = useState(false);
  const [newlyAppliedCredit, setNewlyAppliedCredit] = useState(0);
  const [originalCreditUsed, setOriginalCreditUsed] = useState(0);

  const [formData, setFormData] = useState({
    date: format(selectedDate, 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    quadra_id: '',
    aluno_id: '',
    clientName: '',
    clientPhone: '',
    status: 'confirmada' as Reservation['status'],
    type: 'avulsa' as Reservation['type'],
    sport_type: 'Beach Tennis',
    total_price: 0,
    credit_used: 0,
    isRecurring: false,
    recurringEndDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  });

  const isEditing = !!reservation;

  const selectedClient = useMemo(() => {
    return alunos.find(a => a.id === formData.aluno_id || a.name === formData.clientName);
  }, [formData.aluno_id, formData.clientName, alunos]);

  const availableCredit = useMemo(() => {
    return selectedClient?.credit_balance || 0;
  }, [selectedClient]);

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
        addToast({ message: 'Erro ao carregar regras de preço e descontos.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isOpen, arenaId, addToast]);

  useEffect(() => {
    if (isOpen) {
      if (reservation) {
        const creditAlreadyUsed = reservation.credit_used || 0;
        setFormData({
          date: reservation.date,
          start_time: reservation.start_time.slice(0, 5),
          end_time: reservation.end_time.slice(0, 5),
          quadra_id: reservation.quadra_id,
          aluno_id: '',
          clientName: reservation.clientName || '',
          clientPhone: reservation.clientPhone || '',
          status: reservation.status,
          type: reservation.type,
          sport_type: reservation.sport_type || 'Outro',
          total_price: reservation.total_price || 0,
          credit_used: creditAlreadyUsed,
          isRecurring: reservation.isRecurring || false,
          recurringEndDate: reservation.recurringEndDate || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        });
        setOriginalCreditUsed(creditAlreadyUsed);
      } else if (newReservationSlot) {
        const startTime = newReservationSlot.time || '09:00';
        const quadraId = newReservationSlot.quadraId || (quadras.length > 0 ? quadras[0].id : '');
        const selectedQuadra = quadras.find(q => q.id === quadraId);
        const duration = selectedQuadra?.booking_duration_minutes || 60;
        const startTimeDate = parse(startTime, 'HH:mm', new Date());
        const endTimeDate = addMinutes(startTimeDate, duration);
        const endTime = format(endTimeDate, 'HH:mm');

        setFormData(prev => ({
          ...prev,
          date: format(selectedDate, 'yyyy-MM-dd'),
          quadra_id: quadraId,
          start_time: startTime,
          end_time: endTime,
          type: newReservationSlot.type || 'avulsa',
          sport_type: selectedQuadra?.sports?.[0] || 'Beach Tennis',
        }));
        setOriginalCreditUsed(0);
      } else {
         setFormData(prev => ({
          ...prev,
          date: format(selectedDate, 'yyyy-MM-dd'),
          quadra_id: quadras.length > 0 ? quadras[0].id : '',
        }));
        setOriginalCreditUsed(0);
      }
    }
  }, [reservation, newReservationSlot, isOpen, selectedDate, quadras, alunos]);

  const findMatchingRule = (
    rules: PricingRule[], quadraId: string, sport: string, date: string, startTime: string
  ): { rule: PricingRule | null, isMonthly: boolean } => {
    const reservationDay = getDay(parse(date, 'yyyy-MM-dd', new Date()));
    const selectedAluno = alunos.find(a => a.id === formData.aluno_id);
    const isMonthlyCustomer = !!(selectedAluno && selectedAluno.monthly_fee && selectedAluno.monthly_fee > 0);

    const reservationStartTimeMinutes = timeToMinutes(startTime);

    const applicableRules = rules.filter(rule => {
      const ruleStartMinutes = timeToMinutes(rule.start_time);
      const ruleEndMinutes = timeToMinutes(rule.end_time);

      return (rule.quadra_id === quadraId || !rule.quadra_id) &&
        rule.is_active &&
        rule.days_of_week.includes(reservationDay) &&
        (rule.sport_type === sport || rule.sport_type === 'Qualquer Esporte') &&
        reservationStartTimeMinutes >= ruleStartMinutes && reservationStartTimeMinutes < ruleEndMinutes;
    });

    const specificSportRule = applicableRules.find(r => r.sport_type === sport && !r.is_default);
    const anySportRule = applicableRules.find(r => r.sport_type === 'Qualquer Esporte' && !r.is_default);
    const defaultSpecificSportRule = applicableRules.find(r => r.sport_type === sport && r.is_default);
    const defaultAnySportRule = applicableRules.find(r => r.sport_type === 'Qualquer Esporte' && r.is_default);

    const targetRule = specificSportRule || anySportRule || defaultSpecificSportRule || defaultAnySportRule || null;

    if (targetRule) {
        return { rule: targetRule, isMonthly: isMonthlyCustomer };
    }
    return { rule: null, isMonthly: isMonthlyCustomer };
  };

  useEffect(() => {
    const calculateSegmentedPrice = () => {
      const { quadra_id, sport_type, date, start_time, end_time } = formData;
      if (!quadra_id || !date || !start_time || !end_time || pricingRules.length === 0) {
        setPriceBreakdown([]); setSubtotal(0); setDiscountAmount(0); setDiscountInfo(null);
        setFormData(prev => ({ ...prev, total_price: 0, credit_used: 0 }));
        setNewlyAppliedCredit(0);
        return;
      }

      const start = parse(start_time, 'HH:mm', new Date());
      const end = parse(end_time, 'HH:mm', new Date());

      if (end <= start) {
        setPriceBreakdown([]); setSubtotal(0); setDiscountAmount(0); setDiscountInfo(null);
        setFormData(prev => ({ ...prev, total_price: 0, credit_used: 0 }));
        setNewlyAppliedCredit(0);
        return;
      }

      let totalCalculatedPrice = 0;
      const details: { [key: string]: { hours: number, pricePerHour: number } } = {};
      const intervalMinutes = 30;

      let currentTime = start;
      while (isBefore(currentTime, end)) {
        const segmentStartTimeStr = format(currentTime, 'HH:mm');
        const { rule: segmentRule, isMonthly } = findMatchingRule(pricingRules, quadra_id, sport_type, date, segmentStartTimeStr);
        const pricePerHour = segmentRule ? (isMonthly ? segmentRule.price_monthly : segmentRule.price_single) : 0;
        const segmentPrice = pricePerHour * (intervalMinutes / 60);
        totalCalculatedPrice += segmentPrice;
        const ruleKey = segmentRule ? `Regra ${segmentRule.is_default ? 'Padrão' : 'Diferenciada'} (${segmentRule.sport_type} - ${isMonthly ? 'Mensalista' : 'Avulso'}) @ ${pricePerHour.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/h` : "Sem Regra Aplicável @ R$ 0,00/h";
        if (!details[ruleKey]) {
          details[ruleKey] = { hours: 0, pricePerHour: pricePerHour };
        }
        details[ruleKey].hours += (intervalMinutes / 60);
        currentTime = addMinutes(currentTime, intervalMinutes);
      }

      const breakdown = Object.entries(details).map(([description, data]) => ({
        description: `${data.hours.toFixed(1).replace('.', ',')}h - ${description}`,
        subtotal: data.hours * data.pricePerHour,
      }));
      setPriceBreakdown(breakdown);
      setSubtotal(totalCalculatedPrice);

      const totalDurationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const matchingDiscount = durationDiscounts.filter(d => d.is_active && totalDurationHours >= d.duration_hours).sort((a, b) => b.duration_hours - a.duration_hours)[0];
      let finalDiscountAmount = 0;
      if (matchingDiscount) {
        finalDiscountAmount = totalCalculatedPrice * (matchingDiscount.discount_percentage / 100);
        setDiscountInfo({ percentage: matchingDiscount.discount_percentage, duration: totalDurationHours });
      } else {
        setDiscountInfo(null);
      }
      setDiscountAmount(finalDiscountAmount);

      const priceAfterDiscount = totalCalculatedPrice - finalDiscountAmount;
      
      let creditToApplyNow = 0;
      if (useCredit && availableCredit > 0) {
        const remainingCost = priceAfterDiscount - originalCreditUsed;
        if (remainingCost > 0) {
          creditToApplyNow = Math.min(remainingCost, availableCredit);
        }
      }
      setNewlyAppliedCredit(creditToApplyNow);

      const totalCreditOnReservation = originalCreditUsed + creditToApplyNow;
      
      setFormData(prev => ({ 
        ...prev, 
        total_price: priceAfterDiscount - totalCreditOnReservation,
        credit_used: totalCreditOnReservation 
      }));
    };
    calculateSegmentedPrice();
  }, [formData.quadra_id, formData.sport_type, formData.date, formData.start_time, formData.end_time, formData.aluno_id, pricingRules, durationDiscounts, alunos, useCredit, availableCredit, isEditing, originalCreditUsed]);

  const handleSaveClick = () => {
    const dataToSave = {
      ...formData,
      originalCreditUsed: originalCreditUsed,
    };
    onSave(isEditing ? { ...reservation, ...dataToSave } as Reservation : dataToSave);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const finalPriceLabel = useMemo(() => {
    if (formData.total_price > 0) return 'Valor a Pagar';
    return 'Valor Total';
  }, [formData.total_price]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]"
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

            <div className="p-6 space-y-6 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-6 h-6 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CreatableClientSelect
                      alunos={alunos}
                      value={{ id: formData.aluno_id, name: formData.clientName }}
                      onChange={(selection) => {
                        setFormData(prev => ({
                          ...prev,
                          aluno_id: selection.id || '',
                          clientName: selection.name,
                          clientPhone: selection.phone || '',
                        }));
                        const selectedAluno = alunos.find(a => a.id === selection.id);
                        setCustomerType(selectedAluno?.monthly_fee && selectedAluno.monthly_fee > 0 ? 'Mensalista' : 'Avulso');
                      }}
                      placeholder="Digite ou selecione o cliente"
                    />
                    <Input label="Telefone do Cliente" name="clientPhone" value={formData.clientPhone} onChange={handleChange} icon={<Phone className="h-4 w-4 text-brand-gray-400"/>} />
                  </div>
                  {customerType && <span className={`text-xs -mt-4 block font-semibold ${customerType === 'Mensalista' ? 'text-green-600' : 'text-blue-600'}`}>{customerType}</span>}
                  
                  {isEditing && originalCreditUsed > 0 && (
                    <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-700/50 flex items-center gap-3">
                      <Info className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Crédito Já Aplicado</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Esta reserva já utilizou <strong className="text-green-600 dark:text-green-400">{originalCreditUsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> de crédito.
                        </p>
                      </div>
                    </div>
                  )}

                  {availableCredit > 0 && (
                    <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/50 flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-3 text-blue-500" />
                        <div>
                          <p className="font-semibold text-blue-800 dark:text-blue-200">Saldo de Crédito do Cliente</p>
                          <p className="text-sm text-blue-600 dark:text-blue-300 font-bold">
                            {availableCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={useCredit} 
                          onChange={e => setUseCredit(e.target.checked)} 
                          className="form-checkbox h-5 w-5 rounded text-brand-blue-600"
                        />
                        <span className="text-sm font-medium">Usar Saldo</span>
                      </label>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Quadra</label>
                      <select name="quadra_id" value={formData.quadra_id} onChange={handleChange} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600">
                        <option value="">Selecione a quadra</option>
                        {quadras.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                      </select>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Esporte</label>
                      <select name="sport_type" value={formData.sport_type} onChange={handleChange} className="form-select w-full rounded-md dark:bg-brand-gray-800 dark:text-white dark:border-brand-gray-600">
                        {ALL_SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Data" name="date" type="date" value={formData.date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
                    <Input label="Início" name="start_time" type="time" value={formData.start_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} />
                    <Input label="Fim" name="end_time" type="time" value={formData.end_time} onChange={handleChange} icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} />
                  </div>
                  
                  <div className="p-4 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800 space-y-3 border border-brand-gray-200 dark:border-brand-gray-700">
                      <h4 className="font-semibold text-brand-gray-800 dark:text-white">Detalhamento do Preço</h4>
                      <div className="space-y-2">
                        {priceBreakdown.length > 0 ? priceBreakdown.map((item, index) => (
                            <div key={index} className="flex justify-between items-start text-sm gap-4">
                                <span className="text-brand-gray-600 dark:text-brand-gray-400">{item.description}</span>
                                <span className="font-medium text-brand-gray-800 dark:text-white whitespace-nowrap">{item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        )) : (
                          <p className="text-sm text-brand-gray-500">Nenhum cálculo de preço disponível.</p>
                        )}
                      </div>

                      <div className="flex justify-between text-sm border-t border-brand-gray-200 dark:border-brand-gray-700 pt-3 mt-3">
                          <span className="text-brand-gray-600 dark:text-brand-gray-400">Subtotal</span>
                          <span className="font-medium text-brand-gray-800 dark:text-white">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>

                      {discountAmount > 0 && discountInfo && (
                        <div>
                          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                            <span>Desconto por Duração ({discountInfo.percentage}%)</span>
                            <span>- {discountAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-500 pl-1 mt-0.5">
                            Aplicado para {discountInfo.duration.toFixed(1).replace('.', ',')}h de reserva
                          </div>
                        </div>
                      )}
                      
                      {originalCreditUsed > 0 && (
                          <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                              <span>Crédito Já Utilizado</span>
                              <span>- {originalCreditUsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                      )}
                      
                      {newlyAppliedCredit > 0 && (
                          <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                              <span>Crédito Adicional Aplicado</span>
                              <span>- {newlyAppliedCredit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                      )}

                      <div className="flex justify-between text-lg font-bold border-t-2 border-brand-gray-300 dark:border-brand-gray-600 pt-3 mt-3">
                          <span className="text-brand-gray-800 dark:text-white">{finalPriceLabel}</span>
                          <span className="text-brand-blue-600 dark:text-brand-blue-300">{formData.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                      
                      {newlyAppliedCredit > 0 && (
                        <div className="text-right text-sm text-green-600 dark:text-green-400 mt-2">
                            <span>Crédito Restante: </span>
                            <span className="font-bold">
                                {(availableCredit - newlyAppliedCredit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                      )}
                  </div>

                  {(formData.total_price === 0 && subtotal === 0 && priceBreakdown.length === 0) && (
                    <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/50 flex items-start text-yellow-700 dark:text-yellow-300">
                        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/>
                        <p className="text-xs">O valor é R$ 0,00. Verifique se existe uma regra de preço (padrão ou promocional) para este esporte, dia e horário.</p>
                    </div>
                  )}

                  <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.isRecurring} onChange={e => setFormData(p => ({...p, isRecurring: e.target.checked}))} className="form-checkbox h-4 w-4 rounded text-brand-blue-600"/>
                        <span className="text-sm font-medium">Reserva Recorrente</span>
                     </label>
                     {formData.isRecurring && (
                        <div className="mt-3 pl-6">
                            <Input label="Repetir até" name="recurringEndDate" type="date" value={formData.recurringEndDate} onChange={handleChange} icon={<Repeat className="h-4 w-4 text-brand-gray-400"/>} />
                        </div>
                     )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
              <div>
                {isEditing && reservation && (
                  <Button variant="outline" className="text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onCancelReservation(reservation)}>
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
