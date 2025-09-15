import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  description?: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
  index: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, description, color, index }) => {
  const colors = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg p-6 border border-brand-gray-200 dark:border-brand-gray-700"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
          <p className="text-3xl font-bold text-brand-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="p-3 bg-brand-gray-100 dark:bg-brand-gray-900 rounded-lg">
          <Icon className={`h-6 w-6 ${colors[color]}`} />
        </div>
      </div>
      {description && (
        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-3">{description}</p>
      )}
    </motion.div>
  );
};

export default StatCard;
