import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';
import QuadraFormTabs from '../components/Forms/QuadraFormTabs';
import QuadraCard from '../components/Dashboard/QuadraCard';
import { Quadra } from '../types';

const Quadras: React.FC = () => {
  const { arena } = useAuth();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuadra, setEditingQuadra] = useState<Quadra | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(() => {
    if (arena) {
      const savedQuadras = localStorage.getItem(`quadras_${arena.id}`);
      if (savedQuadras) {
        setQuadras(JSON.parse(savedQuadras));
      }
    }
  }, [arena]);

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => {
      window.removeEventListener('focus', loadData);
    };
  }, [loadData]);

  const handleSaveQuadra = (quadraData: Omit<Quadra, 'id' | 'arena_id' | 'created_at'> | Quadra) => {
    if (!arena) return;

    let updatedQuadras: Quadra[];

    if ('id' in quadraData) {
      updatedQuadras = quadras.map(q => q.id === quadraData.id ? quadraData : q);
    } else {
      const newQuadra: Quadra = {
        ...quadraData,
        id: 'quadra_' + Date.now(),
        arena_id: arena.id,
        created_at: new Date().toISOString(),
      };
      updatedQuadras = [...quadras, newQuadra];
    }

    setQuadras(updatedQuadras);
    localStorage.setItem(`quadras_${arena.id}`, JSON.stringify(updatedQuadras));
    setIsFormOpen(false);
    setEditingQuadra(null);
  };

  const handleOpenCreateForm = () => {
    setEditingQuadra(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (quadra: Quadra) => {
    setEditingQuadra(quadra);
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingQuadra(null);
  };

  const handleDeleteQuadra = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta quadra? Esta ação não pode ser desfeita.')) {
      const updatedQuadras = quadras.filter(quadra => quadra.id !== id);
      setQuadras(updatedQuadras);
      if (arena) {
        localStorage.setItem(`quadras_${arena.id}`, JSON.stringify(updatedQuadras));
      }
    }
  };

  const copyLink = () => {
    if (!arena) return;
    navigator.clipboard.writeText(`${window.location.origin}/${arena.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {isFormOpen ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <QuadraFormTabs
                onSubmit={handleSaveQuadra}
                onCancel={handleCancelForm}
                initialData={editingQuadra}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg border border-brand-gray-200 dark:border-brand-gray-700">
                <div className="px-6 py-4 border-b border-brand-gray-200 dark:border-brand-gray-700">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <h2 className="text-xl font-semibold text-brand-gray-900 dark:text-white">Minhas Quadras</h2>
                    <Button
                      onClick={handleOpenCreateForm}
                      className="flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Quadra
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  {quadras.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="h-12 w-12 text-brand-gray-400 dark:text-brand-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-brand-gray-900 dark:text-white mb-2">
                        Nenhuma quadra cadastrada
                      </h3>
                      <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-6">
                        Comece criando sua primeira quadra para receber reservas.
                      </p>
                      <Button onClick={handleOpenCreateForm}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar primeira quadra
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {quadras.map((quadra, index) => (
                        <QuadraCard
                          key={quadra.id}
                          quadra={quadra}
                          onEdit={() => handleOpenEditForm(quadra)}
                          onDelete={() => handleDeleteQuadra(quadra.id)}
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {quadras.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 bg-blue-50 dark:bg-brand-gray-800 rounded-lg p-6 border border-blue-200 dark:border-brand-gray-700"
                >
                  <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-2">Sua Arena está pronta!</h3>
                  <p className="text-blue-700 dark:text-blue-300 mb-4">Compartilhe o link abaixo com seus clientes para que eles possam fazer reservas:</p>
                  <div className="flex items-center space-x-4">
                    <code className="bg-white dark:bg-brand-gray-700 px-3 py-2 rounded border border-brand-gray-200 dark:border-brand-gray-600 text-sm flex-1 truncate">{`${window.location.origin}/${arena?.slug || ''}`}</code>
                    <Button variant="outline" size="sm" onClick={copyLink}>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={copied ? 'copied' : 'copy'}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex items-center"
                        >
                          {copied ? 'Copiado!' : <><Copy className="h-4 w-4 mr-2" /> Copiar</>}
                        </motion.span>
                      </AnimatePresence>
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Quadras;
