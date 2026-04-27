// ==========================================
// Fájl: Karakter Készítő (Character Creator)
// Cél: A haj, szakáll és egyéb vizuális elemek testreszabása az új karaktereknek.
//
// Interaktív felület a portré összeállítására.
// ==========================================
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import PlayerPortrait from "../components/PlayerPortrait";

const CharacterCreator = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  //Default az neanderthal, ha nem adunk meg semmit
  const selectedClass = state?.selectedClass || {
    id: "neanderthal",
    name: "Neanderthal",
    prefix: "n",
  };

  const [hairIndex, setHairIndex] = useState(0); // 0 = Kopasz
  const [beardIndex, setBeardIndex] = useState(0); // 0 = Borosta nélküli
  const maxOptions = 5; // 5 haj és 5 szakál

  const prefix = selectedClass.prefix;

  const handleSave = () => {
    // Navigáció a regisztrációs oldalra az adatokkal
    navigate("/registration", {
      state: {
        selectedClass,
        hairIndex,
        beardIndex,
      },
    });
  };

  return (
    <MainLayout>
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center p-3 md:p-4">
        {/* Left Column: karakter preview - kisebb */}
        <div className="relative w-70 md:w-100 aspect-square bg-stone-900/50 rounded-xl md:rounded-2xl border-3 md:border-4 border-stone-700 shadow-xl shrink-0 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayerPortrait
              className={selectedClass.name}
              hairStyle={hairIndex}
              beardStyle={beardIndex}
            />
          </div>
        </div>

        {/* Right Column: Controls - kompaktabb */}
        <div className="grow w-full max-w-md flex flex-col gap-4 md:gap-5 backdrop-blur-sm p-4 md:p-6 rounded-xl md:rounded-2xl border-4 shadow-xl bg-stone-900/50 border-stone-700 ">
          <h2 className="text-xl md:text-2xl  text-amber-400 uppercase text-center border-b-2 border-stone-600 pb-2 md:pb-3">
            Customize
          </h2>

          {/* Haj stílus Control */}
          <div className="space-y-2">
            <label className="text-stone-300  uppercase tracking-wider text-sm md:text-base">
              Hair Style
            </label>
            <div className="flex items-center justify-between bg-stone-900 rounded-lg p-2 border border-stone-700">
              <button
                onClick={() =>
                  setHairIndex((prev) => (prev > 0 ? prev - 1 : maxOptions))
                }
                className="w-8 h-8 md:w-10 md:h-10 bg-stone-700 hover:bg-amber-700 rounded flex items-center justify-center text-amber-100  text-sm transition-colors"
              >
                &lt;
              </button>
              <span className="text-base md:text-lg  text-amber-100 w-20 md:w-24 text-center">
                {hairIndex === 0 ? "Bald" : `Style ${hairIndex}`}
              </span>
              <button
                onClick={() =>
                  setHairIndex((prev) => (prev < maxOptions ? prev + 1 : 0))
                }
                className="w-8 h-8 md:w-10 md:h-10 bg-stone-700 hover:bg-amber-700 rounded flex items-center justify-center text-amber-100 text-sm transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>

          {/* Szakáll stílus Control */}
          <div className="space-y-2">
            <label className="text-stone-300 uppercase tracking-wider text-sm md:text-base">
              Beard Style
            </label>
            <div className="flex items-center justify-between bg-stone-900 rounded-lg p-2 border border-stone-700">
              <button
                onClick={() =>
                  setBeardIndex((prev) => (prev > 0 ? prev - 1 : maxOptions))
                }
                className="w-8 h-8 md:w-10 md:h-10 bg-stone-700 hover:bg-amber-700 rounded flex items-center justify-center text-amber-100  text-sm transition-colors"
              >
                &lt;
              </button>
              <span className="text-base md:text-lg  text-amber-100 w-20 md:w-24 text-center">
                {beardIndex === 0 ? "Shaved" : `Style ${beardIndex}`}
              </span>
              <button
                onClick={() =>
                  setBeardIndex((prev) => (prev < maxOptions ? prev + 1 : 0))
                }
                className="w-8 h-8 md:w-10 md:h-10 bg-stone-700 hover:bg-amber-700 rounded flex items-center justify-center text-amber-100  text-sm transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>

          {/* Gombok - kompakt */}
          <div className="mt-4 md:mt-6 flex gap-3 md:gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex-1 py-2 md:py-3 bg-stone-600 hover:bg-stone-500 text-stone-100  rounded text-sm md:text-base uppercase border border-stone-500"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              className="flex-2 py-2 md:py-3 bg-green-700 hover:bg-green-600 text-white rounded text-sm md:text-base uppercase shadow-[0_3px_0_rgb(21,87,36)] md:shadow-[0_4px_0_rgb(21,87,36)] active:shadow-none active:translate-y-1 transition-all border-2 border-green-800"
            >
              Finish
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CharacterCreator;
