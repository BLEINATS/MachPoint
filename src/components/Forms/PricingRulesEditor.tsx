import React, { useState } from 'react';
import { PricingRule } from '../../types';
import { DollarSign, Edit, Trash2, Plus, Calendar, Clock, Dribbble, Check, X } from 'lucide-react';
import Button from './Button';
import Input from './Input';

interface PricingRulesEditorProps {
  rules: PricingRule[];
  setRules: React.Dispatch<React.SetStateAction<PricingRule[]>>;
}

const weekDaysOptions = [
  { id: 1, label: 'Seg' }, { id: 2, label: 'Ter' }, { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' }, { id: 5, label: 'Sex' }, { id: 6, label: 'Sáb' }, { id: 0, label: 'Dom' }
];

const sportTypes = [
  'Qualquer Esporte', 'Beach Tennis', 'Futevôlei', 'Futebol Society', 'Vôlei', 'Tênis', 'Padel', 'Basquete', 'Futsal', 'Outro'
];

const PricingRulesEditor: React.FC<PricingRulesEditorProps> = ({ rules, setRules }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const handleSaveRule = (rule: Omit<PricingRule, 'created_at' | 'arena_id' | 'quadra_id'>) => {
    if (editingRule) {
      setRules(rules.map(r => r.id === rule.id ? { ...r, ...rule } : r));
    } else {
      const newRule: PricingRule = {
        ...rule,
        id: `new_${Date.now()}`,
        created_at: new Date().toISOString(),
        arena_id: '', // será preenchido no backend
        quadra_id: '', // será preenchido no backend
      };
      setRules([...rules, newRule]);
    }
    setIsAdding(false);
    setEditingRule(null);
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta regra de preço?')) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const renderDayLabels = (days: number[]) => {
    if (days.length === 7) return 'Todos os dias';
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Dias de semana';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Fins de semana';
    return days.map(d => weekDaysOptions.find(opt => opt.id === d)?.label).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium text-brand-gray-900 dark:text-white">Regras de Preço</h4>
        {!isAdding && (
          <Button size="sm" onClick={() => { setEditingRule(null); setIsAdding(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Regra
          </Button>
        )}
      </div>

      {isAdding && (
        <RuleForm
          onSave={handleSaveRule}
          onCancel={() => { setIsAdding(false); setEditingRule(null); }}
          initialData={editingRule}
        />
      )}

      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule.id} className={`p-4 rounded-lg flex items-center justify-between transition-colors ${rule.is_active ? 'bg-brand-gray-50 dark:bg-brand-gray-700/50' : 'bg-red-50 dark:bg-red-900/20 opacity-70'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 flex-1">
              <InfoItem icon={Dribbble} label="Esporte" value={rule.sport_type} />
              <InfoItem icon={Calendar} label="Dias" value={renderDayLabels(rule.days_of_week)} />
              <InfoItem icon={Clock} label="Horário" value={`${rule.start_time} - ${rule.end_time}`} />
              <InfoItem icon={DollarSign} label="Avulso" value={rule.price_single.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              <InfoItem icon={DollarSign} label="Mensal" value={rule.price_monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            </div>
            <div className="flex items-center ml-4">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {rules.length === 0 && !isAdding && (
            <div className="text-center py-8 text-brand-gray-500">
                <p>Nenhuma regra de preço definida. Clique em "Nova Regra" para começar.</p>
            </div>
        )}
      </div>
    </div>
  );
};

const RuleForm: React.FC<{ onSave: (rule: any) => void, onCancel: () => void, initialData: PricingRule | null }> = ({ onSave, onCancel, initialData }) => {
  const [ruleData, setRuleData] = useState({
    id: initialData?.id || `new_${Date.now()}`,
    sport_type: initialData?.sport_type || 'Qualquer Esporte',
    start_time: initialData?.start_time || '00:00',
    end_time: initialData?.end_time || '23:59',
    days_of_week: initialData?.days_of_week || [0, 1, 2, 3, 4, 5, 6],
    price_single: initialData?.price_single || 0,
    price_monthly: initialData?.price_monthly || 0,
    is_active: initialData?.is_active ?? true,
  });

  const handleDayToggle = (dayId: number) => {
    setRuleData(prev => {
      const days = prev.days_of_week.includes(dayId)
        ? prev.days_of_week.filter(d => d !== dayId)
        : [...prev.days_of_week, dayId];
      return { ...prev, days_of_week: days.sort((a, b) => a - b) };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(ruleData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg space-y-4 bg-white dark:bg-brand-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Esporte</label>
          <select value={ruleData.sport_type} onChange={e => setRuleData(p => ({ ...p, sport_type: e.target.value }))} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
            {sportTypes.map(sport => <option key={sport} value={sport}>{sport}</option>)}
          </select>
        </div>
        <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
                <div className="relative">
                    <input type="checkbox" className="sr-only" checked={ruleData.is_active} onChange={e => setRuleData(p => ({ ...p, is_active: e.target.checked }))} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${ruleData.is_active ? 'bg-green-500' : 'bg-brand-gray-300 dark:bg-brand-gray-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${ruleData.is_active ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">
                    {ruleData.is_active ? 'Regra Ativa' : 'Regra Inativa'}
                </div>
            </label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Preço Avulso (R$)" type="number" step="0.01" value={ruleData.price_single} onChange={e => setRuleData(p => ({ ...p, price_single: parseFloat(e.target.value) || 0 }))} required />
        <Input label="Preço Mensal (R$)" type="number" step="0.01" value={ruleData.price_monthly} onChange={e => setRuleData(p => ({ ...p, price_monthly: parseFloat(e.target.value) || 0 }))} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Horário de Início" type="time" value={ruleData.start_time} onChange={e => setRuleData(p => ({ ...p, start_time: e.target.value }))} />
        <Input label="Horário de Fim" type="time" value={ruleData.end_time} onChange={e => setRuleData(p => ({ ...p, end_time: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Dias da Semana</label>
        <div className="flex flex-wrap gap-2">
          {weekDaysOptions.map(day => (
            <button type="button" key={day.id} onClick={() => handleDayToggle(day.id)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${ruleData.days_of_week.includes(day.id) ? 'bg-brand-blue-600 text-white border-brand-blue-600' : 'bg-white dark:bg-brand-gray-700 border-brand-gray-300 dark:border-brand-gray-600 hover:bg-brand-gray-100'}`}>
              {day.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar Regra</Button>
      </div>
    </form>
  );
};

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: string | number }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center">
      <Icon className="h-4 w-4 text-brand-gray-500 mr-2 flex-shrink-0" />
      <div>
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{label}</p>
        <p className="font-semibold text-sm text-brand-gray-800 dark:text-brand-gray-200 truncate">{value}</p>
      </div>
    </div>
);

export default PricingRulesEditor;
