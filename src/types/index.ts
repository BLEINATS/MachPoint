export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Arena {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  cnpj_cpf?: string;
  responsible_name?: string;
  contact_phone?: string;
  public_email?: string;
  cep?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  google_maps_link?: string;
  cancellation_policy?: string;
  terms_of_use?: string;
  created_at: string;
  // Deprecated, kept for compatibility with mock data
  main_image?: string;
}

export interface Profile {
  id: string;
  arena_id?: string;
  role: 'admin_arena' | 'cliente';
  name?: string;
  avatar_url?: string;
  birth_date?: string; // 'yyyy-MM-dd'
  gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informado';
  clientType?: 'cliente' | 'aluno' | 'professor';
  created_at: string;
}

export interface ArenaMembership {
  profile_id: string;
  arena_id: string;
}

export interface QuadraComodidades {
  vestiario: boolean;
  chuveiro: boolean;
  estacionamento: boolean;
  lanchonete: boolean;
  wifi: boolean;
  arCondicionado: boolean;
  somAmbiente: boolean;
  arquibancada: boolean;
  churrasqueira: boolean;
}

export interface QuadraHorarios {
  diasFuncionamento: {
    seg: boolean;
    ter: boolean;
    qua: boolean;
    qui: boolean;
    sex: boolean;
    sab: boolean;
    dom: boolean;
  };
  horarioSemana: string; // ex: "08:00-22:00"
  horarioFimSemana: string; // ex: "08:00-22:00"
}

export interface Quadra {
  id: string;
  arena_id: string;
  // Básico
  name: string;
  sport_type: string;
  status: 'ativa' | 'inativa' | 'manutencao';
  capacity: number;
  price_per_hour: number;
  location: string;
  // Detalhes
  description: string;
  floor_type: string;
  is_covered: boolean;
  has_lighting: boolean;
  comodidades: QuadraComodidades;
  rules: string;
  // Horários
  horarios: QuadraHorarios;
  booking_interval_minutes: number; // Nova propriedade
  // Fotos
  photos: string[]; // URLs das fotos
  created_at: string;
}

export type ReservationType = 'normal' | 'aula' | 'torneio' | 'bloqueio' | 'evento';
export type RecurringType = 'daily' | 'weekly';

export interface Reserva {
  id: string;
  quadra_id: string;
  profile_id: string; // ID do perfil do cliente, se cadastrado
  arena_id: string;
  date: string; // 'yyyy-MM-dd'
  start_time: string; // 'HH:mm'
  end_time: string; // 'HH:mm'
  status: 'pendente' | 'confirmada' | 'cancelada';
  type: ReservationType;
  created_at: string;
  // Para reservas manuais
  clientName?: string;
  clientPhone?: string;
  notes?: string; // Para bloqueios, eventos, etc.
  // Recorrência
  isRecurring: boolean;
  recurringType?: RecurringType;
  recurringEndDate?: string | null;
  // Para instâncias virtuais
  masterId?: string;
  turma_id?: string;
  torneio_id?: string;
  evento_id?: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  arena: Arena | null; // Para admin
  // Para clientes
  memberships: ArenaMembership[];
  selectedArenaContext: Arena | null;
  isLoading: boolean;
}

// MÓDULO DE ALUNOS E TURMAS
export interface Aluno {
  id: string;
  profile_id: string; // Link para o perfil de usuário
  arena_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status: 'ativo' | 'inativo' | 'experimental';
  sport: string;
  plan_name: string; // Ex: "Plano Mensal - 2x"
  monthly_fee: number;
  join_date: string; // 'yyyy-MM-dd'
  created_at: string;
}

export interface Professor {
  id: string;
  arena_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  specialties: string[]; // Ex: ['Beach Tennis', 'Funcional']
  created_at: string;
}

export interface Turma {
  id: string;
  arena_id: string;
  name: string;
  professor_id: string;
  quadra_id: string;
  sport: string;
  daysOfWeek: number[]; // 0-6 (Sun-Sat)
  start_time: string;
  end_time: string;
  start_date: string; // yyyy-MM-dd
  end_date?: string | null; // yyyy-MM-dd
  capacity: number;
  student_ids: string[]; // Array de IDs de Alunos
  created_at: string;
}

// MÓDULO DE TORNEIOS
export type TorneioStatus = 'planejado' | 'inscricoes_abertas' | 'em_andamento' | 'concluido' | 'cancelado';
export type TorneioTipo = 'torneio' | 'campeonato' | 'clinica' | 'evento_especial';

export interface Participant {
  id: string;
  name: string;
  email: string;
  checked_in: boolean;
}

export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  participant_ids: (string | null)[];
  score: (number | null)[];
  winner_id: string | null;
  nextMatchId: string | null;
}

export interface Torneio {
  id: string;
  arena_id: string;
  name: string;
  type: TorneioTipo;
  status: TorneioStatus;
  start_date: string; // yyyy-MM-dd
  end_date: string; // yyyy-MM-dd
  description: string;
  banner_url?: string;
  quadras_ids: string[];
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  created_at: string;
  // Novos campos
  categories: string[];
  max_participants: number;
  registration_fee: number;
  participants: Participant[];
  matches: Match[];
}

// MÓDULO DE EVENTOS PRIVADOS
export type EventoStatus = 'orcamento' | 'pendente' | 'confirmado' | 'realizado' | 'concluido' | 'cancelado';
export type EventoTipoPrivado = 'festa' | 'corporativo' | 'aniversario' | 'show' | 'outro';

export interface Evento {
  id: string;
  arena_id: string;
  name: string;
  type: EventoTipoPrivado;
  status: EventoStatus;
  
  // Cliente
  clientName: string;
  clientPhone: string;
  clientEmail: string;

  // Datas e Horários
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  expectedGuests: number;

  // Espaços
  quadras_ids: string[];
  additionalSpaces: string[]; // e.g., 'churrasqueira', 'salao'

  // Financeiro
  services: { name: string; price: number; included: boolean }[];
  totalValue: number;
  depositValue: number;
  paymentConditions: string;
  payments: { id: string; date: string; amount: number; method: string }[];
  
  // Outros
  notes: string;
  created_at: string;
  checklist: { id: string; text: string; completed: boolean }[];
}
