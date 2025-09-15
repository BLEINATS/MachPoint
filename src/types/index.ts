export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Arena {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  city?: string;
  state?: string;
  main_image?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  arena_id?: string; // Opcional, usado principalmente para admin_arena
  role: 'admin_arena' | 'cliente';
  // Campos específicos do cliente
  name?: string;
  avatar_url?: string;
  birth_date?: string; // 'yyyy-MM-dd'
  gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informado';
  clientType?: 'cliente' | 'aluno' | 'professor';
  created_at: string;
}

// NOVO: Tabela de associação entre clientes e arenas
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

export type ReservationType = 'normal' | 'aula' | 'evento' | 'bloqueio';
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

export interface ArenaSettings {
  // Identidade
  logoUrl: string;
  arenaName: string;
  arenaSlug: string;
  // Perfil
  cnpjCpf: string;
  responsibleName: string;
  contactPhone: string;
  publicEmail: string;
  // Endereço
  cep: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  googleMapsLink: string;
  // Operação
  cancellationPolicy: string;
  termsOfUse: string;
}
