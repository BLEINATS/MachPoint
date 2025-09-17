import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, BarChart2, Users, TrendingUp, Plus, Lock, Send, Calendar, Clock, User, Sparkles, Star, TrendingDown } from 'lucide-react';
import StatCard from './StatCard';
import { Quadra, Reserva, Aluno } from '../../types';
import { expandRecurringReservations } from '../../utils/reservationUtils';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { isSameDay, startOfMonth, endOfMonth, format, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '../Forms/Button';

const AnalyticsDashboard: React.FC = () => {
  const { arena, profile } = useAuth();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);

  const loadData = useCallback(() => {
    if (arena) {
      const savedQuadras = localStorage.getItem(`quadras_${arena.id}`);
      setQuadras(savedQuadras ? JSON.parse(savedQuadras) : []);
      const savedReservas = localStorage.getItem(`reservas_${arena.id}`);
      setReservas(savedReservas ? JSON.parse(savedReservas) : []);
      const savedAlunos = localStorage.getItem(`alunos_${arena.id}`);
      setAlunos(savedAlunos ? JSON.parse(savedAlunos) : []);
    }
  }, [arena]);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [loadData]);

  const analyticsData = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    
    const monthlyBookings = expandRecurringReservations(reservas, monthStart, monthEnd, quadras)
      .filter(r => r.status !== 'cancelada');

    const receitaDoMes = monthlyBookings.reduce((sum, r) => {
      const quadra = quadras.find(q => q.id === r.quadra_id);
      return sum + (quadra?.price_per_hour || 0);
    }, 0);

    const ocupacaoMedia = 58; // Mock
    const novosAlunos = alunos.length; // Mock
    const reservasHoje = monthlyBookings.filter(r => isSameDay(parseDateStringAsLocal(r.date), new Date())).length;

    return { receitaDoMes, ocupacaoMedia, novosAlunos, reservasHoje };
  }, [quadras, reservas, alunos]);
  
  const todaysReservations = useMemo(() => {
    const today = startOfDay(new Date());
    return expandRecurringReservations(reservas, today, today, quadras)
      .filter(r => r.status === 'confirmada')
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [reservas, quadras]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Action Center</h1>
        <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">
          Bom dia, {profile?.name}! Você tem <span className="font-bold text-brand-blue-500">{todaysReservations.length}</span> reservas confirmadas para hoje.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard index={0} icon={DollarSign} label="Receita do Mês" value={`R$ ${analyticsData.receitaDoMes.toLocaleString('pt-BR')}`} color="green" trend="+12%" />
        <StatCard index={1} icon={BarChart2} label="Ocupação Média" value={`${analyticsData.ocupacaoMedia}%`} color="blue" trend="+5%" />
        <StatCard index={2} icon={Users} label="Novos Alunos" value={analyticsData.novosAlunos} color="purple" />
        <StatCard index={3} icon={Calendar} label="Reservas Hoje" value={analyticsData.reservasHoje} color="yellow" />
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionButton icon={Plus} label="Nova Reserva" />
        <QuickActionButton icon={Lock} label="Bloquear Horário" />
        <QuickActionButton icon={User} label="Novo Aluno" />
        <QuickActionButton icon={Send} label="Notificação" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          <TodaysAgenda reservations={todaysReservations} quadras={quadras} />
          <RecentActivityFeed />
        </div>
        {/* Sidebar */}
        <div className="space-y-8">
          <InsightsWidget />
          <TopCourtsWidget quadras={quadras} />
        </div>
      </div>
    </div>
  );
};

const QuickActionButton: React.FC<{ icon: React.ElementType, label: string }> = ({ icon: Icon, label }) => (
  <Button variant="outline" className="w-full h-full flex-col py-4">
    <Icon className="h-6 w-6 mb-2 text-brand-gray-600 dark:text-brand-gray-400" />
    <span className="text-sm font-medium">{label}</span>
  </Button>
);

const TodaysAgenda: React.FC<{ reservations: Reserva[], quadras: Quadra[] }> = ({ reservations, quadras }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
    <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4">Agenda do Dia</h3>
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
      {reservations.length > 0 ? reservations.map(r => {
        const quadra = quadras.find(q => q.id === r.quadra_id);
        return (
          <div key={r.id} className="flex items-center gap-4 p-3 bg-brand-gray-50 dark:bg-brand-gray-700/50 rounded-lg">
            <div className="flex flex-col items-center justify-center bg-brand-blue-100 dark:bg-brand-blue-900/50 text-brand-blue-600 dark:text-brand-blue-300 rounded-lg p-2 w-20">
              <span className="font-bold text-lg">{r.start_time}</span>
              <span className="text-xs">às {r.end_time}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{r.clientName}</p>
              <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{quadra?.name || 'Quadra'}</p>
            </div>
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

const RecentActivityFeed: React.FC = () => {
    const activities = [
        { id: 1, icon: Calendar, text: "Nova reserva de Carlos Silva na Quadra Areia 1.", time: "2 min atrás", color: "text-green-500" },
        { id: 2, icon: User, text: "Maria Souza se tornou aluna.", time: "15 min atrás", color: "text-purple-500" },
        { id: 3, icon: Clock, text: "Horário das 20h na Quadra Sol foi cancelado.", time: "1 hora atrás", color: "text-red-500" },
        { id: 4, icon: Calendar, text: "Nova reserva de Ana Pereira na Quadra Society.", time: "3 horas atrás", color: "text-green-500" },
    ];
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700">
            <h3 className="font-bold text-xl text-brand-gray-900 dark:text-white mb-4">Atividade Recente</h3>
            <ul className="space-y-4">
                {activities.map(act => (
                    <li key={act.id} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full bg-brand-gray-100 dark:bg-brand-gray-700/50 ${act.color}`}>
                            <act.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-brand-gray-800 dark:text-brand-gray-200">{act.text}</p>
                            <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{act.time}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
};

const InsightsWidget: React.FC = () => {
    const insights = [
        { id: 1, icon: TrendingUp, text: "Terças às 19h é seu horário mais concorrido. Considere aumentar o preço neste slot.", color: "text-green-500" },
        { id: 2, icon: TrendingDown, text: "Quintas de manhã têm baixa ocupação. Que tal criar uma promoção?", color: "text-yellow-500" },
        { id: 3, icon: Star, text: "A 'Quadra Sol' gerou 35% da sua receita este mês. Destaque-a nas redes sociais!", color: "text-blue-500" },
    ];
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-brand-blue-500 to-brand-blue-700 dark:from-brand-blue-600 dark:to-brand-blue-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-bold text-xl mb-4 flex items-center"><Sparkles className="h-5 w-5 mr-2 text-yellow-300" /> Insights & Oportunidades</h3>
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
