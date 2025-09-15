import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Settings, Clock, Camera, Users, Droplets, Car, Coffee, Wifi, Wind, Volume2, Eye, Utensils, Upload, X, Shield, Zap, Info, CheckCircle, ArrowRight, ArrowLeft, Star
} from 'lucide-react';
import Input from './Input';
import Button from './Button';
import { Quadra, QuadraComodidades, QuadraHorarios } from '../../types';

interface QuadraFormTabsProps {
  onSubmit: (quadra: Omit<Quadra, 'id' | 'arena_id' | 'created_at'> | Quadra) => void;
  onCancel: () => void;
  initialData?: Quadra | null;
}

type TabType = 'basico' | 'detalhes' | 'horarios' | 'fotos';

const getInitialFormData = (initialData?: Quadra | null) => {
  if (initialData) {
    return {
      ...initialData,
      price_per_hour: initialData.price_per_hour.toString(),
    };
  }
  return {
    name: '', sport_type: '', status: 'ativa' as 'ativa' | 'inativa' | 'manutencao', capacity: 4, price_per_hour: '', location: '',
    description: '', floor_type: '', is_covered: false, has_lighting: false,
    comodidades: { vestiario: false, chuveiro: false, estacionamento: false, lanchonete: false, wifi: false, arCondicionado: false, somAmbiente: false, arquibancada: false, churrasqueira: false } as QuadraComodidades,
    rules: '',
    horarios: { diasFuncionamento: { seg: true, ter: true, qua: true, qui: true, sex: true, sab: true, dom: true }, horarioSemana: '08:00-22:00', horarioFimSemana: '08:00-22:00' } as QuadraHorarios,
    booking_interval_minutes: 60,
    photos: [] as string[],
  };
};

const QuadraFormTabs: React.FC<QuadraFormTabsProps> = ({ onSubmit, onCancel, initialData }) => {
  const [activeTab, setActiveTab] = useState<TabType>('basico');
  const [completedTabs, setCompletedTabs] = useState<TabType[]>([]);
  const [formData, setFormData] = useState(getInitialFormData(initialData));

  const isEditing = !!initialData;

  useEffect(() => {
    setFormData(getInitialFormData(initialData));
    if (isEditing) {
      setCompletedTabs(['basico', 'detalhes', 'horarios', 'fotos']);
    }
  }, [initialData, isEditing]);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'basico', label: 'Básico', icon: FileText },
    { id: 'detalhes', label: 'Detalhes', icon: Settings },
    { id: 'horarios', label: 'Horários', icon: Clock },
    { id: 'fotos', label: 'Fotos', icon: Camera },
  ];

  const handleNext = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (!completedTabs.includes(activeTab)) {
      setCompletedTabs([...completedTabs, activeTab]);
    }
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  const handleSubmit = () => {
    const finalData = {
      ...formData,
      price_per_hour: parseFloat(formData.price_per_hour) || 0,
      capacity: Number(formData.capacity) || 0,
      booking_interval_minutes: Number(formData.booking_interval_minutes) || 60,
    };
    onSubmit(finalData);
  };

  const handleComodidadeChange = (key: keyof QuadraComodidades) => setFormData(p => ({ ...p, comodidades: { ...p.comodidades, [key]: !p.comodidades[key] } }));
  const handleDiaChange = (dia: keyof QuadraHorarios['diasFuncionamento']) => setFormData(p => ({ ...p, horarios: { ...p.horarios, diasFuncionamento: { ...p.horarios.diasFuncionamento, [dia]: !p.horarios.diasFuncionamento[dia] } } }));
  const handlePhotoUpload = () => setFormData(p => ({ ...p, photos: [...p.photos, `https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/400x300/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=Quadra+${p.photos.length + 1}`] }));
  const removePhoto = (index: number) => setFormData(p => ({ ...p, photos: p.photos.filter((_, i) => i !== index) }));

  const setMainPhoto = (index: number) => {
    setFormData(p => {
      const newPhotos = [...p.photos];
      const mainPhoto = newPhotos.splice(index, 1)[0];
      newPhotos.unshift(mainPhoto);
      return { ...p, photos: newPhotos };
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'basico': return <BasicoTab formData={formData} setFormData={setFormData} />;
      case 'detalhes': return <DetalhesTab formData={formData} setFormData={setFormData} handleComodidadeChange={handleComodidadeChange} />;
      case 'horarios': return <HorariosTab formData={formData} setFormData={setFormData} handleDiaChange={handleDiaChange} />;
      case 'fotos': return <FotosTab formData={formData} handlePhotoUpload={handlePhotoUpload} removePhoto={removePhoto} setMainPhoto={setMainPhoto} />;
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[70vh]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-brand-gray-50 dark:bg-brand-gray-800 p-6 border-b md:border-b-0 md:border-r border-brand-gray-200 dark:border-brand-gray-700">
        <h3 className="text-lg font-bold text-brand-gray-900 dark:text-white mb-6">{isEditing ? 'Editar Quadra' : 'Nova Quadra'}</h3>
        <nav className="space-y-2">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const isCompleted = completedTabs.includes(tab.id);
            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`w-full flex items-center text-left p-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-blue-100 dark:bg-brand-gray-700 text-brand-blue-700 dark:text-white' 
                    : 'text-brand-gray-600 dark:text-brand-gray-300 hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700'
                }`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full mr-3 text-sm transition-colors ${isActive ? 'bg-brand-blue-500 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-brand-gray-300 dark:bg-brand-gray-600 text-brand-gray-700 dark:text-brand-gray-300'}`}>
                  {isCompleted && !isActive ? <CheckCircle className="w-4 h-4" /> : <tab.icon className="w-4 h-4" />}
                </div>
                <span className={isActive ? 'font-semibold' : 'font-medium'}>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 flex flex-col">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <div className="flex space-x-3">
            {activeTab !== 'basico' && <Button variant="outline" onClick={handleBack}><ArrowLeft className="h-4 w-4 mr-2" />Anterior</Button>}
            {activeTab !== 'fotos' ? <Button onClick={handleNext}>Próximo<ArrowRight className="h-4 w-4 ml-2" /></Button> : <Button onClick={handleSubmit}><CheckCircle className="h-4 w-4 mr-2" />{isEditing ? 'Salvar Alterações' : 'Criar Quadra'}</Button>}
          </div>
        </div>
      </main>
    </div>
  );
};

// Sub-components for each tab
const BasicoTab = ({ formData, setFormData }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Input label="Nome da Quadra" value={formData.name} onChange={(e: any) => setFormData((p: any) => ({ ...p, name: e.target.value }))} placeholder="Ex: Quadra Beach Tennis 1" required />
      <FormSelect label="Tipo de Esporte" value={formData.sport_type} onChange={(e: any) => setFormData((p: any) => ({ ...p, sport_type: e.target.value }))} options={['Beach Tennis', 'Futevôlei', 'Futebol Society', 'Vôlei', 'Tênis', 'Padel', 'Basquete', 'Futsal', 'Outro']} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <FormSelect label="Status" value={formData.status} onChange={(e: any) => setFormData((p: any) => ({ ...p, status: e.target.value }))} options={[{value: 'ativa', label: 'Ativa'}, {value: 'inativa', label: 'Inativa'}, {value: 'manutencao', label: 'Manutenção'}]} />
      <Input label="Capacidade" type="number" value={formData.capacity.toString()} onChange={(e: any) => setFormData((p: any) => ({ ...p, capacity: e.target.value }))} placeholder="4" min="1" />
      <Input label="Preço por Hora (R$)" type="number" step="0.01" value={formData.price_per_hour} onChange={(e: any) => setFormData((p: any) => ({ ...p, price_per_hour: e.target.value }))} placeholder="80.00" required />
    </div>
    <Input label="Localização" value={formData.location} onChange={(e: any) => setFormData((p: any) => ({ ...p, location: e.target.value }))} placeholder="Ex: Setor A, Quadra 1" />
  </div>
);

const DetalhesTab = ({ formData, setFormData, handleComodidadeChange }: any) => (
  <div className="space-y-8">
    <FormTextArea label="Descrição" value={formData.description} onChange={(e: any) => setFormData((p: any) => ({ ...p, description: e.target.value }))} placeholder="Descreva as características da quadra..." />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <FormSelect label="Tipo de Piso" value={formData.floor_type} onChange={(e: any) => setFormData((p: any) => ({ ...p, floor_type: e.target.value }))} options={['Areia', 'Grama Sintética', 'Concreto', 'Madeira', 'Borracha', 'Cerâmica', 'Saibro', 'Outro']} />
      <FormCheckbox label="Quadra Coberta" icon={Shield} checked={formData.is_covered} onChange={(e: any) => setFormData((p: any) => ({ ...p, is_covered: e.target.checked }))} />
      <FormCheckbox label="Iluminação" icon={Zap} checked={formData.has_lighting} onChange={(e: any) => setFormData((p: any) => ({ ...p, has_lighting: e.target.checked }))} />
    </div>
    <div>
      <h4 className="text-lg font-medium text-brand-gray-900 dark:text-white mb-4">Comodidades</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { key: 'vestiario', label: 'Vestiário', icon: Users }, { key: 'chuveiro', label: 'Chuveiro', icon: Droplets }, { key: 'estacionamento', label: 'Estacionamento', icon: Car },
          { key: 'lanchonete', label: 'Lanchonete', icon: Coffee }, { key: 'wifi', label: 'Wi-Fi', icon: Wifi }, { key: 'arCondicionado', label: 'Ar Condicionado', icon: Wind },
          { key: 'somAmbiente', label: 'Som Ambiente', icon: Volume2 }, { key: 'arquibancada', label: 'Arquibancada', icon: Eye }, { key: 'churrasqueira', label: 'Churrasqueira', icon: Utensils },
        ].map(({ key, label, icon: Icon }) => <FormCheckbox key={key} label={label} icon={Icon} checked={formData.comodidades[key as keyof QuadraComodidades]} onChange={() => handleComodidadeChange(key)} />)}
      </div>
    </div>
    <FormTextArea label="Regras da Quadra" value={formData.rules} onChange={(e: any) => setFormData((p: any) => ({ ...p, rules: e.target.value }))} placeholder="Ex: Proibido fumar, usar tênis adequado..." />
  </div>
);

const HorariosTab = ({ formData, setFormData, handleDiaChange }: any) => (
  <div className="space-y-8">
    <div>
      <h4 className="text-lg font-medium text-brand-gray-900 dark:text-white mb-2">Dias de Funcionamento</h4>
      <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400 mb-4">Selecione os dias em que a quadra estará disponível.</p>
      <div className="flex flex-wrap gap-3">
        {Object.keys(formData.horarios.diasFuncionamento).map(dia => <DayButton key={dia} label={dia.charAt(0).toUpperCase() + dia.slice(1, 3)} active={formData.horarios.diasFuncionamento[dia as keyof QuadraHorarios['diasFuncionamento']]} onClick={() => handleDiaChange(dia)} />)}
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Input label="Horários Segunda a Sexta" value={formData.horarios.horarioSemana} onChange={(e: any) => setFormData((p: any) => ({ ...p, horarios: { ...p.horarios, horarioSemana: e.target.value } }))} placeholder="08:00-22:00" />
      <Input label="Horários Fins de Semana" value={formData.horarios.horarioFimSemana} onChange={(e: any) => setFormData((p: any) => ({ ...p, horarios: { ...p.horarios, horarioFimSemana: e.target.value } }))} placeholder="08:00-22:00" />
      <FormSelect label="Duração da Reserva (min)" value={formData.booking_interval_minutes.toString()} onChange={(e: any) => setFormData((p: any) => ({...p, booking_interval_minutes: e.target.value}))} options={['30', '60', '90', '120']} />
    </div>
    <InfoBox title="Dicas de Configuração" items={['Horário simples: 08:00-22:00', 'Múltiplos turnos: 08:00-12:00,14:00-22:00', '24 horas: 00:00-23:59', 'Fechado: Deixe o campo vazio']} />
  </div>
);

const FotosTab = ({ formData, handlePhotoUpload, removePhoto, setMainPhoto }: any) => (
  <div className="space-y-8">
    <div>
      <h4 className="text-lg font-medium text-brand-gray-900 dark:text-white mb-2">Galeria de Fotos</h4>
      <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400 mb-4">Adicione fotos da quadra para atrair mais clientes.</p>
      <div className="border-2 border-dashed border-brand-gray-300 dark:border-brand-gray-600 rounded-lg p-8 text-center hover:border-brand-blue-400 dark:hover:border-brand-blue-500 transition-colors cursor-pointer" onClick={handlePhotoUpload}>
        <Upload className="h-12 w-12 text-brand-gray-400 dark:text-brand-gray-500 mx-auto mb-4" />
        <p className="text-brand-blue-600 dark:text-brand-blue-400 font-medium">Clique para adicionar fotos</p>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1">ou arraste e solte as imagens aqui</p>
        <p className="text-xs text-brand-gray-400 dark:text-brand-gray-500 mt-2">Suporta JPG, PNG, WebP até 5MB cada</p>
      </div>
    </div>
    {formData.photos.length > 0 && (
      <div>
        <h5 className="text-md font-medium text-brand-gray-900 dark:text-white mb-3">Fotos Adicionadas</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {formData.photos.map((photo: string, index: number) => (
            <div key={index} className="relative group aspect-w-1 aspect-h-1">
              <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                <button type="button" onClick={() => setMainPhoto(index)} className="text-white p-1.5 rounded-full hover:bg-white/20 transition-colors" title="Definir como principal">
                  <Star className={`h-5 w-5 ${index === 0 ? 'text-yellow-400 fill-current' : ''}`} />
                </button>
                <button type="button" onClick={() => removePhoto(index)} className="text-white p-1.5 rounded-full hover:bg-white/20 transition-colors" title="Remover foto">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {index === 0 && (
                <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded">
                  CAPA
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
    <InfoBox title="Dicas para Fotos Atrativas" items={['A foto com a estrela amarela será a capa.', 'Use boa iluminação natural', 'Mostre a quadra completa e detalhes', 'Inclua comodidades e vestiários']} color="green" />
  </div>
);

// Helper components for the form
const FormSelect = ({ label, value, onChange, options, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">{label}</label>
    <select value={value} onChange={onChange} className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500" {...props}>
      <option value="">Selecione...</option>
      {options.map((opt: any) => <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>{typeof opt === 'string' ? opt : opt.label || opt}</option>)}
    </select>
  </div>
);

const FormTextArea = ({ label, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">{label}</label>
    <textarea rows={3} className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500" {...props} />
  </div>
);

const FormCheckbox = ({ label, icon: Icon, ...props }: any) => (
  <div className="flex items-center">
    <input type="checkbox" className="h-4 w-4 form-checkbox rounded text-brand-blue-600 border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 focus:ring-brand-blue-500" {...props} />
    <label className="ml-2 text-sm text-brand-gray-700 dark:text-brand-gray-300 flex items-center">
      {Icon && <Icon className="h-4 w-4 mr-1.5 text-brand-gray-500 dark:text-brand-gray-400" />}
      {label}
    </label>
  </div>
);

const DayButton = ({ label, active, onClick }: any) => (
  <button 
    type="button" 
    onClick={onClick} 
    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
      active 
        ? 'bg-brand-blue-600 text-white shadow-md border-brand-blue-600' 
        : 'bg-white text-brand-gray-700 border-brand-gray-300 hover:bg-brand-gray-100 dark:bg-brand-gray-700 dark:text-brand-gray-300 dark:border-brand-gray-600 dark:hover:bg-brand-gray-600'
    }`}
  >
    {label}
  </button>
);

const InfoBox = ({ title, items, color = 'blue' }: any) => (
  <div className={`rounded-lg p-4 border ${color === 'blue' ? 'bg-blue-50 dark:bg-brand-blue-500/10 border-blue-200 dark:border-brand-blue-500/20' : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'}`}>
    <h5 className={`font-medium mb-2 flex items-center ${color === 'blue' ? 'text-blue-900 dark:text-blue-200' : 'text-green-900 dark:text-green-200'}`}><Info className="h-4 w-4 mr-2" />{title}</h5>
    <ul className={`text-sm space-y-1 ${color === 'blue' ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'}`}>
      {items.map((item: string, i: number) => <li key={i}>• {item}</li>)}
    </ul>
  </div>
);

export default QuadraFormTabs;
