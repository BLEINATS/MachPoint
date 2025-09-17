import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, DollarSign, BarChart2, Users, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import QuadraFormTabs from '../components/Forms/QuadraFormTabs';
import QuadraCard from '../components/Dashboard/QuadraCard';
import { Quadra, Reserva, PricingRule } from '../types';
import { startOfMonth, endOfMonth, getDay, parse, isSameDay, eachDayOfInterval, addDays } from 'date-fns';
import { expandRecurringReservations } from '../utils/reservationUtils';
import { parseDateStringAsLocal } from '../utils/dateUtils';

const StatCard: React.FC<{ icon: React.ElementType, label: string, value: string | number, color: string, index: number }> = ({ icon: Icon, label, value, color, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-4 border border-brand-gray-200 dark:border-brand-gray-700"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
          <p className="text-2xl font-bold text-brand-gray-900 dark:text-white truncate">{value}</p>
        </div>
        <div className="p-2 bg-brand-gray-100 dark:bg-brand-gray-900 rounded-lg">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </motion.div>
);

const Quadras: React.FC = () => {
  const { arena } = useAuth();
  const { addToast } = useToast();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuadra, setEditingQuadra] = useState<Quadra | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!arena) return;
    setIsLoading(true);
    try {
      const { data: quadrasData, error: quadrasError } = await supabase
        .from('quadras')
        .select('*, pricing_rules(*)')
        .eq('arena_id', arena.id);
      if (quadrasError) throw quadrasError;

      setQuadras(quadrasData || []);

      const { data: reservasData, error: reservasError } = await supabase
        .from('reservas')
        .select('*')
        .eq('arena_id', arena.id);
      if (reservasError) throw reservasError;
      setReservas(reservasData || []);

    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const analyticsData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const monthlyBookings = expandRecurringReservations(reservas, monthStart, monthEnd, quadras)
        .filter(r => r.status !== 'cancelada');
    
    const todaysBookings = monthlyBookings.filter(r => isSameDay(parseDateStringAsLocal(r.date), today));

    const receitaDoDia = todaysBookings.reduce((sum, r) => sum + (r.total_price || 0), 0);

    const hourCounts: { [key: string]: number } = monthlyBookings.reduce((acc, r) => {
        const hour = r.start_time.split(':')[0];
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {});
    const horarioPico = Object.keys(hourCounts).reduce((a, b) => (hourCounts[a] > hourCounts[b] ? a : b), 'N/A');

    const revenueByQuadraMonth: { [key: string]: number } = monthlyBookings.reduce((acc, r) => {
        acc[r.quadra_id] = (acc[r.quadra_id] || 0) + (r.total_price || 0);
        return acc;
    }, {});
    const topQuadraId = Object.keys(revenueByQuadraMonth).reduce((a, b) => (revenueByQuadraMonth[a] > revenueByQuadraMonth[b] ? a : b), '');
    const quadraMaisRentavel = quadras.find(q => q.id === topQuadraId)?.name || 'N/A';

    const calculateEstimatedMonthlyRevenue = (quadra: Quadra, occupancyRate: number): number => {
      if (quadra.status !== 'ativa' || !quadra.pricing_rules || quadra.pricing_rules.length === 0) return 0;
      const activeRules = quadra.pricing_rules.filter(r => r.is_active);
      if (activeRules.length === 0) return 0;

      const avgPrice = activeRules.reduce((sum, rule) => sum + rule.price_single, 0) / activeRules.length;
      
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      let totalAvailableHours = 0;
      
      const calculateHoursInDay = (horarioString: string): number => {
          if (!horarioString) return 0;
          let dailyHours = 0;
          const ranges = horarioString.split(',');
          for (const range of ranges) {
              const [startStr, endStr] = range.trim().split('-');
              if (!startStr || !endStr) continue;
              try {
                  const start = parse(startStr, 'HH:mm', new Date());
                  let end = parse(endStr, 'HH:mm', new Date());
                  if (end <= start) end = addDays(end, 1);
                  dailyHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              } catch (e) { /* ignore */ }
          }
          return dailyHours;
      };
      
      for (const day of daysInMonth) {
          const dayOfWeek = getDay(day);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const diaStr = (['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const)[dayOfWeek];
          if (!quadra.horarios.diasFuncionamento[diaStr]) continue;
          const horarioString = isWeekend ? quadra.horarios.horarioFimSemana : quadra.horarios.horarioSemana;
          totalAvailableHours += calculateHoursInDay(horarioString);
      }
      return totalAvailableHours * (occupancyRate / 100) * avgPrice;
    };

    const revenueByQuadraMonthlyEstimated: { [key: string]: number } = {};
    quadras.forEach(quadra => {
        revenueByQuadraMonthlyEstimated[quadra.id] = calculateEstimatedMonthlyRevenue(quadra, 70);
    });

    return {
        receitaDoDia,
        ocupacaoMedia: "N/A",
        horarioPico: horarioPico !== 'N/A' ? `${horarioPico}:00` : 'N/A',
        quadraMaisRentavel,
        revenueByQuadraMonthlyEstimated,
    };
  }, [quadras, reservas]);

  const handleSaveQuadra = async (quadraData: any) => {
    if (!arena) return;
    setIsSaving(true);
    try {
      const { pricing_rules, photos, ...coreQuadraData } = quadraData;
      const isEditing = !!coreQuadraData.id;
      
      // 1. Upsert core quadra data
      const quadraToSave = { ...coreQuadraData, arena_id: arena.id };
      if (!isEditing) delete quadraToSave.id;

      const { data: savedQuadra, error: quadraError } = await supabase
        .from('quadras')
        .upsert(quadraToSave)
        .select()
        .single();
      if (quadraError) throw quadraError;
      
      const quadraId = savedQuadra.id;

      // 2. Photo management
      const newFiles = photos.filter((p: any) => p instanceof File);
      const existingUrls = photos.filter((p: any) => typeof p === 'string');
      const uploadedUrls: string[] = [];
      
      const sanitizeFileName = (fileName: string): string => {
        return fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.\-_]/g, '_').replace(/_+/g, '_');
      };

      for (const file of newFiles) {
        const sanitizedFileName = sanitizeFileName(file.name);
        const filePath = `public/${arena.id}/${quadraId}/${Date.now()}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage.from('quadra-photos').upload(filePath, file);
        if (uploadError) throw new Error(`Falha no upload da foto: ${uploadError.message}`);
        const { data: publicUrlData } = supabase.storage.from('quadra-photos').getPublicUrl(filePath);
        uploadedUrls.push(publicUrlData.publicUrl);
      }
      
      const initialUrls = editingQuadra?.photos || [];
      const urlsToDelete = initialUrls.filter(url => !existingUrls.includes(url));
      if (urlsToDelete.length > 0) {
        const pathsToDelete = urlsToDelete.map(url => url.split('/quadra-photos/')[1]).filter(Boolean);
        if(pathsToDelete.length > 0) await supabase.storage.from('quadra-photos').remove(pathsToDelete);
      }

      const finalPhotoUrls = [...existingUrls, ...uploadedUrls];
      
      const { error: photoUpdateError } = await supabase.from('quadras').update({ photos: finalPhotoUrls }).eq('id', quadraId);
      if (photoUpdateError) throw photoUpdateError;

      // 3. Handle pricing rules
      const originalRules = editingQuadra?.pricing_rules || [];
      const newRulesData = pricing_rules as PricingRule[];

      const originalRuleIds = originalRules.map(r => r.id);
      const newRuleIds = newRulesData.map(r => r.id);
      const ruleIdsToDelete = originalRuleIds.filter(id => !newRuleIds.includes(id) && !id.startsWith('new_'));
      if (ruleIdsToDelete.length > 0) {
        const { error } = await supabase.from('pricing_rules').delete().in('id', ruleIdsToDelete);
        if (error) throw error;
      }

      const rulesToInsert = newRulesData.filter(rule => rule.id.startsWith('new_')).map(({ id, ...rest }) => ({ ...rest, quadra_id: quadraId, arena_id: arena.id }));
      if (rulesToInsert.length > 0) {
        const { error } = await supabase.from('pricing_rules').insert(rulesToInsert);
        if (error) throw error;
      }

      const rulesToUpdate = newRulesData.filter(rule => !rule.id.startsWith('new_')).map(rule => ({ ...rule, quadra_id: quadraId, arena_id: arena.id }));
      if (rulesToUpdate.length > 0) {
        const { error } = await supabase.from('pricing_rules').upsert(rulesToUpdate);
        if (error) throw error;
      }

      addToast({ message: `Quadra ${isEditing ? 'atualizada' : 'criada'} com sucesso!`, type: 'success' });
      setIsFormOpen(false);
      setEditingQuadra(null);
      await loadData();
    } catch (error: any) {
      addToast({ message: `Erro ao salvar: ${error.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreateForm = () => { setEditingQuadra(null); setIsFormOpen(true); };
  const handleOpenEditForm = (quadra: Quadra) => { setEditingQuadra(quadra); setIsFormOpen(true); };
  const handleCancelForm = () => { setIsFormOpen(false); setEditingQuadra(null); };
  
  const handleDeleteQuadra = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta quadra? Todas as regras de preço e fotos associadas serão removidas.')) {
      try {
        const { error } = await supabase.from('quadras').delete().eq('id', id);
        if (error) throw error;
        addToast({ message: 'Quadra excluída com sucesso.', type: 'success' });
        await loadData();
      } catch (error: any) {
        addToast({ message: `Erro ao excluir: ${error.message}`, type: 'error' });
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {isFormOpen ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <QuadraFormTabs onSubmit={handleSaveQuadra} onCancel={handleCancelForm} initialData={editingQuadra} isSaving={isSaving} />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Dashboard de Quadras</h1>
                <Button onClick={handleOpenCreateForm}><Plus className="h-4 w-4 mr-2" /> Nova Quadra</Button>
              </div>

              {isLoading ? (
                  <div className="text-center py-16"><div className="w-8 h-8 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
              ) : quadras.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
                  <MapPin className="h-12 w-12 text-brand-gray-400 dark:text-brand-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-brand-gray-900 dark:text-white mb-2">Nenhuma quadra cadastrada</h3>
                  <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-6">Comece criando sua primeira quadra para receber reservas.</p>
                  <Button onClick={handleOpenCreateForm}><Plus className="h-4 w-4 mr-2" /> Criar primeira quadra</Button>
                </div>
              ) : (
                <div className="space-y-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard index={0} icon={DollarSign} label="Receita de Hoje" value={analyticsData.receitaDoDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} color="text-green-500" />
                        <StatCard index={1} icon={BarChart2} label="Ocupação (Mês)" value={`${analyticsData.ocupacaoMedia}`} color="text-blue-500" />
                        <StatCard index={2} icon={Clock} label="Horário de Pico (Mês)" value={analyticsData.horarioPico} color="text-yellow-500" />
                        <StatCard index={3} icon={Users} label="Quadra Rentável (Mês)" value={analyticsData.quadraMaisRentavel} color="text-purple-500" />
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-white mb-6">Lista de Quadras</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {quadras.map((quadra, index) => (
                                <QuadraCard 
                                    key={quadra.id} 
                                    quadra={quadra} 
                                    onEdit={() => handleOpenEditForm(quadra)} 
                                    onDelete={() => handleDeleteQuadra(quadra.id)} 
                                    index={index}
                                    monthlyEstimatedRevenue={analyticsData.revenueByQuadraMonthlyEstimated[quadra.id] || 0}
                                />
                            ))}
                        </div>
                    </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Quadras;
