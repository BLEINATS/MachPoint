import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, GraduationCap, BookOpen, Plus, Search, Edit2, Trash2, BadgeCheck, BadgeX, BadgeHelp, Phone, Calendar } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { Aluno, Professor, Quadra, Turma, Reserva } from '../types';
import Button from '../components/Forms/Button';
import Input from '../components/Forms/Input';
import AlunoModal from '../components/Alunos/AlunoModal';
import ProfessorModal from '../components/Alunos/ProfessorModal';
import TurmaModal from '../components/Alunos/TurmaModal';
import TurmaCard from '../components/Alunos/TurmaCard';
import { format } from 'date-fns';
import { parseDateStringAsLocal } from '../utils/dateUtils';

type TabType = 'alunos' | 'professores' | 'turmas';

const getNextDateForDay = (startDate: Date, dayOfWeek: number): Date => {
  const date = new Date(startDate.getTime());
  const currentDay = date.getDay();
  const distance = (dayOfWeek - currentDay + 7) % 7;
  date.setDate(date.getDate() + distance);
  return date;
};

const Alunos: React.FC = () => {
  const { arena } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('alunos');
  
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isAlunoModalOpen, setIsAlunoModalOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  
  const [isProfessorModalOpen, setIsProfessorModalOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);

  const [isTurmaModalOpen, setIsTurmaModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);

  const loadData = useCallback(() => {
    if (arena) {
      const savedAlunos = localStorage.getItem(`alunos_${arena.id}`);
      setAlunos(savedAlunos ? JSON.parse(savedAlunos) : []);
      const savedProfessores = localStorage.getItem(`professores_${arena.id}`);
      setProfessores(savedProfessores ? JSON.parse(savedProfessores) : []);
      const savedTurmas = localStorage.getItem(`turmas_${arena.id}`);
      setTurmas(savedTurmas ? JSON.parse(savedTurmas) : []);
      const savedQuadras = localStorage.getItem(`quadras_${arena.id}`);
      setQuadras(savedQuadras ? JSON.parse(savedQuadras) : []);
    }
  }, [arena]);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [loadData]);

  const handleSaveAluno = (alunoData: Omit<Aluno, 'id' | 'arena_id' | 'created_at' | 'profile_id'> | Aluno) => {
    if (!arena) return;
    const isEditing = 'id' in alunoData;
    const updatedAlunos = isEditing
      ? alunos.map(a => a.id === alunoData.id ? alunoData : a)
      : [...alunos, { ...alunoData, id: `aluno_${Date.now()}`, profile_id: `profile_mock_${Date.now()}`, arena_id: arena.id, created_at: new Date().toISOString() } as Aluno];
    setAlunos(updatedAlunos);
    localStorage.setItem(`alunos_${arena.id}`, JSON.stringify(updatedAlunos));
    setIsAlunoModalOpen(false);
    setEditingAluno(null);
  };

  const handleDeleteAluno = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este aluno?')) {
      const updatedAlunos = alunos.filter(a => a.id !== id);
      setAlunos(updatedAlunos);
      if (arena) localStorage.setItem(`alunos_${arena.id}`, JSON.stringify(updatedAlunos));
    }
  };

  const handleSaveProfessor = (professorData: Omit<Professor, 'id' | 'arena_id' | 'created_at'> | Professor) => {
    if (!arena) return;
    const isEditing = 'id' in professorData;
    const updatedProfessores = isEditing
      ? professores.map(p => p.id === professorData.id ? professorData : p)
      : [...professores, { ...professorData, id: `prof_${Date.now()}`, arena_id: arena.id, created_at: new Date().toISOString() } as Professor];
    setProfessores(updatedProfessores);
    localStorage.setItem(`professores_${arena.id}`, JSON.stringify(updatedProfessores));
    setIsProfessorModalOpen(false);
    setEditingProfessor(null);
  };

  const handleDeleteProfessor = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este professor?')) {
      const updatedProfessores = professores.filter(p => p.id !== id);
      setProfessores(updatedProfessores);
      if (arena) localStorage.setItem(`professores_${arena.id}`, JSON.stringify(updatedProfessores));
    }
  };

  const handleSaveTurma = (turmaData: Omit<Turma, 'id' | 'arena_id' | 'created_at'> | Turma) => {
    if (!arena) return;
    const isEditing = 'id' in turmaData;
    const turmaId = isEditing ? turmaData.id : `turma_${Date.now()}`;
    const newTurma: Turma = isEditing 
      ? turmaData as Turma
      : { ...turmaData, id: turmaId, arena_id: arena.id, created_at: new Date().toISOString() } as Turma;

    const updatedTurmas = isEditing
      ? turmas.map(t => t.id === newTurma.id ? newTurma : t)
      : [...turmas, newTurma];
    
    setTurmas(updatedTurmas);
    localStorage.setItem(`turmas_${arena.id}`, JSON.stringify(updatedTurmas));

    // --- Lógica de criação de reserva ---
    const savedReservas = localStorage.getItem(`reservas_${arena.id}`);
    const currentReservas: Reserva[] = savedReservas ? JSON.parse(savedReservas) : [];
    
    // Remove old reservations for this turma if editing
    const otherReservas = currentReservas.filter(r => r.turma_id !== turmaId);
    
    const newMasterReservations: Reserva[] = [];
    const startDate = parseDateStringAsLocal(newTurma.start_date);

    newTurma.daysOfWeek.forEach(day => {
      const firstOccurrenceDate = getNextDateForDay(startDate, day);
      const newMasterReserva: Reserva = {
        id: `reserva_turma_${turmaId}_${day}`,
        arena_id: arena.id,
        quadra_id: newTurma.quadra_id,
        turma_id: turmaId,
        date: format(firstOccurrenceDate, 'yyyy-MM-dd'),
        start_time: newTurma.start_time,
        end_time: newTurma.end_time,
        type: 'aula',
        status: 'confirmada',
        clientName: newTurma.name,
        isRecurring: true,
        recurringType: 'weekly',
        recurringEndDate: newTurma.end_date,
        profile_id: '', // Not tied to a single client profile
        created_at: new Date().toISOString(),
      };
      newMasterReservations.push(newMasterReserva);
    });

    const finalReservas = [...otherReservas, ...newMasterReservations];
    localStorage.setItem(`reservas_${arena.id}`, JSON.stringify(finalReservas));
    // --- Fim da lógica de reserva ---

    setIsTurmaModalOpen(false);
    setEditingTurma(null);
  };

  const handleDeleteTurma = (id: string) => {
    if (!arena || !window.confirm('Tem certeza que deseja excluir esta turma? As reservas recorrentes associadas também serão removidas.')) return;
    
    const updatedTurmas = turmas.filter(t => t.id !== id);
    setTurmas(updatedTurmas);
    localStorage.setItem(`turmas_${arena.id}`, JSON.stringify(updatedTurmas));

    const savedReservas = localStorage.getItem(`reservas_${arena.id}`);
    const currentReservas: Reserva[] = savedReservas ? JSON.parse(savedReservas) : [];
    const finalReservas = currentReservas.filter(r => r.turma_id !== id);
    localStorage.setItem(`reservas_${arena.id}`, JSON.stringify(finalReservas));
  };


  const filteredAlunos = useMemo(() => 
    alunos.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.email.toLowerCase().includes(searchTerm.toLowerCase())),
    [alunos, searchTerm]
  );

  const filteredProfessores = useMemo(() =>
    professores.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase())),
    [professores, searchTerm]
  );

  const filteredTurmas = useMemo(() =>
    turmas.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [turmas, searchTerm]
  );
  
  const availableSports = useMemo(() => [...new Set(quadras.map(q => q.sport_type))], [quadras]);
  const availablePlans = useMemo(() => [...new Set(alunos.map(a => a.plan_name).filter(Boolean))], [alunos]);


  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'alunos', label: 'Alunos', icon: Users },
    { id: 'professores', label: 'Professores', icon: GraduationCap },
    { id: 'turmas', label: 'Turmas', icon: BookOpen },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'alunos':
        return <AlunosList alunos={filteredAlunos} onEdit={setEditingAluno} onDelete={handleDeleteAluno} />;
      case 'professores':
        return <ProfessoresList professores={filteredProfessores} onEdit={setEditingProfessor} onDelete={handleDeleteProfessor} />;
      case 'turmas':
        return <TurmasList turmas={filteredTurmas} professores={professores} quadras={quadras} onEdit={setEditingTurma} onDelete={handleDeleteTurma} />;
      default:
        return null;
    }
  };
  
  useEffect(() => {
    if (editingAluno) setIsAlunoModalOpen(true);
  }, [editingAluno]);

  useEffect(() => {
    if (!isAlunoModalOpen) setEditingAluno(null);
  }, [isAlunoModalOpen]);
  
  useEffect(() => {
    if (editingProfessor) setIsProfessorModalOpen(true);
  }, [editingProfessor]);

  useEffect(() => {
    if (!isProfessorModalOpen) setEditingProfessor(null);
  }, [isProfessorModalOpen]);

  useEffect(() => {
    if (editingTurma) setIsTurmaModalOpen(true);
  }, [editingTurma]);

  useEffect(() => {
    if (!isTurmaModalOpen) setEditingTurma(null);
  }, [isTurmaModalOpen]);


  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Alunos e Turmas</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Gerencie sua comunidade de jogadores e aulas.</p>
        </motion.div>

        <div className="mb-8">
          <div className="border-b border-brand-gray-200 dark:border-brand-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400'
                      : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 dark:hover:border-brand-gray-600'
                  }`}
                >
                  <tab.icon className="mr-2 h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-4 mb-8 border border-brand-gray-200 dark:border-brand-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-auto sm:flex-1">
              <Input
                placeholder={`Buscar por ${activeTab.slice(0, -1)}...`}
                icon={<Search className="h-4 w-4 text-brand-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => {
              if (activeTab === 'alunos') setIsAlunoModalOpen(true);
              if (activeTab === 'professores') setIsProfessorModalOpen(true);
              if (activeTab === 'turmas') setIsTurmaModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar {activeTab.slice(0, -1)}
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <AlunoModal 
        isOpen={isAlunoModalOpen} 
        onClose={() => setIsAlunoModalOpen(false)} 
        onSave={handleSaveAluno} 
        initialData={editingAluno}
        availableSports={availableSports}
        availablePlans={availablePlans}
      />
      <ProfessorModal isOpen={isProfessorModalOpen} onClose={() => setIsProfessorModalOpen(false)} onSave={handleSaveProfessor} initialData={editingProfessor} />
      <TurmaModal 
        isOpen={isTurmaModalOpen}
        onClose={() => setIsTurmaModalOpen(false)}
        onSave={handleSaveTurma}
        initialData={editingTurma}
        professores={professores}
        quadras={quadras}
      />
    </Layout>
  );
};

const AlunosList: React.FC<{ alunos: Aluno[], onEdit: (aluno: Aluno) => void, onDelete: (id: string) => void }> = ({ alunos, onEdit, onDelete }) => {
  if (alunos.length === 0) return <PlaceholderTab title="Nenhum aluno encontrado" description="Clique em 'Adicionar Aluno' para começar a montar sua base de clientes." />;
  
  const getStatusProps = (status: Aluno['status']) => {
    switch (status) {
      case 'ativo': return { icon: BadgeCheck, color: 'text-green-500', label: 'Ativo' };
      case 'inativo': return { icon: BadgeX, color: 'text-red-500', label: 'Inativo' };
      case 'experimental': return { icon: BadgeHelp, color: 'text-yellow-500', label: 'Experimental' };
    }
  };

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
          <thead className="bg-brand-gray-50 dark:bg-brand-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Aluno</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Plano / Mensalidade</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-gray-500 dark:text-brand-gray-300 uppercase tracking-wider">Membro Desde</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-brand-gray-800 divide-y divide-brand-gray-200 dark:divide-brand-gray-700">
            {alunos.map((aluno, index) => {
              const statusProps = getStatusProps(aluno.status);
              return (
                <motion.tr 
                  key={aluno.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-brand-gray-50 dark:hover:bg-brand-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full object-cover" src={aluno.avatar_url || `https://avatar.vercel.sh/${aluno.email}.svg?text=${aluno.name.charAt(0)}`} alt={aluno.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-brand-gray-900 dark:text-white">{aluno.name}</div>
                        <div className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{aluno.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusProps.color.replace('text-', 'bg-').replace('-500', '-100')} dark:${statusProps.color.replace('text-', 'bg-').replace('-500', '-900/50')} ${statusProps.color}`}>
                      <statusProps.icon className="h-3 w-3 mr-1.5" />
                      {statusProps.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-gray-900 dark:text-white">{aluno.plan_name}</div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-semibold">{aluno.monthly_fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-gray-500 dark:text-brand-gray-400">
                    {format(new Date(aluno.join_date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(aluno)} className="p-2"><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(aluno.id)} className="p-2 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProfessoresList: React.FC<{ professores: Professor[], onEdit: (prof: Professor) => void, onDelete: (id: string) => void }> = ({ professores, onEdit, onDelete }) => {
  if (professores.length === 0) return <PlaceholderTab title="Nenhum professor encontrado" description="Cadastre os professores que dão aulas na sua arena." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {professores.map((prof, index) => (
        <motion.div
          key={prof.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700 p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <img src={prof.avatar_url || `https://avatar.vercel.sh/${prof.email}.svg?text=${prof.name.charAt(0)}`} alt={prof.name} className="w-16 h-16 rounded-full object-cover border-2 border-brand-gray-200 dark:border-brand-gray-600" />
                <div>
                  <h3 className="font-bold text-lg text-brand-gray-900 dark:text-white">{prof.name}</h3>
                  <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{prof.email}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(prof)} className="p-2"><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(prof.id)} className="p-2 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4 border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
              {prof.phone && (
                <div className="flex items-center text-brand-gray-600 dark:text-brand-gray-400">
                  <Phone className="h-4 w-4 mr-2 text-brand-gray-400" />
                  <span>{prof.phone}</span>
                </div>
              )}
              <div className="flex items-center text-brand-gray-600 dark:text-brand-gray-400">
                <Calendar className="h-4 w-4 mr-2 text-brand-gray-400" />
                <span>Incluso em: {format(new Date(prof.created_at), 'dd/MM/yyyy')}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-auto">
            <h4 className="text-sm font-medium text-brand-gray-800 dark:text-brand-gray-200 mb-2">Especialidades:</h4>
            <div className="flex flex-wrap gap-2">
              {prof.specialties.map(spec => (
                <span key={spec} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{spec}</span>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const TurmasList: React.FC<{ turmas: Turma[], professores: Professor[], quadras: Quadra[], onEdit: (turma: Turma) => void, onDelete: (id: string) => void }> = ({ turmas, professores, quadras, onEdit, onDelete }) => {
  if (turmas.length === 0) return <PlaceholderTab title="Nenhuma turma encontrada" description="Clique em 'Adicionar Turma' para criar sua primeira turma e começar a agendar aulas." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {turmas.map((turma, index) => (
        <TurmaCard
          key={turma.id}
          turma={turma}
          professor={professores.find(p => p.id === turma.professor_id)}
          quadra={quadras.find(q => q.id === turma.quadra_id)}
          onEdit={() => onEdit(turma)}
          onDelete={() => onDelete(turma.id)}
          index={index}
        />
      ))}
    </div>
  );
};

const PlaceholderTab: React.FC<{ title: string, description: string }> = ({ title, description }) => (
  <div className="text-center py-16">
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto">
      <div className="flex justify-center items-center w-16 h-16 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-full mx-auto mb-6">
        <Users className="h-8 w-8 text-brand-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-brand-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-brand-gray-600 dark:text-brand-gray-400">{description}</p>
    </motion.div>
  </div>
);

export default Alunos;
