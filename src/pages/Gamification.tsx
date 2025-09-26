import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Star, Gift, Trophy, Loader2, Save, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabaseClient';
import { GamificationSettings, GamificationLevel, GamificationReward, GamificationAchievement } from '../types';
import Button from '../components/Forms/Button';
import GeneralSettings from '../components/Gamification/GeneralSettings';
import LevelsSettings from '../components/Gamification/LevelsSettings';
import RewardsSettings from '../components/Gamification/RewardsSettings';
import AchievementsSettings from '../components/Gamification/AchievementsSettings';

type TabType = 'general' | 'levels' | 'rewards' | 'achievements';

const Gamification: React.FC = () => {
  const { arena } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [settings, setSettings] = useState<GamificationSettings | null>(null);
  const [levels, setLevels] = useState<GamificationLevel[]>([]);
  const [rewards, setRewards] = useState<GamificationReward[]>([]);
  const [achievements, setAchievements] = useState<GamificationAchievement[]>([]);

  const loadData = useCallback(async (showLoading = true) => {
    if (!arena) return;
    if (showLoading) setIsLoading(true);
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('gamification_settings')
        .select('arena_id, is_enabled, points_per_reservation, points_per_real')
        .eq('arena_id', arena.id)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      const { data: levelsData, error: levelsError } = await supabase
        .from('gamification_levels')
        .select('id, arena_id, name, points_required, level_rank')
        .eq('arena_id', arena.id);

      if (levelsError) throw levelsError;

      if (!settingsData || !levelsData || levelsData.length === 0) {
        addToast({ message: "Configurando o sistema de gamificação com valores padrão...", type: 'info' });
        const { error: rpcError } = await supabase.rpc('seed_gamification_defaults', { p_arena_id: arena.id });
        if (rpcError) throw rpcError;
        
        await loadData(false); // Reload data without showing loader
        addToast({ message: "Sistema de gamificação pronto para uso!", type: 'success' });
        return; // Exit to avoid setting state with old data
      }

      const [rewardsRes, achievementsRes] = await Promise.all([
        supabase.from('gamification_rewards').select('id, arena_id, title, description, points_cost, type, value, quantity, is_active').eq('arena_id', arena.id),
        supabase.from('gamification_achievements').select('id, arena_id, name, description, type, points_reward, icon').eq('arena_id', arena.id),
      ]);
      
      if (rewardsRes.error) throw rewardsRes.error;
      if (achievementsRes.error) throw achievementsRes.error;

      setSettings(settingsData);
      setLevels(levelsData.sort((a, b) => a.level_rank - b.level_rank));
      setRewards(rewardsRes.data || []);
      setAchievements(achievementsRes.data || []);

    } catch (error: any) {
      addToast({ message: `Erro ao carregar configurações: ${error.message}`, type: 'error' });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [arena, addToast]);

  useEffect(() => {
    if (arena) {
      loadData();
    }
  }, [arena, loadData]);

  const handleSave = async () => {
    if (!arena) return;
    setIsSaving(true);
    try {
      if (settings) {
        const { error: settingsError } = await supabase.from('gamification_settings').upsert({ ...settings, arena_id: arena.id });
        if (settingsError) throw settingsError;
      }
      const { error: levelsError } = await supabase.from('gamification_levels').upsert(levels.map(l => ({ ...l, arena_id: arena.id })));
      if (levelsError) throw levelsError;

      const { error: rewardsError } = await supabase.from('gamification_rewards').upsert(rewards.map(r => ({ ...r, arena_id: arena.id })));
      if (rewardsError) throw rewardsError;

      const { error: achievementsError } = await supabase.from('gamification_achievements').upsert(achievements.map(a => ({ ...a, arena_id: arena.id })));
      if (achievementsError) throw achievementsError;

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      addToast({ message: "Configurações de gamificação salvas!", type: 'success' });
    } catch (error: any) {
      addToast({ message: `Erro ao salvar: ${error.message}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'levels', label: 'Níveis', icon: Star },
    { id: 'rewards', label: 'Recompensas', icon: Gift },
    { id: 'achievements', label: 'Conquistas', icon: Trophy },
  ];

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" /></div>;
    
    switch (activeTab) {
      case 'general':
        return <GeneralSettings settings={settings} setSettings={setSettings} />;
      case 'levels':
        return <LevelsSettings levels={levels} setLevels={setLevels} />;
      case 'rewards':
        return <RewardsSettings rewards={rewards} setRewards={setRewards} />;
      case 'achievements':
        return <AchievementsSettings achievements={achievements} setAchievements={setAchievements} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">MatchPlay Rewards</h1>
              <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Configure o sistema de gamificação para engajar seus clientes.</p>
            </div>
            <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={showSuccess ? 'success' : 'save'} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center">
                  {showSuccess ? <><CheckCircle className="h-4 w-4 mr-2" /> Salvo!</> : <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>}
                </motion.span>
              </AnimatePresence>
            </Button>
          </div>
        </motion.div>

        <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 mb-8">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${activeTab === tab.id ? 'border-brand-blue-500 text-brand-blue-600 dark:text-brand-blue-400' : 'border-transparent text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 dark:text-brand-gray-400 dark:hover:text-brand-gray-200 dark:hover:border-brand-gray-600'}`}>
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Gamification;
