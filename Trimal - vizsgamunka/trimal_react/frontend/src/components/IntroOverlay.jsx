// src/components/IntroOverlay.jsx
import React, { useEffect, useState } from "react";

const IntroOverlay = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(onComplete, 800);
  };

  const contextText = `They say the whispers started in the stone.

Not in the wind, or the water, but deep in the flint and the basalt. A low-frequency thrum that the huge creatures—the Mammuthus and the Coelodonta—felt in their bones before the humans ever heard it. It was a pressure, a wrongness in the smell of the air before a storm that never came.

By 60,000 BCE, the old ways were dying. A solitary hunter, no matter how skilled, found the game silent and gone. A lone mammoth, separated from the rhythm, would walk in circles until its legs gave way. The world had begun to hum, and the hum demanded a response it did not explain.

So the tribes adapted. Not out of wisdom, but out of a biological necessity they couldn't name. Hunters learned to read the twitch of a woolly rhino's ear, which now pointed towards the safest path. Mammoths, in turn, would stamp the ground to alert the two-legged ones to thin ice that their own eyes could not see. It was a contract written in vibration and instinct.

The geologists of a distant future would find the evidence and call it a "piezoelectric resonance cascade" in the tectonic plates, a rare moment when the planet's own electrical heartbeat became loud enough to be felt. They would theorize that the quartz in the ancient rock, compressed by unimaginable pressure, sang a song that briefly scrambled the fundamental fight-or-flight wiring of the Pleistocene mind, replacing it with a fragile, temporary need for symbiosis.

But the people then didn't know that. They only knew that when the earth sang, you listened. And if you listened closely enough, you lived.`;

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80 transition-opacity duration-700 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      <div className="relative max-w-5xl w-full bg-stone-900/90 border-2 border-amber-900/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[70vh]">
        
        {/* Video Side */}
        <div className="w-full md:w-1/2 bg-black flex items-center justify-center p-4">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-stone-800 shadow-inner">
            <video
              src="/videos/trimal-intro.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Text Side */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-between bg-stone-900/40 relative overflow-hidden">
             {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-900/10 blur-3xl rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-600/5 blur-3xl rounded-full -ml-16 -mb-16" />

            <div className="relative z-10 flex-grow overflow-y-auto scrollbar-thin pr-4 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-amber-500 mb-6 tracking-tighter uppercase border-b border-amber-900/30 pb-2">
                    Primeval Resonance
                </h2>
                <div className="text-stone-300 text-sm md:text-base leading-relaxed space-y-4 font-serif italic text-justify">
                    {contextText.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                    ))}
                </div>
            </div>

            <button
                onClick={handleClose}
                className="relative z-10 w-full py-3 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 text-amber-200 font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] tracking-widest uppercase text-sm"
            >
                Embrace the Song
            </button>
        </div>
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(180,120,40,0.3); border-radius: 10px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(180,120,40,0.5); }
      `}</style>
    </div>
  );
};

export default IntroOverlay;
