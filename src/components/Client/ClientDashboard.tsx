import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Quadra, Reserva, Aluno, Turma, Professor } from '../../types';
import { Calendar, History, Heart, Compass, Plus, Search, Sparkles, GraduationCap, BarChart2 } from 'lucide-react';
import { isAfter, startOfDay, isSameDay, formatDistanceToNow, parse, getDay, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import UpcomingReservationCard from './UpcomingReservationCard';
import FavoriteCourtCard from './FavoriteCourtCard';
import Button from '../Forms/Button';
import ArenaSelector from './ArenaSelector';
import RecommendationCard from './RecommendationCard';
import NextClassCard from './Student/NextClassCard';
import AttendanceCalendar from './Student/AttendanceCalendar';

const ClientDashboard: React.FC = () => {
  const { profile, selectedArenaContext, switchArenaContext, memberships, allArenas } = useAuth();
  const navigate = useNavigate();

  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);

  const myArenas = useMemo(() => {
    return allArenas.filter(arena => memberships.some(m => m.arena_id === arena.id));
  }, [allArenas, memberships]);
  
  const loadArenaData = useCallback(() => {
    if (selectedArenaContext) {
      const savedQuadras = localStorage.getItem(`quadras_${selectedArenaContext.id}`);
      setQuadras(savedQuadras ? JSON.parse(savedQuadras) : []);
      
      const savedReservas = localStorage.getItem(`reservas_${selectedArenaContext.id}`);
      setReservas(savedReservas ? JSON.parse(savedReservas) : []);

      const savedAlunos = localStorage.getItem(`alunos_${selectedArenaContext.id}`);
      setAlunos(savedAlunos ? JSON.parse(savedAlunos) : []);

      const savedTurmas = localStorage.getItem(`turmas_${selectedArenaContext.id}`);
      setTurmas(savedTurmas ? JSON.parse(savedTurmas) : []);

      const savedProfessores = localStorage.getItem(`professores_${selectedArenaContext.id}`);
      setProfessores(savedProfessores ? JSON.parse(savedProfessores) : []);
    } else {
      setQuadras([]);
      setReservas([]);
      setAlunos([]);
      setTurmas([]);
      setProfessores([]);
    }
  }, [selectedArenaContext]);

  useEffect(() => {
    loadArenaData();
  }, [loadArenaData]);

  // --- Lógica de Cliente ---
  const clientReservations = useMemo(() => {
    return reservas.filter(r => r.profile_id === profile?.id);
  }, [reservas, profile]);

  const upcomingReservations = useMemo(() => {
    const today = startOfDay(new Date());
    return clientReservations
      .filter(r => (isAfter(parseDateStringAsLocal(r.date), today) || isSameDay(parseDateStringAsLocal(r.date), today)) && r.status === 'confirmada')
      .sort((a, b) => parseDateStringAsLocal(a.date).getTime() - parseDateStringAsLocal(b.date).getTime() || a.start_time.localeCompare(b.start_time));
  }, [clientReservations]);

  const favoriteQuadraIds = useMemo(() => {
    const saved = localStorage.getItem(`favorite_quadras_${profile?.id}`);
    return saved ? JSON.parse(saved) : [];
  }, [profile?.id]);

  const favoriteQuadras = useMemo(() => {
    return quadras.filter(q => favoriteQuadraIds.includes(q.id));
  }, [quadras, favoriteQuadraIds]);

  const recentHistory = useMemo(() => {
    return [
      { id: 1, text: `Você reservou a Quadra Areia 1`, time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { id: 2, text: `Você começou a seguir a Arena Ipanema`, time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ];
  }, []);

  // --- Lógica de Aluno ---
  const studentProfile = useMemo(() => {
    // A chave aqui é o profile.id do usuário logado, que deve corresponder ao profile_id no registro do aluno
    return alunos.find(a => a.profile_id === profile?.id);
  }, [alunos, profile]);

  const isStudent = useMemo(() => !!studentProfile, [studentProfile]);

  const studentTurmas = useMemo(() => {
    if (!isStudent || !studentProfile) return [];
    return turmas.filter(t => t.student_ids.includes(studentProfile.id));
  }, [isStudent, studentProfile, turmas]);

  const nextClass = useMemo(() => {
    if (!isStudent || studentTurmas.length === 0) return null;

    const now = new Date();
    let upcomingClasses: any[] = [];

    studentTurmas.forEach(turma => {
      let runDate = startOfDay(new Date());
      // Check for the next 30 days
      for (let i = 0; i < 30; i++) {
        if (turma.daysOfWeek.includes(getDay(runDate))) {
          const classDateTime = parse(turma.start_time, 'HH:mm', runDate);
          if (isAfter(classDateTime, now)) {
            upcomingClasses.push({
              turma,
              date: new Date(runDate),
              dateTime: classDateTime,
              quadra: quadras.find(q => q.id === turma.quadra_id),
              professor: professores.find(p => p.id === turma.professor_id),
            });
          }
        }
        runDate = addDays(runDate, 1);
      }
    });

    if (upcomingClasses.length === 0) return null;

    upcomingClasses.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    return upcomingClasses[0];
  }, [isStudent, studentTurmas, quadras, professores]);
  
  const mockAttendance = useMemo(() => {
    if (!isStudent) return [];
    const attendance = [];
    let date = startOfDay(new Date());
    for (let i = 0; i < 30; i++) {
        const dayOfWeek = getDay(date);
        if (studentTurmas.some(t => t.daysOfWeek.includes(dayOfWeek))) {
            if (isBefore(date, startOfDay(new Date()))) {
                attendance.push({ date: new Date(date), status: Math.random() > 0.15 ? 'present' : 'absent' });
            }
        }
        date = addDays(date, 1);
    }
    return attendance;
  }, [isStudent, studentTurmas]);

  
  if (myArenas.length === 0) {
    return (
      <div className="text-center py-16">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <Compass className="h-16 w-16 text-brand-blue-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Bem-vindo, {profile?.name}!</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-4 max-w-md mx-auto">Parece que você ainda não segue nenhuma arena. Explore e encontre seu próximo local de jogo!</p>
          <Button size="lg" className="mt-8" onClick={() => navigate('/arenas')}>
            <Search className="h-5 w-5 mr-2" />
            Encontrar Arenas
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Olá, {profile?.name || 'Cliente'}!</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">
            {isStudent ? "Sua jornada esportiva começa aqui." : "Pronto para a próxima partida?"}
          </p>
        </div>
        <ArenaSelector arenas={myArenas} selectedArena={selectedArenaContext} onSelect={switchArenaContext} />
      </motion.div>

      {!selectedArenaContext ? (
        <div className="text-center py-16 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <Compass className="h-12 w-12 text-brand-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-200">Selecione uma arena</h2>
            <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Escolha uma das suas arenas para ver suas reservas e quadras.</p>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* SEÇÃO DE ALUNO */}
          {isStudent && (
            <>
              <DashboardSection icon={GraduationCap} title="Minhas Aulas">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    {nextClass ? (
                      <NextClassCard 
                        date={nextClass.date} 
                        turmaName={nextClass.turma.name}
                        quadraName={nextClass.quadra?.name}
                        professorName={nextClass.professor?.name}
                        startTime={nextClass.turma.start_time}
                      />
                    ) : (
                      <EmptyState message="Você não tem próximas aulas agendadas." actionText="Ver turmas" link="#" />
                    )}
                  </div>
                  <div className="lg:col-span-2 bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 p-6">
                      <h3 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 mb-4">Avisos do Professor</h3>
                      <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">Não esqueçam a garrafa d'água e o protetor solar para a aula de amanhã! O foco será em saque e recepção. 🔥</p>
                  </div>
                </div>
              </DashboardSection>

              <DashboardSection icon={BarChart2} title="Meu Desempenho">
                <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 p-6">
                  <AttendanceCalendar attendance={mockAttendance} turmas={studentTurmas} />
                </div>
              </DashboardSection>
            </>
          )}

          {/* SEÇÕES DE CLIENTE */}
          <DashboardSection icon={Sparkles} title="Recomendações para Você">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RecommendationCard index={0} quadraName="Quadra Sol" day="terça" time="19:00" arenaSlug={selectedArenaContext.slug} />
            </div>
          </DashboardSection>

          <DashboardSection icon={Calendar} title="Próximas Reservas (Jogos)">
            {upcomingReservations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingReservations.slice(0,3).map((res, index) => (
                  <UpcomingReservationCard key={res.id} reservation={res} quadra={quadras.find(q => q.id === res.quadra_id)} index={index} />
                ))}
              </div>
            ) : (
              <EmptyState message="Você não tem nenhuma reserva de jogo avulso nesta arena." actionText="Ver quadras disponíveis" link={`/${selectedArenaContext.slug}`} />
            )}
          </DashboardSection>

          {favoriteQuadras.length > 0 && (
            <DashboardSection icon={Heart} title="Suas Quadras Favoritas">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {favoriteQuadras.map((quadra, index) => (
                  <FavoriteCourtCard key={quadra.id} quadra={quadra} index={index} arenaSlug={selectedArenaContext.slug} />
                ))}
              </div>
            </DashboardSection>
          )}

          <DashboardSection icon={History} title="Histórico Recente">
            <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700 p-4">
              <ul className="divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
                {recentHistory.map((item, index) => (
                  <motion.li 
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="py-3 flex justify-between items-center"
                  >
                    <p className="text-sm text-brand-gray-700 dark:text-brand-gray-300">{item.text}</p>
                    <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{formatDistanceToNow(item.time, { locale: ptBR, addSuffix: true })}</p>
                  </motion.li>
                ))}
              </ul>
            </div>
          </DashboardSection>
        </div>
      )}
    </div>
  );
};

const DashboardSection: React.FC<{icon: React.ElementType, title: string, children: React.ReactNode}> = ({ icon: Icon, title, children }) => (
  <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
    <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-200 mb-6 flex items-center">
      <Icon className="h-6 w-6 mr-3 text-brand-blue-500" />
      {title}
    </h2>
    {children}
  </motion.section>
);

const EmptyState: React.FC<{message: string, actionText: string, link: string, icon?: React.ElementType}> = ({ message, actionText, link, icon: Icon }) => {
  const navigate = useNavigate();
  return (
    <div className="text-center h-full flex flex-col justify-center items-center py-10 px-6 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-700">
      {Icon && <Icon className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />}
      <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-4">{message}</p>
      <Button onClick={() => navigate(link)}>
        <Plus className="h-4 w-4 mr-2" />
        {actionText}
      </Button>
    </div>
  );
};

export default ClientDashboard;
