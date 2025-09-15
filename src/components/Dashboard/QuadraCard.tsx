import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quadra } from '../../types';
import Button from '../Forms/Button';
import { ChevronLeft, ChevronRight, Edit2, Trash2, Users, Shield, MapPin } from 'lucide-react';

interface QuadraCardProps {
  quadra: Quadra;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const QuadraCard: React.FC<QuadraCardProps> = ({ quadra, onEdit, onDelete, index }) => {
  const [[page, direction], setPage] = useState([0, 0]);

  const imageIndex = page % (quadra.photos.length || 1);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  return (
    <motion.div
      key={quadra.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-brand-gray-50 dark:bg-brand-gray-900 border border-brand-gray-200 dark:border-brand-gray-700 rounded-lg overflow-hidden flex flex-col hover:shadow-xl dark:hover:shadow-brand-blue-500/10 transition-shadow"
    >
      <div className="h-48 bg-brand-gray-200 dark:bg-brand-gray-700 relative overflow-hidden group">
        {quadra.photos.length > 0 ? (
          <>
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={page}
                src={quadra.photos[imageIndex]}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    paginate(1);
                  } else if (swipe > swipeConfidenceThreshold) {
                    paginate(-1);
                  }
                }}
                alt={quadra.name}
                className="absolute w-full h-full object-cover"
              />
            </AnimatePresence>
            {quadra.photos.length > 1 && (
              <>
                <div className="absolute top-1/2 -translate-y-1/2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => paginate(-1)} className="bg-black/40 text-white p-1 rounded-full hover:bg-black/60">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => paginate(1)} className="bg-black/40 text-white p-1 rounded-full hover:bg-black/60">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex space-x-1.5">
                  {quadra.photos.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${i === imageIndex ? 'w-4 bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-gray-400 dark:text-brand-gray-500 bg-gradient-to-br from-brand-gray-100 to-brand-gray-200 dark:from-brand-gray-800 dark:to-brand-gray-700">
            <MapPin className="h-12 w-12" />
          </div>
        )}
        <div className="absolute top-4 right-4 z-10">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            quadra.status === 'ativa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            quadra.status === 'inativa' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {quadra.status.charAt(0).toUpperCase() + quadra.status.slice(1)}
          </span>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-brand-gray-900 dark:text-white">{quadra.name}</h3>
              <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{quadra.sport_type}</p>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" onClick={onEdit} className="p-2"><Edit2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={onDelete} className="p-2 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-lg font-bold text-green-600">R$ {quadra.price_per_hour.toFixed(2)}/hora</p>
            <div className="flex items-center text-sm text-brand-gray-600 dark:text-brand-gray-400"><Users className="h-4 w-4 mr-1" />{quadra.capacity} pessoas</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs mt-auto">
          {quadra.is_covered && <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><Shield className="h-3 w-3 mr-1" />Coberta</span>}
          {quadra.has_lighting && <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">💡 Iluminação</span>}
        </div>
      </div>
    </motion.div>
  );
};

export default QuadraCard;
