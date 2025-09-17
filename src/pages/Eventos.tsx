import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, PartyPopper } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import { Evento, Quadra, Reserva } from '../types';
import EventoModal from '../components/Eventos/EventoModal';
import KanbanBoard from '../components/Eventos/KanbanBoard';
import { eachDayOfInterval, format } from 'date-fns';
import { parseDateStringAsLocal } from '../utils/dateUtils';

const Eventos: React.FC = () => {
  const { arena } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);

  const loadData = useCallback(() => {
    if (arena) {
      const savedEventos = localStorage.getItem(`eventos_${arena.id}`);
      setEventos(savedEventos ? JSON.parse(savedEventos) : []);
      const savedQuadras = localStorage.getItem(`quadras_${arena.id}`);
      setQuadras(savedQuadras ? JSON.parse(savedQuadras) : []);
      const savedReservas = localStorage.getItem(`reservas_${arena.id}`);
      setReservas(savedReservas ? JSON.parse(savedReservas) : []);
    }
  }, [arena]);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [loadData]);

  const handleSaveEvento = (eventoData: Omit<Evento, 'id' | 'arena_id' | 'created_at'> | Evento) => {
    if (!arena) return;

    const isEditing = 'id' in eventoData;
    const eventoId = isEditing ? eventoData.id : `evento_privado_${Date.now()}`;
    
    const newEvento: Evento = isEditing 
      ? eventoData as Evento
      : { 
          ...eventoData, 
          id: eventoId, 
          arena_id: arena.id, 
          created_at: new Date().toISOString(),
          checklist: [
            { id: `task_${eventoId}_1`, text: 'Confirmar pagamento do sinal', completed: false },
            { id: `task_${eventoId}_2`, text: 'Enviar contrato para o cliente', completed: false },
            { id: `task_${eventoId}_3`, text: 'Reservar equipe (segurança, limpeza)', completed: false },
            { id: `task_${eventoId}_4`, text: 'Verificar limpeza pré-evento', completed: false },
          ],
          payments: [],
        } as Evento;

    const updatedEventos = isEditing
      ? eventos.map(e => e.id === newEvento.id ? newEvento : e)
      : [...eventos, newEvento];
    
    setEventos(updatedEventos);
    localStorage.setItem(`eventos_${arena.id}`, JSON.stringify(updatedEventos));

    // --- Lógica de criação/atualização de reserva ---
    const currentReservas: Reserva[] = reservas;
    
    const otherReservas = currentReservas.filter(r => r.evento_id !== eventoId);
    let finalReservas = [...otherReservas];

    if (newEvento.status === 'confirmado' || newEvento.status === 'realizado') {
      const eventBlockReservations: Reserva[] = [];
      const eventDays = eachDayOfInterval({
        start: parseDateStringAsLocal(newEvento.startDate),
        end: parseDateStringAsLocal(newEvento.endDate),
      });

      for (const day of eventDays) {
        for (const quadraId of newEvento.quadras_ids) {
          const newBlockReserva: Reserva = {
            id: `reserva_evento_${eventoId}_${quadraId}_${format(day, 'yyyy-MM-dd')}`,
            arena_id: arena.id,
            quadra_id: quadraId,
            evento_id: eventoId,
            date: format(day, 'yyyy-MM-dd'),
            start_time: newEvento.startTime,
            end_time: newEvento.endTime,
            type: 'evento',
            status: 'confirmada',
            clientName: `Evento: ${newEvento.name}`,
            isRecurring: false,
            profile_id: '',
            created_at: new Date().toISOString(),
          };
          eventBlockReservations.push(newBlockReserva);
        }
      }
      finalReservas = [...otherReservas, ...eventBlockReservations];
    }
    
    setReservas(finalReservas);
    localStorage.setItem(`reservas_${arena.id}`, JSON.stringify(finalReservas));

    setIsModalOpen(false);
    setEditingEvento(null);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvento(null);
  }

  return (
    <Layout>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                  <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Gestão de Eventos Privados</h1>
                  <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Gerencie orçamentos e locações de espaço para festas, aniversários e mais.</p>
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Orçamento
              </Button>
          </div>
        </motion.div>

        {eventos.length > 0 ? (
            <KanbanBoard eventos={eventos} setEventos={setEventos} />
        ) : (
            <div className="text-center py-16">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto">
                <div className="flex justify-center items-center w-16 h-16 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-full mx-auto mb-6">
                <PartyPopper className="h-8 w-8 text-brand-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-brand-gray-900 dark:text-white mb-2">Nenhum evento encontrado</h3>
                <p className="text-brand-gray-600 dark:text-brand-gray-400">Clique em 'Novo Orçamento' para criar sua primeira proposta de evento.</p>
            </motion.div>
            </div>
        )}
      </div>

      <EventoModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveEvento} 
        initialData={editingEvento}
        quadras={quadras}
        reservas={reservas}
      />
    </Layout>
  );
};

export default Eventos;
