import { PostgrestError } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  arena: Arena | null;
  memberships: ArenaMembership[];
  selectedArenaContext: Arena | null;
  isLoading: boolean;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: 'cliente' | 'admin_arena';
  clientType?: 'cliente' | 'aluno' | 'mensalista';
  birth_date?: string;
  gender?: 'masculino' | 'feminino' | 'outro' | 'nao_informado';
  created_at: string;
}

export interface Arena {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  main_image?: string;
  cnpj_cpf?: string;
  responsible_name?: string;
  contact_phone?: string;
  public_email?: string;
  cep?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city: string;
  state: string;
  google_maps_link?: string;
  cancellation_policy?: string;
  terms_of_use?: string;
  created_at: string;
}

export interface ArenaMembership {
  profile_id: string;
  arena_id: string;
}

export interface Quadra {
  id: string;
  arena_id: string;
  name: string;
  court_type: string;
  sports: string[];
  status: 'ativa' | 'inativa' | 'manutencao';
  description: string;
  rules?: string;
  amenities: string[];
  horarios: {
    weekday: { start: string; end: string };
    saturday: { start: string; end: string };
    sunday: { start: string; end: string };
  };
  booking_duration_minutes: number;
  capacity?: number;
  photos: string[];
  cover_photo: string | null;
  created_at: string;
  pricing_rules: PricingRule[];
}

export interface PricingRule {
  id?: string;
  client_id?: string;
  quadra_id: string;
  arena_id: string;
  sport_type: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  price_single: number;
  price_monthly: number;
  is_active: boolean;
  is_default: boolean;
}

export interface DurationDiscount {
  id: string;
  arena_id: string;
  duration_hours: number;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
}

export interface Aluno {
  id: string;
  arena_id: string;
  profile_id?: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'ativo' | 'inativo' | 'experimental';
  sport: string | null;
  plan_name: string;
  monthly_fee: number | null;
  join_date: string;
  created_at: string;
  avatar_url?: string;
  credit_balance?: number;
}

export interface Professor {
  id: string;
  arena_id: string;
  name: string;
  email: string;
  phone: string | null;
  specialties: string[];
  created_at: string;
  avatar_url?: string;
}

export interface Turma {
  id: string;
  arena_id: string;
  name: string;
  sport: string;
  professor_id: string;
  quadra_id: string;
  daysOfWeek: number[];
  start_time: string;
  end_time: string;
  start_date: string;
  end_date?: string | null;
  capacity: number;
  student_ids: string[];
  created_at: string;
}

export type ReservationType = 'avulsa' | 'aula' | 'torneio' | 'evento' | 'bloqueio';

export interface Reservation {
  id: string;
  arena_id: string;
  quadra_id: string;
  profile_id?: string | null;
  turma_id?: string | null;
  torneio_id?: string | null;
  evento_id?: string | null;
  clientName: string;
  clientPhone?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'confirmada' | 'pendente' | 'cancelada';
  type: ReservationType;
  total_price?: number;
  credit_used?: number;
  payment_status?: 'pago' | 'pendente' | 'parcialmente_pago';
  sport_type?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly';
  recurringEndDate?: string | null;
  masterId?: string;
  created_at: string;
  updated_at?: string;
  rented_items?: {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
  }[] | null;
}

export interface CreditTransaction {
  id?: string;
  aluno_id: string;
  arena_id: string;
  amount: number;
  type: 'cancellation_credit' | 'manual_adjustment' | 'reservation_payment' | 'goodwill_credit';
  description?: string;
  related_reservation_id?: string;
  created_by?: string;
  created_at?: string;
}

export interface RentalItem {
  id: string;
  arena_id: string;
  name: string;
  price: number;
  stock: number;
  created_at: string;
}

export type TorneioTipo = 'torneio' | 'campeonato' | 'clinica' | 'evento_especial';
export type TorneioStatus = 'planejado' | 'inscricoes_abertas' | 'em_andamento' | 'concluido' | 'cancelado';

export interface Torneio {
  id: string;
  arena_id: string;
  name: string;
  type: TorneioTipo;
  status: TorneioStatus;
  start_date: string;
  end_date: string;
  description: string;
  quadras_ids: string[];
  start_time: string;
  end_time: string;
  categories: string[];
  max_participants: number;
  registration_fee: number;
  participants: Participant[];
  matches: Match[];
  created_at: string;
}

export type EventoTipoPrivado = 'festa' | 'corporativo' | 'aniversario' | 'show' | 'outro';
export type EventoStatus = 'orcamento' | 'pendente' | 'confirmado' | 'realizado' | 'concluido' | 'cancelado';

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
  notes: string;
  checklist: { id: string; text: string; completed: boolean }[];
  payments: { id: string; date: string; amount: number; method: string }[];
  created_at: string;
}

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

export type SupabaseData<T> = {
  data: T[] | null;
  error: PostgrestError | null;
};

export type SupabaseSingleData<T> = {
  data: T | null;
  error: PostgrestError | null;
};
