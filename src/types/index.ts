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
  horarioSemana: string;
  horarioFimSemana: string;
}

export interface PricingRule {
  id: string;
  arena_id: string;
  quadra_id: string;
  sport_type: string;
  start_time: string; // 'HH:mm'
  end_time: string; // 'HH:mm'
  days_of_week: number[]; // 0=Dom, 1=Seg, ..., 6=Sáb
  price_single: number;
  price_monthly: number;
  is_active: boolean;
  created_at: string;
}

export interface Quadra {
  id: string;
  arena_id: string;
  name: string;
  sport_type: string;
  status: 'ativa' | 'inativa' | 'manutencao';
  capacity: number;
  location: string;
  description: string;
  floor_type: string;
  is_covered: boolean;
  has_lighting: boolean;
  comodidades: QuadraComodidades;
  rules: string;
  horarios: QuadraHorarios;
  booking_interval_minutes: number;
  photos: string[];
  created_at: string;
  pricing_rules: PricingRule[];
}

export type ReservationType = 'normal' | 'aula' | 'torneio' | 'bloqueio' | 'evento';
export type RecurringType = 'daily' | 'weekly';

export interface Reserva {
  id: string;
  quadra_id: string;
  profile_id: string;
  arena_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pendente' | 'confirmada' | 'cancelada';
  type: ReservationType;
  created_at: string;
  clientName?: string;
  clientPhone?: string;
  notes?: string;
  total_price?: number;
  sport_type?: string;
  isRecurring: boolean;
  recurringType?: RecurringType;
  recurringEndDate?: string | null;
  masterId?: string;
  turma_id?: string;
  torneio_id?: string;
  evento_id?: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  arena: Arena | null;
  memberships: ArenaMembership[];
  selectedArenaContext: Arena | null;
  isLoading: boolean;
}

export interface Aluno {
  id: string;
  profile_id: string;
  arena_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status: 'ativo' | 'inativo' | 'experimental';
  sport: string;
  plan_name: string;
  monthly_fee: number;
  join_date: string;
  created_at: string;
}

export interface Professor {
  id: string;
  arena_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  specialties: string[];
  created_at: string;
}

export interface Turma {
  id: string;
  arena_id: string;
  name: string;
  professor_id: string;
  quadra_id: string;
  sport: string;
  daysOfWeek: number[];
  start_time: string;
  end_time: string;
  start_date: string;
  end_date?: string | null;
  capacity: number;
  student_ids: string[];
  created_at: string;
}

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
  start_date: string;
  end_date: string;
  description: string;
  banner_url?: string;
  quadras_ids: string[];
  start_time: string;
  end_time: string;
  created_at: string;
  categories: string[];
  max_participants: number;
  registration_fee: number;
  participants: Participant[];
  matches: Match[];
}

export type EventoStatus = 'orcamento' | 'pendente' | 'confirmado' | 'realizado' | 'concluido' | 'cancelado';
export type EventoTipoPrivado = 'festa' | 'corporativo' | 'aniversario' | 'show' | 'outro';

export interface Evento {
  id: string;
  arena_id: string;
  name: string;
  type: EventoTipoPrivado;
  status: EventoStatus;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  expectedGuests: number;
  quadras_ids: string[];
  additionalSpaces: string[];
  services: { name: string; price: number; included: boolean }[];
  totalValue: number;
  depositValue: number;
  paymentConditions: string;
  payments: { id: string; date: string; amount: number; method: string }[];
  notes: string;
  created_at: string;
  checklist: { id: string; text: string; completed: boolean }[];
}
