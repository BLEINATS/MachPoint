import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import AnalyticsDashboard from '../components/Dashboard/AnalyticsDashboard';
import ClientDashboard from '../components/Client/ClientDashboard';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleDayClick = (date: Date) => {
    navigate('/reservas', { state: { selectedDate: date.toISOString() } });
  };
  
  // Lógica para renderizar o dashboard correto
  const renderDashboard = () => {
    if (profile?.role === 'admin_arena') {
      // O AnalyticsDashboard agora busca seus próprios dados
      return <AnalyticsDashboard onDayClick={handleDayClick} />;
    }
    if (profile?.role === 'cliente') {
      // O ClientDashboard agora busca seus próprios dados do contexto
      return <ClientDashboard />;
    }
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-white">Carregando...</h2>
        <p className="text-brand-gray-600 dark:text-brand-gray-400">Verificando seu perfil.</p>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </div>
    </Layout>
  );
};

export default Dashboard;
