import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building, FileText, BarChart2, CheckCircle, Save, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { ArenaSettings, Arena } from '../types';
import Button from '../components/Forms/Button';
import ProfileTab from '../components/Settings/ProfileTab';
import OperationTab from '../components/Settings/OperationTab';
import PlanTab from '../components/Settings/PlanTab';

type TabType = 'profile' | 'operation' | 'plan';

const getInitialFormData = (initialData?: ArenaSettings | null, arena?: Arena | null): ArenaSettings => {
  return {
    logoUrl: initialData?.logoUrl || '',
    arenaName: initialData?.arenaName || arena?.name || '',
    arenaSlug: initialData?.arenaSlug || arena?.slug || '',
    cnpjCpf: initialData?.cnpjCpf || '',
    responsibleName: initialData?.responsibleName || '',
    contactPhone: initialData?.contactPhone || '',
    publicEmail: initialData?.publicEmail || '',
    cep: initialData?.cep || '',
    address: initialData?.address || '',
    number: initialData?.number || '',
    neighborhood: initialData?.neighborhood || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    googleMapsLink: initialData?.googleMapsLink || '',
    cancellationPolicy: initialData?.cancellationPolicy || '',
    termsOfUse: initialData?.termsOfUse || '',
  };
};

const Settings: React.FC = () => {
  const { arena } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [formData, setFormData] = useState<ArenaSettings>(() => getInitialFormData(null, arena));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (arena) {
      const savedSettings = localStorage.getItem(`arena_settings_${arena.id}`);
      if (savedSettings) {
        setFormData(getInitialFormData(JSON.parse(savedSettings), arena));
      } else {
        setFormData(getInitialFormData(null, arena));
      }
      setIsLoading(false);
    }
  }, [arena]);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Perfil da Arena', icon: Building },
    { id: 'operation', label: 'Operação e Políticas', icon: FileText },
    { id: 'plan', label: 'Plano e Faturamento', icon: BarChart2 },
  ];

  const handleSave = () => {
    if (!arena) return;
    setIsSaving(true);
    localStorage.setItem(`arena_settings_${arena.id}`, JSON.stringify(formData));
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 1000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab formData={formData} setFormData={setFormData} />;
      case 'operation':
        return <OperationTab formData={formData} setFormData={setFormData} />;
      case 'plan':
        return <PlanTab />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Configurações</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Gerencie as informações e políticas da sua arena.</p>
        </motion.div>

        <div className="bg-white dark:bg-brand-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[70vh]">
          {/* Sidebar */}
          <aside className="w-full md:w-72 bg-brand-gray-50 dark:bg-brand-gray-800 p-6 border-b md:border-b-0 md:border-r border-brand-gray-200 dark:border-brand-gray-700">
            <nav className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center text-left p-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-brand-gray-700 text-brand-blue-700 dark:text-white font-semibold'
                      : 'text-brand-gray-600 dark:text-brand-gray-300 hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700'
                  }`}
                >
                  <tab.icon className={`h-5 w-5 mr-3 ${activeTab === tab.id ? 'text-brand-blue-500' : ''}`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 md:p-8 flex flex-col">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Footer */}
            {activeTab !== 'plan' && (
              <div className="mt-8 pt-6 border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end">
                <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={showSuccess ? 'success' : 'save'}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center"
                    >
                      {showSuccess ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" /> Salvo com sucesso!
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                        </>
                      )}
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
