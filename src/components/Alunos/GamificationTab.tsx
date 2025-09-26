import React, { useState, useEffect, useCallback } from 'react';
import { Aluno, GamificationPointTransaction, AlunoAchievement, GamificationAchievement } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { Loader2, Plus, Minus, Star, Trophy, History } from 'lucide-react';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { format } from 'date-fns';

interface GamificationTabProps {
  aluno: Aluno;
  onDataChange: () => void;
}

const GamificationTab: React.FC<GamificationTabProps> = ({ aluno, onDataChange }) => {
  const { addToast } = useToast();
  const [history, setHistory] = useState<GamificationPointTransaction[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pointsToAdd, setPointsToAdd] = useState<number | string>('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadGamificationData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [historyRes, achievementsRes] = await Promise.all([
        supabase
          .from('gamification_point_transactions')
          .select('*')
          .eq('aluno_id', aluno.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('aluno_achievements')
          .select('*, gamification_achievements(*)')
          .eq('aluno_id', aluno.id)
      ]);

      if (historyRes.error) throw historyRes.error;
      if (achievementsRes.error) throw achievementsRes.error;
      
      setHistory(historyRes.data || []);
      setUnlockedAchievements(achievementsRes.data || []);

    } catch (error: any) {
      addToast({ message: `Erro ao carregar dados de gamificação: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [aluno.id, addToast]);

  useEffect(() => {
    loadGamificationData();
  }, [loadGamificationData]);

  const handlePointsAdjustment = async () => {
    const points = Number(pointsToAdd);
    if (isNaN(points) || points === 0 || !adjustmentReason.trim()) {
      addToast({ message: 'Por favor, insira um valor de pontos e um motivo.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: rpcError } = await supabase.rpc('add_gamification_points', {
        p_aluno_id: aluno.id,
        p_points_to_add: points,
        p_description: adjustmentReason,
      });

      if (rpcError) throw rpcError;
      
      addToast({ message: 'Pontos ajustados com sucesso!', type: 'success' });
      setPointsToAdd('');
      setAdjustmentReason('');

      onDataChange();

    } catch (error: any) {
      addToast({ message: `Erro ao ajustar pontos: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-brand-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Manual Adjustment */}
      <div className="p-4 border rounded-lg bg-brand-gray-50 dark:bg-brand-gray-900/50">
        <h4 className="font-semibold mb-3">Ajuste Manual de Pontos</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Pontos a Adicionar/Remover"
            type="number"
            value={pointsToAdd}
            onChange={(e) => setPointsToAdd(e.target.value)}
            placeholder="Ex: 50 ou -20"
          />
          <Input 
            label="Motivo do Ajuste"
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            placeholder="Ex: Bônus de boas-vindas"
          />
        </div>
        <div className="mt-4 text-right">
          <Button onClick={handlePointsAdjustment} isLoading={isSubmitting}>
            {Number(pointsToAdd) >= 0 ? <Plus className="h-4 w-4 mr-2" /> : <Minus className="h-4 w-4 mr-2" />}
            Ajustar Pontos
          </Button>
        </div>
      </div>

      {/* Unlocked Achievements */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center"><Trophy className="h-5 w-5 mr-2 text-yellow-500"/> Conquistas Desbloqueadas</h4>
        {unlockedAchievements.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {unlockedAchievements.map(ua => (
              <div key={ua.achievement_id} className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
                <Star className="h-8 w-8 mx-auto text-yellow-500" />
                <p className="text-sm font-semibold mt-2">{ua.gamification_achievements.name}</p>
                <p className="text-xs text-brand-gray-500">+{ua.gamification_achievements.points_reward} pontos</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-gray-500">Nenhuma conquista desbloqueada ainda.</p>
        )}
      </div>

      {/* Points History */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center"><History className="h-5 w-5 mr-2 text-brand-blue-500"/> Histórico de Pontos</h4>
        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
          {history.length > 0 ? history.map(tx => (
            <div key={tx.id} className="flex justify-between items-center p-2 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-md">
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-brand-gray-500">{format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <span className={`font-bold text-sm ${tx.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tx.points >= 0 ? '+' : ''}{tx.points}
              </span>
            </div>
          )) : (
            <p className="text-sm text-center text-brand-gray-500 py-4">Nenhuma transação de pontos encontrada.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamificationTab;
