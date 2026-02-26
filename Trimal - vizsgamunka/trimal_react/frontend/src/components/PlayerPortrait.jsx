import React from 'react';

/**
 * Parses style ID from string forms (e.g. "hair_2" -> 2) or returns the number.
 */
export const parseStyleId = (val) => {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    const m = String(val).match(/(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
};

/**
 * Gets the correct species prefix for cosmetic assets
 */
export const getSpeciesPrefix = (className) => {
    if (className === 'Sapiens') return 'hs'; // Homo Sapiens
    if (className === 'Floresiensis') return 'f';
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
