import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Mail, Key, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Input from '../components/Forms/Input';
import Button from '../components/Forms/Button';

const ArenaSignup: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    arenaName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const newErrors: Record<string, string> = {};
      if (!formData.email) newErrors.email = 'E-mail é obrigatório';
      if (!formData.password) newErrors.password = 'Senha é obrigatória';
      if (!formData.arenaName) newErrors.arenaName = 'Nome da arena é obrigatório';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }

      await signUp(formData.email, formData.password, formData.arenaName);
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen bg-brand-gray-50 dark:bg-brand-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <Calendar className="h-12 w-12 text-brand-blue-500" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-center text-3xl font-extrabold text-brand-gray-900 dark:text-white"
          >
            Crie sua Arena no MatchPlay
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-center text-sm text-brand-gray-600 dark:text-brand-gray-400"
          >
            Comece a gerenciar suas quadras em minutos
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="bg-white dark:bg-brand-gray-900 py-8 px-4 shadow-xl dark:shadow-2xl dark:shadow-brand-blue-500/10 rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                label="E-mail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="seu@email.com"
                icon={<Mail className="h-4 w-4 text-brand-gray-400" />}
                required
              />

              <Input
                label="Senha"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Digite sua senha"
                icon={<Key className="h-4 w-4 text-brand-gray-400" />}
                required
              />

              <Input
                label="Nome da sua Arena"
                name="arenaName"
                value={formData.arenaName}
                onChange={handleChange}
                error={errors.arenaName}
                placeholder="Ex: Arena Beira Rio"
                icon={<Shield className="h-4 w-4 text-brand-gray-400" />}
                required
              />

              {errors.submit && (
                <div className="text-sm text-red-600 dark:text-red-400 text-center">
                  {errors.submit}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                Criar minha Arena
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-gray-300 dark:border-brand-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-brand-gray-900 text-brand-gray-500 dark:text-brand-gray-400">
                    O que você terá acesso
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-brand-gray-700 dark:text-brand-gray-300">
                    Gerenciamento completo de quadras
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-brand-gray-700 dark:text-brand-gray-300">
                    Sistema de reservas automatizado
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-green-500" />
                  <span className="ml-3 text-sm text-brand-gray-700 dark:text-brand-gray-300">
                    Controle de horários em tempo real
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ArenaSignup;
