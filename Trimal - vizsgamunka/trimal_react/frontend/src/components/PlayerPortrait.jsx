// ==========================================
// Fájl: Játékos Portré (Player Portrait)
// Cél: A karakter grafikus megjelenítése a kiválasztott faj, haj és szakáll alapján.
//
// A képrétegeket helyezi egymásra, így dinamikusan állítja össze a játékos avatárját.
// ==========================================
import React from 'react';

/**
 * A stílus ID-t a string formumból parses (pl. "hair_2" -> 2) vagy visszaadja a számot.
 */
export const parseStyleId = (val) => {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    // A stringben talált első számot kinyeri
    const m = String(val).match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
};

/**
 * A faj prefix-ét lekéri a kozmetikai asszettekhez.
 */
export const getSpeciesPrefix = (className) => {
    const c = (className || '').toLowerCase();
    if (c === 'sapiens' || c === 'homo sapiens') return 'hs';
    if (c === 'floresiensis') return 'f';
    return 'n'; // Neanderthal (default)
};

const PlayerPortrait = ({ className, hairStyle, beardStyle, classNameOverride = "" }) => {
    const prefix = getSpeciesPrefix(className);

    const parsedHair = parseStyleId(hairStyle);
    const parsedBeard = parseStyleId(beardStyle);

    return (
        <div className={`relative w-full h-full ${classNameOverride}`}>
            <img
                src={`/src/assets/design/character/base_character/${prefix}_base.png`}
                alt={`${className} Base`}
                className="absolute z-0 h-full w-auto object-contain bottom-0 left-0"
            />
            {parsedHair > 0 && (
                <img
                    src={`/src/assets/design/character/hair/${prefix}-hair-${parsedHair}.png`}
                    alt="Hair"
                    className="absolute z-10 h-full w-auto object-contain bottom-0 left-0"
                />
            )}
            {parsedBeard > 0 && (
                <img
                    src={`/src/assets/design/character/beard/${prefix}-beard-${parsedBeard}.png`}
                    alt="Beard"
                    className="absolute z-20 h-full w-auto object-contain bottom-0 left-0"
                />
            )}
        </div>
    );
};

export default PlayerPortrait;
