import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";

const classes = [
  {
    id: "neanderthal",
    name: "Neanderthal",
    prefix: "n",
    gif: "/assets/character/cast_gifs/neanderthal_cast.gif",
    description:
      "Strong and resilient. The Neanderthals utilize brute force and endurance to survive the harsh environments.",
  },
  {
    id: "floresiensis",
    name: "Floresiensis",
    prefix: "f",
    gif: "/assets/character/cast_gifs/flroesiensis_cast.gif",
    description:
      "Small and agile. The Floresiensis creates tools and moves with speed that baffles larger prey.",
  },
  {
    id: "sapiens",
    name: "Sapiens",
    prefix: "hs",
    gif: "/assets/character/cast_gifs/homosapiens_cast.gif",
    description:
      "Intelligent and adaptable. The Sapiens use superior tactics and social structures to dominate.",
  },
];

const ClassSelection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % classes.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + classes.length) % classes.length);
  };

  const handleSelect = () => {
    const selectedClass = classes[currentIndex];
    navigate("/create", { state: { selectedClass } });
  };

  return (
    <MainLayout>
      <div className="w-full max-w-4xl px-4">
        {/* Fejléc - kisebb margin */}
        <h1 className="text-3xl md:text-4xl font-black text-center mb-4 md:mb-6 drop-shadow-lg text-amber-500 tracking-wider">
          CHOOSE YOUR SPECIE!
        </h1>

        <div className="flex flex-col items-center">
          {/* Carousel és nyilak egy sorban */}
          <div className="flex items-center justify-center gap-2 md:gap-4 w-full mb-4">
            {/* Left Arrow */}
            <button
              onClick={handlePrev}
              className="p-2 md:p-3 bg-stone-800/80 hover:bg-amber-700/80 rounded-full transition-colors border-2 border-amber-900/50 cursor-pointer z-20 flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-6 h-6 md:w-8 md:h-8 text-amber-200"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>

            {/* Carousel - kisebb */}
            <div className="relative w-full max-w-sm md:max-w-md bg-stone-900/60 rounded-2xl md:rounded-3xl overflow-hidden border-3 md:border-4 border-stone-700 shadow-xl backdrop-blur-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <img
                    src={classes[currentIndex].gif}
                    alt={classes[currentIndex].name}
                    className="w-full h-auto max-h-[400px] md:max-h-[450px] object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "fallback-image-url";
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Arrow */}
            <button
              onClick={handleNext}
              className="p-2 md:p-3 bg-stone-800/80 hover:bg-amber-700/80 rounded-full transition-colors border-2 border-amber-900/50 cursor-pointer z-20 flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-6 h-6 md:w-8 md:h-8 text-amber-200"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>

          {/* Leírás - kisebb padding */}
          <div className="w-full mb-4 md:mb-6">
            <div className="border-3 md:border-4 border-stone-700 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-xl backdrop-blur-sm bg-stone-900/60">
              <h2 className="text-2xl md:text-3xl font-bold text-amber-400 mb-1 md:mb-2 text-center uppercase">
                {classes[currentIndex].name}
              </h2>
              <p className="text-stone-300 text-xs md:text-sm text-center leading-relaxed">
                {classes[currentIndex].description}
              </p>
            </div>
          </div>

          {/* Gomb - kisebb */}
          <div className="flex justify-center">
            <button
              onClick={handleSelect}
              className="px-8 md:px-10 py-3 md:py-4 bg-amber-600 hover:bg-amber-500 text-stone-900 text-lg md:text-xl font-bold uppercase tracking-widest rounded shadow-[0_4px_0_rgb(146,64,14)] active:shadow-[0_0px_0_rgb(146,64,14)] active:translate-y-1 transition-all border-2 border-amber-700"
            >
              Select this specie
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClassSelection;