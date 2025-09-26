import React from 'react';
import { Aluno, GamificationLevel, GamificationReward, GamificationAchievement, AlunoAchievement } from '../../types';
import { Star, Gift, Trophy, CheckCircle } from 'lucide-react';
import Button from '../Forms/Button';

interface RewardsTabProps {
  aluno: Aluno | null;
  levels: GamificationLevel[];
  rewards: GamificationReward[];
  achievements: GamificationAchievement[];
  unlockedAchievements: AlunoAchievement[];
}

const RewardsTab: React.FC<RewardsTabProps> = ({ aluno, levels, rewards, achievements, unlockedAchievements }) => {
  if (!aluno) {
    return <div className="text-center p-8 text-brand-gray-500">Carregando dados de gamificação...</div>;
  }

  const currentLevel = levels.find(l => l.id === aluno.gamification_level_id);
  const nextLevel = levels.find(l => l.level_rank === (currentLevel?.level_rank || 0) + 1);
  
  const progressPercentage = nextLevel
    ? ((aluno.gamification_points || 0) - (currentLevel?.points_required || 0)) /
      (nextLevel.points_required - (currentLevel?.points_required || 0)) * 100
    : 100;

  return (
    <div className="space-y-8">
      {/* Level and Points */}
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold">{currentLevel?.name || 'Iniciante'}</h3>
            <p className="text-sm text-brand-gray-500">Seu nível no MatchPlay Rewards</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-blue-500">{aluno.gamification_points || 0}</p>
            <p className="text-sm text-brand-gray-500">MatchPoints</p>
          </div>
        </div>
        <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-2.5">
          <div className="bg-brand-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min(progressPercentage, 100)}%` }}></div>
        </div>
        {nextLevel && (
          <p className="text-xs text-right mt-2 text-brand-gray-500">
            Faltam {nextLevel.points_required - (aluno.gamification_points || 0)} pontos para o nível {nextLevel.name}
          </p>
        )}
      </div>

      {/* Rewards */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center"><Gift className="mr-2 h-5 w-5 text-green-500" /> Recompensas para Resgate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.filter(r => r.is_active).map(reward => (
            <div key={reward.id} className="bg-white dark:bg-brand-gray-800 rounded-lg shadow p-4 border border-brand-gray-200 dark:border-brand-gray-700 flex flex-col justify-between">
              <div>
                <h4 className="font-bold">{reward.title}</h4>
                <p className="text-sm text-brand-gray-500 mt-1">{reward.description}</p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-green-600 dark:text-green-400">{reward.points_cost} Pontos</span>
                <Button size="sm" disabled={(aluno.gamification_points || 0) < reward.points_cost}>Resgatar</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center"><Trophy className="mr-2 h-5 w-5 text-yellow-500" /> Conquistas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map(ach => {
            const isUnlocked = unlockedAchievements.some(ua => ua.achievement_id === ach.id);
            return (
              <div key={ach.id} className={`p-4 rounded-lg text-center border ${isUnlocked ? 'bg-yellow-50 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700' : 'bg-brand-gray-100 dark:bg-brand-gray-800 border-brand-gray-200 dark:border-brand-gray-700'}`}>
                <div className="relative w-12 h-12 mx-auto">
                  <Trophy className={`w-12 h-12 ${isUnlocked ? 'text-yellow-500' : 'text-brand-gray-400'}`} />
                  {isUnlocked && <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 bg-white dark:bg-yellow-900/50 rounded-full text-green-500" />}
                </div>
                <p className="font-semibold text-sm mt-2">{ach.name}</p>
                <p className="text-xs text-brand-gray-500">{ach.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RewardsTab;
