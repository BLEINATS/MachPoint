import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Mail, Phone, Calendar, Award, Dribbble, DollarSign, Trash2 } from 'lucide-react';
import { Aluno } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { format } from 'date-fns';
import { maskPhone } from '../../utils/masks';
import CreatableSelect from '../Forms/CreatableSelect';
import { useToast } from '../../context/ToastContext';

interface AlunoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (aluno: Omit<Aluno, 'id' | 'arena_id' | 'created_at'> | Aluno) => void;
  onDelete: (id: string) => void;
  initialData: Aluno | null;
  availableSports: string[];
  availablePlans: string[];
  modalType: 'Cliente' | 'Aluno';
  allAlunos: Aluno[];
}

const DEFAULT_SPORTS = ['Beach Tennis', 'Futevôlei', 'Futebol Society', 'Vôlei', 'Tênis', 'Padel', 'Funcional'];
const DEFAULT_PLANS = ['Aula Avulsa', 'Pacote 10 Aulas', 'Plano Mensal - 1x/semana', 'Plano Mensal - 2x/semana', 'Plano Mensal - 3x/semana', 'Plano Mensal - 4x/semana'];

const AlunoModal: React.FC<AlunoModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData, availableSports, availablePlans, modalType, allAlunos }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'ativo' as Aluno['status'],
    sport: '',
    plan_name: '',
    monthly_fee: '',
    join_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const { addToast } = useToast();

  const isEditing = !!initialData;

  const allSports = useMemo(() => {
    return [...new Set([...DEFAULT_SPORTS, ...availableSports])];
  }, [availableSports]);

  const allPlans = useMemo(() => {
    return [...new Set([...DEFAULT_PLANS, ...availablePlans])];
  }, [availablePlans]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email || '',
        phone: initialData.phone || '',
        status: initialData.status,
        sport: initialData.sport || '',
        plan_name: initialData.plan_name,
        monthly_fee: initialData.monthly_fee?.toString().replace('.', ',') || '',
        join_date: initialData.join_date,
      });
    } else {
      setFormData({
        name: '', email: '', phone: '', status: 'ativo', sport: '', plan_name: '', monthly_fee: '',
        join_date: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    const unmaskedPhone = formData.phone.replace(/\D/g, '');

    if (unmaskedPhone) {
      const isDuplicate = allAlunos.some(aluno => {
        if (isEditing && initialData && aluno.id === initialData.id) {
          return false;
        }
        return aluno.phone?.replace(/\D/g, '') === unmaskedPhone;
      });

      if (isDuplicate) {
        addToast({ message: 'Este telefone já está em uso por outro cliente.', type: 'error' });
        return;
      }
    }

    const dataToSave = {
      ...formData,
      monthly_fee: parseFloat(formData.monthly_fee.replace(',', '.')) || 0,
    };

    if (isEditing && initialData) {
      onSave({ ...initialData, ...dataToSave });
    } else {
      onSave(dataToSave);
    }
  };
  
  const handleDelete = () => {
    if (initialData) {
      onDelete(initialData.id);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'phone') {
      finalValue = maskPhone(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const modalTitle = isEditing ? `Editar ${modalType}` : `Adicionar Novo ${modalType}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">
                {modalTitle}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <Input label="Nome Completo" name="name" value={formData.name} onChange={handleChange} icon={<User className="h-4 w-4 text-brand-gray-400"/>} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="E-mail" name="email" type="email" value={formData.email || ''} onChange={handleChange} icon={<Mail className="h-4 w-4 text-brand-gray-400"/>} />
                <Input label="Telefone" name="phone" value={formData.phone} onChange={handleChange} icon={<Phone className="h-4 w-4 text-brand-gray-400"/>} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="experimental">Experimental</option>
                  </select>
                </div>
                <Input label="Data de Início" name="join_date" type="date" value={formData.join_date} onChange={handleChange} icon={<Calendar className="h-4 w-4 text-brand-gray-400"/>} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <CreatableSelect
                  label="Esporte"
                  options={allSports}
                  value={formData.sport}
                  onChange={(value) => setFormData(p => ({ ...p, sport: value }))}
                  placeholder="Selecione ou crie"
                  icon={<Dribbble className="h-4 w-4 text-brand-gray-400" />}
                />
                <CreatableSelect
                  label="Plano Contratado"
                  options={allPlans}
                  value={formData.plan_name}
                  onChange={(value) => setFormData(p => ({ ...p, plan_name: value }))}
                  placeholder="Selecione ou crie"
                  icon={<Award className="h-4 w-4 text-brand-gray-400" />}
                />
              </div>
              <Input
                label="Valor da Mensalidade (R$)"
                name="monthly_fee"
                type="text"
                inputMode="decimal"
                value={formData.monthly_fee}
                onChange={handleChange}
                icon={<DollarSign className="h-4 w-4 text-brand-gray-400" />}
                placeholder="Ex: 99,90"
              />
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
              <div>
                {isEditing && (
                  <Button variant="outline" onClick={handleDelete} className="text-red-500 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2"/> {isEditing ? 'Salvar Alterações' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AlunoModal;
