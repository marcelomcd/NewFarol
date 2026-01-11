import { motion } from 'framer-motion';

const colorClasses = {
  purple: 'from-purple-500 to-purple-600',
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  orange: 'from-orange-500 to-orange-600',
  teal: 'from-teal-500 to-teal-600',
  indigo: 'from-indigo-500 to-indigo-600',
  red: 'from-red-500 to-red-600',
  pink: 'from-pink-500 to-pink-600',
  yellow: 'from-yellow-500 to-yellow-600',
  cyan: 'from-cyan-500 to-cyan-600',
};

const DashboardCard = ({ title, description, icon, color = 'blue', children, size = 'medium' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col"
    >
      {/* Card Header */}
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-3 flex items-center gap-2`}>
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
          <i className={`fas fa-${icon} text-base`}></i>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="text-xs text-white/90">{description}</p>
        </div>
      </div>

      {/* Card Content - Always Open */}
      <div className="p-6 flex-1 overflow-auto">
        {children}
      </div>
    </motion.div>
  );
};

export default DashboardCard;
