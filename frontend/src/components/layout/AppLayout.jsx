import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNavigation from './BottomNavigation';

export default function AppLayout({ showNav = true }) {
  return (
    <div className="min-h-screen bg-surface-0 flex justify-center text-white">
      <div className={`w-full max-w-md relative min-h-screen flex flex-col ${showNav ? 'pb-24' : ''}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          <Outlet />
        </motion.div>
        {showNav && <BottomNavigation />}
      </div>
    </div>
  );
}
