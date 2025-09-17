import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building, FileText, BarChart2, CheckCircle, Save, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { Arena } from '../types';
import Button from '../components/Forms/Button';
import ProfileTab from '../components/Settings/ProfileTab';
import OperationTab from '../components/Settings/OperationTab';
import PlanTab from '../components/Settings/PlanTab';

type TabType = 'profile' | 'operation' | 'plan';

const Settings: React.FC = () => {
  const { arena, updateArena, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [formData, setFormData] = useState<Partial<Arena>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (arena) {
      setFormData(arena);
    }
  }, [arena]);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Perfil da Arena', icon: Building },
    { id: 'operation', label: 'Operação e Políticas', icon: FileText },
    { id: 'plan', label: 'Plano e Faturamento', icon: BarChart2 },
  ];

  const handleSave = async () => {
    if (!arena) return;
    setIsSaving(true);
    try {
      await updateArena(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Falha ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
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

  if (isAuthLoading) {
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
                        <><CheckCircle className="h-4 w-4 mr-2" /> Salvo com sucesso!</>
                      ) : (
                        <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>
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
