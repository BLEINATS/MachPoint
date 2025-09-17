import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    DollarSign, BarChart2, Users, Plus, Lock, Send, Calendar, Clock, 
    User, Sparkles, Star, TrendingUp, TrendingDown, Phone, MessageCircle, Bookmark, Loader2 
} from 'lucide-react';
import StatCard from './StatCard';
import { Quadra, Reserva, Aluno } from '../../types';
import { expandRecurringReservations } from '../../utils/reservationUtils';
import { calculateMonthlyOccupancy } from '../../utils/analytics';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabaseClient';
import { isSameDay, startOfMonth, endOfMonth, format, parse, startOfDay, formatDistanceToNow, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../Forms/Button';

const AnalyticsDashboard: React.FC = () => {
  const { arena, profile } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!arena) {
        setIsLoading(false);
        return;
    }
    try {
      const { data: quadrasData, error: quadrasError } = await supabase.from('quadras').select('*, pricing_rules(*)').eq('arena_id', arena.id);
      if (quadrasError) throw quadrasError;
      setQuadras(quadrasData || []);

      const { data: reservasData, error: reservasError } = await supabase.from('reservas').select('*').eq('arena_id', arena.id);
      if (reservasError) throw reservasError;
      setReservas(reservasData || []);

      const { data: alunosData, error: alunosError } = await supabase.from('alunos').select('*').eq('arena_id', arena.id);
      if (alunosError) throw alunosError;
      setAlunos(alunosData || []);
    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados do dashboard: ${error.message}`, type: 'error' });
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

    const receitaDoMes = monthlyBookings.reduce((sum, r) => sum + (r.total_price || 0), 0);

    const ocupacaoMedia = calculateMonthlyOccupancy(today, reservas, quadras);
    const novosAlunos = alunos.length;
    const reservasHoje = monthlyBookings.filter(r => isSameDay(parseDateStringAsLocal(r.date), new Date())).length;
    
    const hourCounts: { [key: string]: number } = monthlyBookings.reduce((acc, r) => {
        const hour = r.start_time.split(':')[0];
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {});
    const horarioPico = Object.keys(hourCounts).length > 0 ? Object.keys(hourCounts).reduce((a, b) => (hourCounts[a] > hourCounts[b] ? a : b)) : 'N/A';

    const revenueByQuadraMonth: { [key: string]: number } = monthlyBookings.reduce((acc, r) => {
        acc[r.quadra_id] = (acc[r.quadra_id] || 0) + (r.total_price || 0);
        return acc;
    }, {});

    return { 
      receitaDoMes, 
      ocupacaoMedia: Math.round(ocupacaoMedia), 
      novosAlunos, 
      reservasHoje,
      horarioPico,
      revenueByQuadraMonth,
      monthlyBookings,
    };
  }, [quadras, reservas, alunos]);

  const insights = useMemo(() => {
    const newInsights = [];
    
    if (analyticsData.horarioPico !== 'N/A') {
        newInsights.push({ id: 1, icon: TrendingUp, text: `"${analyticsData.horarioPico}:00" é seu horário mais concorrido. Considere um ajuste de preço.`, color: "text-green-500" });
    }

    const dayOfWeekCounts: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    analyticsData.monthlyBookings.forEach(r => {
        const day = getDay(parseDateStringAsLocal(r.date));
        dayOfWeekCounts[day]++;
    });
    
    const dayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    let minDay = -1;
    let minCount = Infinity;
    Object.entries(dayOfWeekCounts).forEach(([day, count]) => {
        if (count > 0 && count < minCount) {
            minCount = count;
            minDay = parseInt(day);
        }
    });

    if (minDay !== -1) {
        newInsights.push({ id: 2, icon: TrendingDown, text: `${dayLabels[minDay]} tem baixa ocupação. Que tal criar uma promoção?`, color: "text-yellow-500" });
    }

    const topQuadraId = Object.keys(analyticsData.revenueByQuadraMonth).length > 0 ? Object.keys(analyticsData.revenueByQuadraMonth).reduce((a, b) => (analyticsData.revenueByQuadraMonth[a] > analyticsData.revenueByQuadraMonth[b] ? a : b)) : null;

    if (topQuadraId && analyticsData.receitaDoMes > 0) {
        const topQuadra = quadras.find(q => q.id === topQuadraId);
        if (topQuadra) {
            const percentage = (analyticsData.revenueByQuadraMonth[topQuadraId] / analyticsData.receitaDoMes) * 100;
            newInsights.push({ id: 3, icon: Star, text: `A quadra "${topQuadra.name}" gerou ${percentage.toFixed(0)}% da sua receita este mês. Destaque-a!`, color: "text-blue-500" });
        }
    }

    return newInsights.slice(0, 3);

  }, [analyticsData, quadras]);
  
  const todaysReservations = useMemo(() => {
    const today = startOfDay(new Date());
    return expandRecurringReservations(reservas, today, today, quadras)
      .filter(r => r.status === 'confirmada')
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [reservas, quadras]);

  const recentActivities = useMemo(() => {
    const reservaActivities = reservas.map(r => ({
      id: `res-${r.id}`,
      text: r.status === 'cancelada'
        ? `Reserva de ${r.clientName || 'Cliente'} foi cancelada.`
        : `Nova reserva de ${r.clientName || 'Cliente'}.`,
      time: r.created_at,
      icon: r.status === 'cancelada' ? Clock : Calendar,
      color: r.status === 'cancelada' ? 'text-red-500' : 'text-green-500',
    }));

    const alunoActivities = alunos.map(a => ({
      id: `aluno-${a.id}`,
      text: `${a.name} se tornou aluno.`,
      time: a.created_at,
      icon: User,
      color: 'text-purple-500',
    }));

    const allActivities = [...reservaActivities, ...alunoActivities];
    allActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return allActivities.slice(0, 5);
  }, [reservas, alunos]);

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'Nova Reserva':
        navigate('/reservas', { state: { openModal: true, type: 'normal' } });
        break;
      case 'Bloquear Horário':
        navigate('/reservas', { state: { openModal: true, type: 'bloqueio' } });
        break;
      case 'Novo Aluno':
        navigate('/alunos', { state: { openModal: true } });
        break;
      case 'Notificação':
        addToast({ message: 'Funcionalidade de notificações em desenvolvimento.', type: 'info' });
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-blue-500" /></div>;
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Action Center</h1>
        <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">
          Bom dia, {profile?.name}! Você tem <span className="font-bold text-brand-blue-500">{todaysReservations.length}</span> reservas confirmadas para hoje.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard index={0} icon={DollarSign} label="Receita do Mês" value={`R$ ${analyticsData.receitaDoMes.toLocaleString('pt-BR')}`} color="green" trend="+12%" />
        <StatCard index={1} icon={BarChart2} label="Ocupação Média" value={`${analyticsData.ocupacaoMedia}%`} color="blue" trend="+5%" />
        <StatCard index={2} icon={Users} label="Novos Alunos" value={analyticsData.novosAlunos} color="purple" />
        <StatCard index={3} icon={Calendar} label="Reservas Hoje" value={analyticsData.reservasHoje} color="yellow" />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionButton icon={Plus} label="Nova Reserva" onClick={() => handleActionClick('Nova Reserva')} />
        <QuickActionButton icon={Lock} label="Bloquear Horário" onClick={() => handleActionClick('Bloquear Horário')} />
        <QuickActionButton icon={User} label="Novo Aluno" onClick={() => handleActionClick('Novo Aluno')} />
        <QuickActionButton icon={Send} label="Notificação" onClick={() => handleActionClick('Notificação')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TodaysAgenda reservations={todaysReservations} quadras={quadras} allReservas={reservas} arenaName={arena?.name || ''} />
          <RecentActivityFeed activities={recentActivities} />
        </div>
        <div className="space-y-8">
          <InsightsWidget insights={insights} />
          <TopCourtsWidget quadras={quadras} />
        </div>
      </div>
    </div>
  );
};

const QuickActionButton: React.FC<{ icon: React.ElementType, label: string, onClick: () => void }> = ({ icon: Icon, label, onClick }) => (
  <Button variant="outline" className="w-full h-full flex-col py-4" onClick={onClick}>
    <Icon className="h-6 w-6 mb-2 text-brand-gray-600 dark:text-brand-gray-400" />
    <span className="text-sm font-medium">{label}</span>
  </Button>
);

const TodaysAgenda: React.FC<{ reservations: Reserva[], quadras: Quadra[], allReservas: Reserva[], arenaName: string }> = ({ reservations, quadras, allReservas, arenaName }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
    <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4">Agenda do Dia</h3>
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
      {reservations.length > 0 ? reservations.map(r => {
        const quadra = quadras.find(q => q.id === r.quadra_id);
        const clientReservations = allReservas.filter(res => res.clientName === r.clientName && res.status !== 'cancelada').length;
        
        return (
          <div key={r.id} className="flex items-start gap-4 p-3 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg">
            <div className="flex flex-col items-center justify-center bg-brand-blue-100 dark:bg-brand-blue-900/50 text-brand-blue-600 dark:text-brand-blue-300 rounded-lg p-2 w-20 text-center">
              <span className="font-bold text-lg">{r.start_time}</span>
              <span className="text-xs">às {r.end_time}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 truncate">{r.clientName}</p>
              <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 truncate">{quadra?.name || 'Quadra'}</p>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-brand-gray-500 dark:text-brand-gray-400">
                {r.clientPhone && (
                    <span className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {r.clientPhone}
                    </span>
                )}
                <span className="flex items-center">
                    <Bookmark className="h-3 w-3 mr-1" />
                    {clientReservations} reserva(s)
                </span>
              </div>
            </div>
             {r.clientPhone && (
                <a
                    href={`https://wa.me/55${r.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${r.clientName}! Lembrete da sua reserva na ${arenaName}, quadra ${quadra?.name}, hoje das ${r.start_time} às ${r.end_time}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full text-green-500 bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900 self-center"
                    title="Enviar lembrete no WhatsApp"
                >
                    <MessageCircle className="h-5 w-5" />
                </a>
            )}
          </div>
        );
      }) : (
        <div className="text-center py-10">
          <Calendar className="h-10 w-10 mx-auto text-brand-gray-400 mb-2" />
          <p className="text-brand-gray-500">Nenhuma reserva para hoje.</p>
        </div>
      )}
    </div>
  </motion.div>
);

const RecentActivityFeed: React.FC<{ activities: any[] }> = ({ activities }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4">Atividade Recente</h3>
            <ul className="space-y-4">
                {activities.length > 0 ? activities.map(act => (
                    <li key={act.id} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full bg-brand-gray-100 dark:bg-brand-gray-700/50 ${act.color}`}>
                            <act.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-brand-gray-800 dark:text-brand-gray-200">{act.text}</p>
                            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">
                                {formatDistanceToNow(new Date(act.time), { locale: ptBR, addSuffix: true })}
                            </p>
                        </div>
                    </li>
                )) : (
                    <div className="text-center py-8 text-brand-gray-500">
                        <p>Nenhuma atividade recente.</p>
                    </div>
                )}
            </ul>
        </motion.div>
    );
};

const InsightsWidget: React.FC<{ insights: any[] }> = ({ insights }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-brand-blue-500 to-brand-blue-700 dark:from-brand-blue-600 dark:to-brand-blue-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-bold text-xl mb-4 flex items-center"><Sparkles className="h-5 w-5 mr-2 text-yellow-300" /> Insights & Oportunidades</h3>
            {insights.length > 0 ? (
                <ul className="space-y-4">
                    {insights.map(ins => (
                        <li key={ins.id} className="flex items-start gap-3">
                            <div className="p-1 rounded-full bg-white/20">
                            <ins.icon className={`h-5 w-5 ${ins.color}`} />
                            </div>
                            <p className="text-sm text-blue-100">{ins.text}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-blue-100">Nenhum insight disponível no momento. Continue usando o sistema para gerar análises.</p>
            )}
        </motion.div>
    );
};

const TopCourtsWidget: React.FC<{ quadras: Quadra[] }> = ({ quadras }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4">Top Quadras</h3>
        <div className="space-y-3">
            {quadras.slice(0, 3).map((q, i) => (
                <div key={q.id} className="flex items-center gap-3">
                    <span className="font-bold text-brand-gray-500">{i + 1}</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-brand-gray-800 dark:text-brand-gray-200">{q.name}</p>
                        <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-1.5 mt-1">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${80 - i * 15}%` }}></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </motion.div>
);

export default AnalyticsDashboard;
