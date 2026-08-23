import React, { useState } from 'react';
import { Search, ChevronDown, ArrowUp, ArrowDown, Minus, Crown } from 'lucide-react';

export default function Rankings() {
  const [filter, setFilter] = useState('local');
  const [metric, setMetric] = useState('Total');
  const [time, setTime] = useState('Este Mes');

  // Simulated data to exactly match the image
  const podium = [
    { id: 2, name: 'Carlos', weight: '140kg', position: 2, avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80' },
    { id: 1, name: 'Alex (Tú)', weight: '155kg', position: 1, avatar: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=150&q=80' },
    { id: 3, name: 'Sofia', weight: '135kg', position: 3, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80' },
  ];

  const list = [
    { id: 4, name: 'Marcos T.', weight: '125 kg', trend: 'up', position: 4, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80' },
    { id: 5, name: 'Lucía G.', weight: '120 kg', trend: 'same', position: 5, avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?w=150&q=80' },
    { id: 6, name: 'Javier R.', weight: '115 kg', trend: 'down', position: 6, avatar: 'https://ui-avatars.com/api/?name=Javier+R&background=333&color=fff' },
  ];

  return (
    <div className="p-4 pb-32 min-h-screen bg-surface-0 flex flex-col items-center">
      <div className="w-full max-w-md">
        
        {/* Header & Main Toggle */}
        <div className="flex items-center justify-between mb-6 mt-2">
          <h1 className="text-2xl font-bold text-white">Rankings</h1>
          <div className="flex bg-surface-2 rounded-lg p-1">
            <button 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${filter === 'local' ? 'bg-primary text-surface-0' : 'text-gray-400'}`}
              onClick={() => setFilter('local')}
            >
              Mi Gimnasio
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${filter === 'global' ? 'bg-surface-2 text-white' : 'text-gray-400'}`}
              onClick={() => setFilter('global')}
            >
              Global
            </button>
          </div>
        </div>

        {/* Search & Metric Toggle */}
        <div className="flex space-x-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full bg-surface-1 border border-surface-2 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex bg-surface-1 border border-surface-2 rounded-lg p-1">
            <button 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${metric === 'Total' ? 'text-white' : 'text-gray-400'}`}
              onClick={() => setMetric('Total')}
            >
              Total
            </button>
            <button 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${metric === 'RM' ? 'text-white' : 'text-gray-400'}`}
              onClick={() => setMetric('RM')}
            >
              RM
            </button>
          </div>
        </div>

        {/* Time Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2 mb-10 scrollbar-hide">
          {['Hoy', 'Esta Semana', 'Este Mes', 'Siempre'].map((t) => (
            <button 
              key={t}
              onClick={() => setTime(t)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-semibold ${time === t ? 'bg-surface-2 text-white border border-surface-2' : 'bg-surface-1 border border-surface-2 text-gray-400'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center mb-12 h-48 px-4">
          
          {/* Pos 2 */}
          <div className="flex flex-col items-center -mr-4 z-10 pb-4">
            <div className="relative">
              <img src={podium[0].avatar} className="w-20 h-20 rounded-full border-4 border-gray-300 object-cover" />
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-surface-1 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-gray-300">
                2
              </div>
            </div>
            <span className="font-bold text-sm mt-5">{podium[0].name}</span>
            <span className="font-black text-primary text-xl">{podium[0].weight}</span>
          </div>

          {/* Pos 1 */}
          <div className="flex flex-col items-center z-20 mx-2">
            <Crown className="text-primary mb-2" size={36} strokeWidth={2.5} />
            <div className="relative">
              <div className="absolute inset-0 rounded-full shadow-glow opacity-50"></div>
              <img src={podium[1].avatar} className="w-28 h-28 rounded-full border-[4px] border-primary object-cover relative z-10" />
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-surface-0 text-sm font-black w-8 h-8 rounded-full flex items-center justify-center z-20">
                1
              </div>
            </div>
            <span className="font-bold mt-6">{podium[1].name}</span>
            <span className="font-black text-primary text-2xl">{podium[1].weight}</span>
          </div>

          {/* Pos 3 */}
          <div className="flex flex-col items-center -ml-4 z-10 pb-6">
            <div className="relative">
              <img src={podium[2].avatar} className="w-20 h-20 rounded-full border-4 border-[#b07d50] object-cover" />
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-surface-1 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-[#b07d50]">
                3
              </div>
            </div>
            <span className="font-bold text-sm mt-5">{podium[2].name}</span>
            <span className="font-black text-primary text-xl">{podium[2].weight}</span>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl flex items-center justify-between p-3 px-4">
              <div className="flex items-center space-x-4">
                <span className="text-gray-400 font-mono">{r.position}</span>
                <img src={r.avatar} className="w-10 h-10 rounded-full object-cover" />
                <span className="text-white text-base">{r.name}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-white text-base">{r.weight}</span>
                {r.trend === 'up' && (
                  <div className="bg-[#1e3a2b] rounded-full p-1">
                    <ArrowUp className="text-[#10b981]" size={14} strokeWidth={3} />
                  </div>
                )}
                {r.trend === 'down' && (
                  <div className="bg-[#3b1c1c] rounded-full p-1">
                    <ArrowDown className="text-[#ef4444]" size={14} strokeWidth={3} />
                  </div>
                )}
                {r.trend === 'same' && (
                  <div className="bg-[#2a2a2a] rounded-full p-1">
                    <Minus className="text-gray-400" size={14} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button className="flex items-center text-primary text-sm font-medium hover:text-primary-dim transition-colors">
            Cargar más <ChevronDown size={16} className="ml-1" />
          </button>
        </div>

      </div>
    </div>
  );
}
