import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import Input from '../components/Forms/Input';
import Button from '../components/Forms/Button';
import { User, Mail, Phone, Calendar, Save, Image as ImageIcon, CheckCircle, ArrowLeft } from 'lucide-react';
import { Profile } from '../types';

const ClientProfile: React.FC = () => {
  const { profile, user, updateProfile } = useAuth();
  const [formData, setFormData] = useState<Partial<Profile>>(profile || {});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    updateProfile(formData);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 1000);
  };
  
  const handleAvatarChange = () => {
    const newAvatar = `https://avatar.vercel.sh/${user?.email || 'user'}.svg?text=${formData.name?.charAt(0) || 'U'}`;
    setFormData(p => ({ ...p, avatar_url: newAvatar }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!profile) {
    return <Layout><div className="p-8 text-center">Perfil não encontrado.</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
           <Link 
            to="/dashboard" 
            className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Meu Perfil</h1>
          <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Mantenha suas informações pessoais atualizadas.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="mt-8 bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-8 border border-brand-gray-200 dark:border-brand-gray-700"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-brand-gray-200 dark:bg-brand-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-brand-gray-800 shadow-md">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-brand-gray-400" />
                  )}
                </div>
                <button 
                  onClick={handleAvatarChange} 
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ImageIcon className="h-8 w-8 text-white" />
                </button>
              </div>
              <h2 className="text-xl font-bold mt-4 text-brand-gray-900 dark:text-white">{formData.name || 'Usuário'}</h2>
              <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">{user?.email}</p>
              <span className="mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {profile.clientType?.charAt(0).toUpperCase() + (profile.clientType?.slice(1) || 'Cliente')}
              </span>
            </div>

            <div className="md:col-span-2 space-y-6">
              <Input
                label="Nome Completo"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                icon={<User className="h-4 w-4 text-brand-gray-400" />}
              />
              <Input
                label="E-mail"
                value={user?.email || ''}
                readOnly
                disabled
                className="cursor-not-allowed bg-brand-gray-100 dark:bg-brand-gray-700"
                icon={<Mail className="h-4 w-4 text-brand-gray-400" />}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Data de Nascimento"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date || ''}
                  onChange={handleChange}
                  icon={<Calendar className="h-4 w-4 text-brand-gray-400" />}
                />
                <div>
                  <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Gênero</label>
                  <select
                    name="gender"
                    value={formData.gender || 'nao_informado'}
                    onChange={handleChange}
                    className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500"
                  >
                    <option value="nao_informado">Prefiro não informar</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end">
                <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
                  <motion.span
                    key={showSuccess ? 'success' : 'save'}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center"
                  >
                    {showSuccess ? (
                      <><CheckCircle className="h-4 w-4 mr-2" /> Salvo!</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>
                    )}
                  </motion.span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ClientProfile;
