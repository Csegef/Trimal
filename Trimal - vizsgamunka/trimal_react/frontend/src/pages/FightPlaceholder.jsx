import React from 'react';
import GameLayout from '../layouts/GameLayout';
import { useNavigate } from 'react-router-dom';

const FightPlaceholder = () => {
  const navigate = useNavigate();

  return (
    <GameLayout>
      <div className="relative z-10 w-full max-w-4xl mx-auto h-[70vh] flex flex-col items-center justify-center p-8">
        <div className="bg-black/80 border-4 border-red-900/50 p-12 rounded-3xl shadow-[0_0_100px_rgba(220,38,38,0.2)] backdrop-blur-md flex flex-col items-center text-center">
          
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-800 tracking-[0.2em] uppercase drop-shadow-2xl mb-6">
            Fight
          </h1>
          
          <h2 className="text-3xl text-amber-500 font-bold tracking-widest uppercase mb-10">
            Coming Soon
          </h2>
          
          <p className="text-stone-400 max-w-md mb-12 leading-relaxed">
            The battle system is currently under development. Soon you will face the ancient beasts and treacherous foes here.
          </p>
          
          <button 
            onClick={() => navigate('/maingame')}
            className="px-8 py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 rounded-xl font-bold uppercase tracking-widest transition-colors shadow-lg"
          >
            Return to Map
          </button>
        </div>
      </div>
    </GameLayout>
  );
};

export default FightPlaceholder;
