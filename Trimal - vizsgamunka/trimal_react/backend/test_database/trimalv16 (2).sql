-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Feb 27. 08:29
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `trimal`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `active_effect`
--

CREATE TABLE `active_effect` (
  `specie_id` int(11) NOT NULL,
  `buff_id` int(11) NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `effect_buff`
--

CREATE TABLE `effect_buff` (
  `effect_id` int(11) NOT NULL,
  `food_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `value` int(11) NOT NULL,
  `category` enum('buff','debuff') NOT NULL,
  `duration` int(11) NOT NULL,
  `iconPath` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `effect_buff`
--

INSERT INTO `effect_buff` (`effect_id`, `food_id`, `name`, `value`, `category`, `duration`, `iconPath`) VALUES
(9, NULL, 'Heal', 10, 'buff', 5400, ''),
(10, NULL, 'Resistance', 10, 'buff', 5400, ''),
(11, NULL, 'Luck', 10, 'buff', 5400, ''),
(12, NULL, 'Agility', 10, 'buff', 5400, ''),
(13, NULL, 'Strength', 10, 'buff', 5400, ''),
(14, NULL, 'Poison', 5, 'debuff', 0, 'poison_effect.gif'),
(15, NULL, 'Cold', 5, 'debuff', 0, 'ice_effect.gif'),
(16, NULL, 'Bleed', 5, 'debuff', 0, 'bleed_effect.gif');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `enemy`
--

CREATE TABLE `enemy` (
  `enemy_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `base_health` int(11) NOT NULL,
  `base_agility` int(11) NOT NULL DEFAULT 10,
  `base_strength` int(11) NOT NULL DEFAULT 10,
  `base_luck` int(11) NOT NULL DEFAULT 10,
  `base_resistance` int(11) NOT NULL,
  `iconPath` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `type` enum('poison','cold','bleed','none') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `enemy`
--

INSERT INTO `enemy` (`enemy_id`, `name`, `base_health`, `base_agility`, `base_strength`, `base_luck`, `base_resistance`, `iconPath`, `category`, `type`) VALUES
(1, 'Dark confiscator', 11, 11, 11, 11, 11, 'argentavis_magnificens_cover.png', 'Light', 'poison'),
(2, 'Cave dweller', 14, 14, 14, 14, 14, 'cave_lion_cover.png', 'Medium', 'bleed'),
(3, 'Giant horse', 17, 17, 17, 17, 17, 'chalicotherium_cover.png', 'Heavy', 'none'),
(4, 'White powder', 11, 11, 11, 11, 11, 'dire_wolf_cover.png', 'Light', 'none'),
(5, 'Furry me', 14, 14, 14, 14, 14, 'giant_ape_cover.png', 'Medium', 'none'),
(6, 'Walking rock', 14, 14, 14, 14, 14, 'glyptodon_cover.png', 'Medium', 'none'),
(7, 'Digger', 17, 17, 17, 17, 17, 'ground_sloth_cover.png', 'Heavy', 'none'),
(8, 'Confiscator', 11, 11, 11, 11, 11, 'haasts_eagle_cover.png', 'Light', 'bleed'),
(9, 'Treehead', 17, 17, 17, 17, 17, 'irish_elk_cover.png', 'Heavy', 'none'),
(10, 'Nose', 14, 14, 14, 14, 14, 'macrauchenia_cover.png', 'Medium', 'none'),
(11, 'Longbeak', 11, 11, 11, 11, 11, 'pelagornis_sandersi_cover.png', 'Light', 'bleed'),
(12, 'Plowmouth', 17, 17, 17, 17, 17, 'platybelodon_cover.png', 'Heavy', 'none'),
(13, 'Bigrat', 14, 14, 14, 14, 14, 'procoptodon_cover.png', 'Medium', 'none'),
(14, 'Tooth', 17, 17, 17, 17, 17, 'sabertooth_tiger_cover.png', 'Heavy', 'bleed'),
(15, 'Death', 17, 17, 17, 17, 17, 'shortface_bear_cover.png', 'Heavy', 'bleed'),
(16, 'Longneck', 14, 14, 14, 14, 14, 'sivatherium_cover.png', 'Medium', 'none'),
(17, 'Boulder', 17, 17, 17, 17, 17, 'steppe_bison_cover.png', 'Heavy', 'cold'),
(18, 'Running beak', 14, 14, 14, 14, 14, 'terrorbird_cover.png', 'Medium', 'bleed'),
(19, 'Rapid bite', 11, 11, 11, 11, 11, 'thylacoleo_cover.png', 'Light', 'bleed'),
(20, 'Green trunk', 14, 14, 14, 14, 14, 'titanboa_cover.png', 'Medium', 'poison'),
(21, 'Woolly tusk', 17, 17, 17, 17, 17, 'woolly_mammoth_cover.png', 'Heavy', 'cold'),
(22, 'Woolly boulder', 17, 17, 17, 17, 17, 'woolly_rhino_cover.png', 'Heavy', 'cold'),
(23, 'Short tusk', 17, 17, 17, 17, 17, 'deinotherium_cover.png', 'Heavy', 'none');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `environment`
--

CREATE TABLE `environment` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `iconPath` varchar(5000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `environment`
--

INSERT INTO `environment` (`id`, `name`, `description`, `iconPath`) VALUES
(1, 'Dense forest', 'A dense prehistoric forest where towering ancient trees block much of the sunlight. Early human tribes move carefully between massive roots, gathering berries and hunting small animals, while larger beasts roam deeper in the shadows. The air is heavy with mist, insects, and the constant sounds of unseen life.', 'forest_backgroundFULLHD.png'),
(2, 'Cold iceland', 'A harsh prehistoric land shaped by ice and fire. Vast glaciers stretch across the horizon, broken by volcanic rock and steaming ground. Early humans survive here through resilience and cooperation, hunting hardy animals that have adapted to the cold and using fire as their greatest ally.', 'iceland_backgroundFULLHD.png'),
(3, 'The jungle', 'A wild prehistoric jungle overflowing with life. Thick vegetation, giant ferns, and towering trees create a humid, dangerous environment. Early humans navigate this land cautiously, sharing it with powerful predators, colorful birds, and countless creatures hidden within the dense greenery.', 'jungle_backgroundFULLHD.png'),
(4, 'Stony mountain', 'A prehistoric mountain region with steep cliffs and narrow paths carved by time. Early humans settle near caves and high vantage points, watching herds move below. Large animals dominate the valleys, while strong winds and thin air test the limits of survival.', 'mountain_backgroundFULLHD.png'),
(5, 'Savannah', 'A vast prehistoric savannah stretching endlessly under the open sky. Tall grass waves in the wind as early human groups follow migrating herds. Powerful animals rule the plains, and survival depends on teamwork, observation, and the careful use of primitive tools.', 'savannah_backgroundFULLHD.png');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `inventory_backup`
--

CREATE TABLE `inventory_backup` (
  `specie_id` int(11) NOT NULL,
  `armor_id` int(11) NOT NULL,
  `weapon_id` int(11) NOT NULL,
  `misc_id` int(11) NOT NULL,
  `food_id` int(11) NOT NULL,
  `item_quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `item_armor`
--

CREATE TABLE `item_armor` (
  `item_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `rarity` varchar(100) NOT NULL,
  `armor_point` int(11) NOT NULL,
  `normal_currency_cost` int(11) NOT NULL,
  `spec_currency_cost` int(11) NOT NULL DEFAULT 0,
  `inventory_size` int(11) NOT NULL,
  `description` varchar(150) NOT NULL,
  `iconPath` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `item_armor`
--

INSERT INTO `item_armor` (`item_id`, `name`, `category`, `rarity`, `armor_point`, `normal_currency_cost`, `spec_currency_cost`, `inventory_size`, `description`, `iconPath`) VALUES
(1, 'Bone boots', 'Armor', 'Epic', 25, 295, 5, 10, 'Hard bone soles strapped over leather.', 'bone-boots.png'),
(2, 'Bone helmet', 'Armor', 'Epic', 25, 295, 5, 10, 'Dome of a long-dead neanderthal. Beware the oozing growls that seeps from the cracks on it.', 'bone-cap.png'),
(3, 'Bone leggings', 'Armor', 'Epic', 25, 295, 5, 10, 'Bone segments attached to leather guard the legs while making movement slower and louder.', 'bone-leggings.png'),
(4, 'Bone plate', 'Armor', 'Epic', 25, 295, 5, 10, 'Thorax of a giant hominid', 'bone-plate.png'),
(5, 'Leather boots', 'Armor', 'Common', 18, 155, 0, 10, 'Soft leather footwear wraps the feet to prevent cuts and reduce pain on rocky ground.', 'leather-boots.png'),
(6, 'Leather helmet', 'Armor', 'Common', 18, 155, 0, 10, 'A simple leather helmet stitched from cured hide to soften blows and protect the scalp from cold and branches.', 'leather-cap.png'),
(7, 'Leather leggings', 'Armor', 'Common', 18, 155, 0, 10, 'Thick leather leggings guard the legs from scratches, bites, and rough terrain during hunts.', 'leather-leggings.png'),
(8, 'Leather plate', 'Armor', 'Common', 18, 155, 0, 10, 'Layers of hardened animal hide cover the chest, offering basic protection without greatly limiting movement.', 'leather-plate.png'),
(9, 'Worn bone boots', 'Armor', 'Legendary', 28, 405, 10, 10, 'Soft leather footwear wraps the feet to prevent cuts and reduce pain on rocky ground.', 'legendary-boots.png'),
(10, 'Worn bone helmet', 'Armor', 'Legendary', 28, 405, 10, 10, 'A dome darkened by old blood marks long use in hunts and violent encounters.', 'legendary-cap.png'),
(11, 'Worn bone leggings', 'Armor', 'Legendary', 28, 405, 10, 10, 'Thick leather leggings guard the legs from scratches, bites, and rough terrain during hunts.', 'legendary-leggings.png'),
(12, 'Worn bone plate', 'Armor', 'Legendary', 28, 405, 10, 10, 'Bone thorax stained with dried blood signal a warrior who has survived many close fights.', 'legendary-plate.png'),
(13, 'Hardened wood boots', 'Armor', 'Rare', 22, 235, 0, 10, 'Leather shoes fitted with wooden parts increase durability and protection during long treks.', 'wood-boots.png'),
(14, 'Hardened wood helmet', 'Armor', 'Rare', 22, 235, 0, 10, 'Thin wooden slats sewn into leather help deflect strikes while keeping the head warm and stable.', 'wood-cap.png'),
(15, 'Hardened wood leggings', 'Armor', 'Rare', 22, 235, 0, 10, 'Leather pants reinforced along the thighs with wood to resist claws and sharp stones.', 'wood-leggings.png'),
(16, 'Hardened wood plate', 'Armor', 'Rare', 22, 235, 0, 10, 'A leather vest strengthened with wooden pieces provides improved defense against blunt impacts.', 'wood-plate.png');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `item_food`
--

CREATE TABLE `item_food` (
  `item_id` int(11) NOT NULL,
  `buff_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` enum('heal','strength','agility','luck','resistance') NOT NULL,
  `rarity` varchar(100) NOT NULL,
  `normal_currency_cost` int(11) NOT NULL,
  `spec_currency_cost` int(11) NOT NULL DEFAULT 0,
  `inventory_size` int(11) NOT NULL,
  `description` varchar(100) NOT NULL,
  `iconPath` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `item_food`
--

INSERT INTO `item_food` (`item_id`, `buff_id`, `name`, `category`, `rarity`, `normal_currency_cost`, `spec_currency_cost`, `inventory_size`, `description`, `iconPath`) VALUES
(1, 12, 'Coffee beans', 'agility', 'rare', 50, 0, 10, 'Small coffee beans, they are almost everywhere.', 'agility-s.png'),
(2, 12, 'Coffee beans with leaves', 'agility', 'epic', 80, 1, 10, 'Coffee beans with a leaf that the dedicated uses.', 'agility-m.png'),
(3, 12, 'Eye fruit', 'agility', 'legendary', 110, 5, 10, 'Strange eye like edible thing that gives you plenty energy', 'agility-l.png'),
(4, 13, 'Fire berries', 'strength', 'rare', 50, 0, 10, 'Little fire berry. Please do not eat them much, makes your belly hurt', 'strength-s.png'),
(5, 13, 'Pepper', 'strength', 'epic', 80, 1, 10, 'We have seen it at times, good for seasoning though.', 'strength-m.png'),
(6, 13, 'Ancient pepper', 'strength', 'legendary', 110, 5, 10, 'It looks ancient, wonder why it has a me on it.', 'strength-l.png'),
(7, 9, 'Apple and flower', 'heal', 'rare', 50, 0, 10, 'Apple and some flower, pretty delicious!', 'health-s.png'),
(8, 9, 'Orange one with white flower', 'heal', 'epic', 80, 1, 10, 'That orange one is bitter, but with that white flower it is bearable.', 'health-m.png'),
(9, 9, 'Rose-hips with ginger', 'heal', 'legendary', 110, 5, 10, 'One of them is similar to fire berries but the root like one is very bad, it burns my mouth', 'health-l.png'),
(10, 11, 'Ocean clam', 'luck', 'rare', 50, 0, 10, 'I liked to collect them in my younger me, they bring me luck.', 'luck-s.png'),
(11, 11, 'Tooth tooth', 'luck', 'epic', 80, 1, 10, 'That tooth is a bad omen for the animals because you get the former owners luck.', 'luck-m.png'),
(12, 11, 'Buxom figure', 'luck', 'legendary', 110, 5, 10, 'Bring me luck, O buxom me.', 'luck-l.png'),
(13, 10, 'Mead', 'resistance', 'epic', 800, 1, 10, 'I get dizzy when drinking too much of this, cannot feel anything though.', 'resistance-m.png');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `item_misc`
--

CREATE TABLE `item_misc` (
  `item_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `rarity` varchar(100) NOT NULL,
  `normal_currency_cost` int(11) NOT NULL,
  `inventory_size` int(11) NOT NULL,
  `description` varchar(100) NOT NULL,
  `iconPath` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `item_misc`
--

INSERT INTO `item_misc` (`item_id`, `name`, `category`, `rarity`, `normal_currency_cost`, `inventory_size`, `description`, `iconPath`) VALUES
(1, 'Pebble', 'Misc', 'Common', 20, 10, 'From a near riverbed', 'misc-common1.png'),
(2, 'Strange tooth', 'Misc', 'Common', 20, 10, 'It is everywhere in the settlement, some animals even die from it because they think that is edible', 'misc-common2.png'),
(3, 'Hatched egg', 'Misc', 'Rare', 30, 10, 'Hatched egg of a bird. It is in fact from a bigger one because us humans tend to eat smaller ones.', 'misc-rare1.png'),
(4, 'Shiny pebble', 'Misc', 'Rare', 30, 10, 'Shiny pebble found at rivers and ponds near caves with shiny stones inside it', 'misc-rare2.png'),
(5, 'Unhacted egg', 'Misc', 'Epic', 40, 10, 'Unhacted egg of a bigger bird. It is a rare occurance so it must be celebrated', 'misc-epic1.png'),
(6, 'Skull of an ungulate', 'Misc', 'Epic', 40, 10, 'These are a sight to be hold! Wonder why would someone leave it', 'misc-epic2.png'),
(7, 'Agni flower', 'Misc', 'Legendray', 50, 10, 'Unseen plant. Even the ones with dedication could not tell anything about it. It seems ancient.', 'misc-legendary1.png'),
(8, 'Ancient amber', 'Misc', 'Legendary', 50, 10, 'It is rock like but something has been stuck inside it. It has many legs and theres legs on his back', 'misc-legendary2.png');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `item_weapon`
--

CREATE TABLE `item_weapon` (
  `item_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `rarity` varchar(100) NOT NULL,
  `base_damage` int(11) NOT NULL,
  `normal_currency_cost` int(11) NOT NULL,
  `spec_currency_cost` int(11) NOT NULL DEFAULT 0,
  `inventory_size` int(11) NOT NULL,
  `description` varchar(100) NOT NULL,
  `iconPath` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `item_weapon`
--

INSERT INTO `item_weapon` (`item_id`, `name`, `category`, `rarity`, `base_damage`, `normal_currency_cost`, `spec_currency_cost`, `inventory_size`, `description`, `iconPath`) VALUES
(1, 'Wooden axe', 'Weapon', 'Common', 10, 100, 0, 10, 'A crude axe made from a root.', 'common_axe.png'),
(2, 'Wooden club', 'Weapon', 'Common', 10, 100, 0, 10, 'A heavy branch, knotted and hardened by fire, used for blunt force.', 'common_club.png'),
(3, 'Wooden knife', 'Weapon', 'Common', 10, 100, 0, 10, 'A sharp hard-wood stick, useful for cutting and skinning.', 'common_knife.png'),
(4, 'Wooden spear', 'Weapon', 'Common', 10, 100, 0, 10, 'A straight hard-wood branch for thrusting and hunting.', 'common_spear.png'),
(5, 'Sling', 'Weapon', 'Common', 10, 100, 0, 10, 'A simple leather pouch on cords for hurling stones at small prey.', 'common_throw.png'),
(6, 'Stone axe', 'Weapon', 'Rare', 15, 180, 0, 10, 'A polished stone head grooved and securely fixed to a sturdy haft.', 'rare_axe.png'),
(7, 'Augmented club', 'Weapon', 'Rare', 15, 180, 0, 10, 'A club studded with sharp bone fragments, increasing its tearing damage.', 'rare_club.png'),
(8, 'Stone knife', 'Weapon', 'Rare', 15, 180, 0, 10, 'Finely knapped flint blade with a good grip.', 'rare_knife.png'),
(9, 'Stone spear', 'Weapon', 'Rare', 15, 180, 0, 10, 'A spear tipped with a carefully flaked stone point, designed for penetration.', 'rare_spear.png'),
(10, 'Bow and arrow', 'Weapon', 'Rare', 15, 180, 0, 10, 'A simple wooden bow with bone-tipped arrows for hunting from a distance.', 'rare_throw.png'),
(11, 'Bone axe', 'Weapon', 'Epic', 20, 240, 4, 10, 'Axe head made out of an ungulate skull, lighter and sharper than stone.', 'epic_axe.png'),
(12, 'Bone club', 'Weapon', 'Epic', 20, 240, 4, 10, 'Made out of a femur from a mammoth, heavy and brutal, capable of crushing bone.', 'epic_club.png'),
(13, 'Bone knife', 'Weapon', 'Epic', 20, 240, 4, 10, 'Razor-sharp dagger made from a split femur.', 'epic_knife.png'),
(14, 'Bone spear', 'Weapon', 'Epic', 20, 240, 4, 10, 'Spear with a long, barbed point made from a straightened horn, fearsome in reach.', 'epic_spear.png'),
(15, 'Spear thrower', 'Weapon', 'Epic', 20, 240, 4, 10, 'A lever of wood that extends the arm, launching spears with great force.', 'epic_throw.png'),
(16, 'Worn axe', 'Weapon', 'Legendary', 25, 350, 8, 10, 'Ancient skull axe, stained dark from countless hunts, its edge unnaturally keen.', 'legendary_axe.png'),
(17, 'Worn club', 'Weapon', 'Legendary', 25, 350, 8, 10, 'A gore-caked wooden club, its surface permanently stained a deep, bloody brown.', 'legendary_club.png'),
(18, 'Worn knife', 'Weapon', 'Legendary', 25, 350, 8, 10, 'A femur dagger darkened by age and blood, its grip worn smooth by a generations grip.', 'legendary_knife.png'),
(19, 'Worn spear', 'Weapon', 'Legendary', 25, 350, 8, 10, 'This spear has tasted the life of many great beasts; its shaft is stiff with old blood.', 'legendary_spear.png'),
(20, 'Worn spear thrower', 'Weapon', 'Legendary', 25, 350, 8, 10, 'An spear thrower, stained dark from hands and sacrifice, humming with old power.', 'legendary_throw.png');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `quest`
--

CREATE TABLE `quest` (
  `quest_id` int(11) NOT NULL,
  `specie_id` int(11) DEFAULT NULL,
  `difficulty` varchar(100) NOT NULL,
  `currency` int(11) NOT NULL,
  `spec_currency` int(11) NOT NULL,
  `xp` int(100) NOT NULL,
  `description` varchar(200) NOT NULL,
  `stamina_cost` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `quest`
--

INSERT INTO `quest` (`quest_id`, `specie_id`, `difficulty`, `currency`, `spec_currency`, `xp`, `description`, `stamina_cost`) VALUES
(1, NULL, 'easy', 15, 0, 5, 'Gather edible mushrooms near the glowing caves. Watch for the blue caps.', 12),
(2, NULL, 'medium', 20, 2, 10, 'Hunt the striped saber-tooth near the sulfur springs. Its pelt resists acid.', 16),
(3, NULL, 'hard', 25, 4, 15, 'Retrieve fire-moss from the mammoth graveyard. The spores glow in darkness.', 25),
(4, NULL, 'easy', 15, 0, 5, 'Collect straight branches for spears from the twisted forest.', 12),
(5, NULL, 'medium', 20, 2, 10, 'Follow the three-horned deer tracks to the crystal river crossing.', 16),
(6, NULL, 'hard', 25, 4, 15, 'Defend the cave entrance from the cave hyenas at night.', 25),
(7, NULL, 'easy', 15, 0, 5, 'Find fresh water away from the bitter-tasting streams.', 12),
(8, NULL, 'medium', 20, 2, 10, 'Craft stone tools using the black rock from the lightning-struck ridge.', 16),
(9, NULL, 'hard', 25, 4, 15, 'Cross the ash desert to find the last stand of fruit trees.', 25),
(10, NULL, 'easy', 15, 0, 5, 'Gather feathers from the flightless birds in the valley.', 12),
(11, NULL, 'medium', 20, 2, 10, 'Trade with the other clans at the great rock meeting place.', 16),
(12, NULL, 'hard', 25, 4, 15, 'Hunt the woolly rhino in the frozen marshes before sunset.', 25),
(13, NULL, 'easy', 15, 0, 5, 'Collect medicinal herbs that grow where the ground is warm.', 12),
(14, NULL, 'medium', 20, 2, 10, 'Scout the southern cliffs for new cave shelter possibilities.', 16),
(15, NULL, 'hard', 25, 4, 15, 'Retrieve eggs from the giant terror bird nest on the plateau.', 25),
(16, NULL, 'easy', 15, 0, 5, 'Dry meat strips for the coming cold days.', 12),
(17, NULL, 'medium', 20, 2, 10, 'Find the source of the strange lights in the eastern caves.', 16),
(18, NULL, 'hard', 25, 4, 15, 'Drive the short-faced bears away from the sacred hot springs.', 25),
(19, NULL, 'easy', 15, 0, 5, 'Weave strong ropes from the swamp vines.', 12),
(20, NULL, 'medium', 20, 2, 10, 'Map the safe paths through the predator-filled grasslands.', 16),
(21, NULL, 'hard', 25, 4, 15, 'Survive one night alone in the whispering forest.', 25),
(22, NULL, 'easy', 15, 0, 5, 'Collect colorful stones for trade and decoration.', 12),
(23, NULL, 'medium', 20, 2, 10, 'Fish in the rapid river where the giant otters hunt.', 16),
(24, NULL, 'hard', 25, 4, 15, 'Steal fire from the rival clan camp under the full moon.', 25),
(25, NULL, 'easy', 15, 0, 5, 'Gather tinder and dry kindling for the eternal fire.', 12),
(26, NULL, 'medium', 20, 2, 10, 'Learn to make the poison for hunting darts from the red frogs.', 16),
(27, NULL, 'hard', 25, 4, 15, 'Climb the smoke mountain to see what new lands exist.', 25),
(28, NULL, 'easy', 15, 0, 5, 'Train the young wolf pups to help with hunting.', 12),
(29, NULL, 'medium', 20, 2, 10, 'Purify the water at the tainted lake using special stones.', 16),
(30, NULL, 'hard', 25, 4, 15, 'Face the spirit beast that haunts the old burial grounds.', 25);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `shop_backup`
--

CREATE TABLE `shop_backup` (
  `id` int(11) NOT NULL DEFAULT 0,
  `specie_id` int(11) NOT NULL,
  `armor_id` int(11) NOT NULL,
  `weapon_id` int(11) NOT NULL,
  `misc_id` int(11) NOT NULL,
  `food_id` int(11) NOT NULL,
  `spec_currency_cost` int(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `specie`
--

CREATE TABLE `specie` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `quest_id` int(11) DEFAULT NULL,
  `specie_name` enum('Neanderthal','Sapiens','Floresiensis') NOT NULL,
  `lvl` int(11) DEFAULT 1 CHECK (`lvl` >= 1),
  `xp` int(11) DEFAULT 0 CHECK (`xp` >= 0),
  `stamina` int(11) DEFAULT 100 CHECK (`stamina` >= 0),
  `base_health` int(11) DEFAULT 10 CHECK (`base_health` >= 0),
  `base_strength` int(11) DEFAULT 10 CHECK (`base_strength` >= 0),
  `base_agility` int(11) DEFAULT 10 CHECK (`base_agility` >= 0),
  `base_luck` int(11) DEFAULT 10 CHECK (`base_luck` >= 0),
  `base_resistance` int(11) DEFAULT 10 CHECK (`base_resistance` >= 0),
  `base_armor` int(11) DEFAULT 0 CHECK (`base_armor` >= 0),
  `inventory_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{"capacity":100,"used":0,"currency":{"normal":0,"spec":0},"items":[],"equipped":{"weapon":null,"armor_cap":null,"armor_plate":null,"armor_leggings":null,"armor_boots":null}}' CHECK (json_valid(`inventory_json`)),
  `hair_style` varchar(100) DEFAULT NULL,
  `beard_style` varchar(100) DEFAULT NULL,
  `quest_1` int(11) DEFAULT NULL,
  `quest_2` int(11) DEFAULT NULL,
  `quest_3` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `specie`
--

INSERT INTO `specie` (`id`, `user_id`, `quest_id`, `specie_name`, `lvl`, `xp`, `stamina`, `base_health`, `base_strength`, `base_agility`, `base_luck`, `base_resistance`, `base_armor`, `inventory_json`, `hair_style`, `beard_style`, `quest_1`, `quest_2`, `quest_3`, `created_at`, `updated_at`) VALUES
(1, 6, NULL, 'Neanderthal', 1, 0, 100, 5, 5, 5, 5, 5, 0, '{\"capacity\": 200, \"used\": 4, \"currency\": {\"normal\": 0, \"spec\": 0}, \"items\": [{\"id\": 1, \"type\": \"weapon\", \"name\": \"Stone Axe\", \"rarity\": \"Common\", \"quantity\": 1, \"description\": \"A polished stone head grooved and securely fixed to a sturdy haft.\", \"iconPath\": \"rare_axe.png\"}], \"equipped\": {\"weapon\": 1, \"armor_cap\": \"null\", \"armor_plate\": \"null\", \"armor_leggings\": \"null\", \"armor_boots\": \"null\"}}', 'n-hair-5', 'n-beard-3', NULL, NULL, NULL, '2026-02-03 18:41:24', '2026-02-27 06:59:55'),
(2, 7, NULL, 'Sapiens', 1, 0, 100, 5, 5, 5, 5, 5, 0, '{\"capacity\": 200, \"used\": 2, \"currency\": {\"normal\": 0, \"spec\": 0}, \"items\": [{\"id\": 3, \"type\": \"food\", \"name\": \"Eye fruit\", \"category\": \"agility\", \"rarity\": \"legendary\", \"quantity\": 1, \"description\": \"Strange eye like edible thing that gives you plenty energy\", \"iconPath\": \"agility-l.png\", \"buff_id\": 12}, {\"id\": 2, \"type\": \"weapon\", \"name\": \"Wooden club\", \"rarity\": \"Common\", \"quantity\": 1, \"description\": \"A heavy branch, knotted and hardened by fire, used for blunt force.\", \"iconPath\": \"common_club.png\", \"base_damage\": 10}], \"equipped\": {\"weapon\": 2, \"armor_cap\": \"null\", \"armor_plate\": \"null\", \"armor_leggings\": \"null\", \"armor_boots\": \"null\"}}', NULL, 'hs-beard-4', NULL, NULL, NULL, '2026-02-03 19:00:02', '2026-02-27 06:59:55'),
(3, 8, NULL, 'Floresiensis', 1, 0, 100, 5, 5, 5, 5, 5, 0, '{\"capacity\": 200, \"used\": 0, \"currency\": {\"normal\": 0, \"spec\": 0}, \"items\": [], \"equipped\": {\"weapon\": null, \"armor_cap\": \"null\", \"armor_plate\": \"null\", \"armor_leggings\": \"null\", \"armor_boots\": \"null\"}}', 'f-hair-3', 'f-beard-3', NULL, NULL, NULL, '2026-02-03 19:04:54', '2026-02-27 06:59:55'),
(4, 9, NULL, 'Floresiensis', 1, 0, 100, 5, 5, 5, 5, 5, 0, '{\"capacity\": 200, \"used\": 0, \"currency\": {\"normal\": 0, \"spec\": 0}, \"items\": [], \"equipped\": {\"weapon\": null, \"armor_cap\": \"null\", \"armor_plate\": \"null\", \"armor_leggings\": \"null\", \"armor_boots\": \"null\"}}', 'f-hair-4', 'f-beard-3', NULL, NULL, NULL, '2026-02-03 19:07:01', '2026-02-27 06:59:55'),
(5, 10, NULL, 'Neanderthal', 1, 0, 100, 5, 5, 5, 5, 5, 0, '{\"capacity\": 200, \"used\": 5, \"currency\": {\"normal\": 100, \"spec\": 5}, \"items\": [{\"id\": 9, \"type\": \"food\", \"name\": \"Rose-hips with ginger\", \"category\": \"heal\", \"rarity\": \"legendary\", \"quantity\": 1, \"description\": \"One of them is similar to fire berries but the root like one is very bad, it burns my mouth\", \"iconPath\": \"health-l.png\", \"buff_id\": 9}, {\"id\": 3, \"type\": \"food\", \"name\": \"Eye fruit\", \"category\": \"agility\", \"rarity\": \"legendary\", \"quantity\": 1, \"description\": \"Strange eye like edible thing that gives you plenty energy\", \"iconPath\": \"agility-l.png\", \"buff_id\": 12}, {\"id\": 5, \"type\": \"misc\", \"name\": \"Unhacted egg\", \"category\": \"Misc\", \"rarity\": \"Epic\", \"quantity\": 1, \"description\": \"Unhacted egg of a bigger bird. It is a rare occurance so it must be celebrated\", \"iconPath\": \"misc-epic1.png\"}, {\"id\": 7, \"type\": \"misc\", \"name\": \"Agni flower\", \"category\": \"Misc\", \"rarity\": \"Legendray\", \"quantity\": 1, \"description\": \"Unseen plant. Even the ones with dedication could not tell anything about it. It seems ancient.\", \"iconPath\": \"misc-legendary1.png\"}, {\"id\": 10, \"type\": \"weapon\", \"name\": \"Bow and arrow\", \"category\": \"Weapon\", \"rarity\": \"Rare\", \"quantity\": 1, \"description\": \"A simple wooden bow with bone-tipped arrows for hunting from a distance.\", \"iconPath\": \"rare_throw.png\", \"base_damage\": 15}], \"equipped\": {\"weapon\": {\"id\": 20, \"type\": \"weapon\", \"name\": \"Worn spear thrower\", \"category\": \"Weapon\", \"rarity\": \"Legendary\", \"quantity\": 1, \"description\": \"An spear thrower, stained dark from hands and sacrifice, humming with old power.\", \"iconPath\": \"legendary_throw.png\", \"base_damage\": 25}, \"armor_cap\": {\"id\": 2, \"type\": \"armor\", \"name\": \"Bone helmet\", \"category\": \"Armor\", \"rarity\": \"Epic\", \"quantity\": 1, \"description\": \"Dome of a long-dead neanderthal. Beware the oozing growls that seeps from the cracks on it.\", \"iconPath\": \"bone-cap.png\", \"armor_point\": 25}, \"armor_plate\": {\"id\": 8, \"type\": \"armor\", \"name\": \"Leather plate\", \"category\": \"Armor\", \"rarity\": \"Common\", \"quantity\": 1, \"description\": \"Layers of hardened animal hide cover the chest, offering basic protection without greatly limiting movement.\", \"iconPath\": \"leather-plate.png\", \"armor_point\": 18}, \"armor_leggings\": {\"id\": 15, \"type\": \"armor\", \"name\": \"Hardened wood leggings\", \"category\": \"Armor\", \"rarity\": \"Rare\", \"quantity\": 1, \"description\": \"Leather pants reinforced along the thighs with wood to resist claws and sharp stones.\", \"iconPath\": \"wood-leggings.png\", \"armor_point\": 22}, \"armor_boots\": {\"id\": 1, \"type\": \"armor\", \"name\": \"Bone boots\", \"category\": \"Armor\", \"rarity\": \"Epic\", \"quantity\": 1, \"description\": \"Hard bone soles strapped over leather.\", \"iconPath\": \"bone-boots.png\", \"armor_point\": 25}}}', 'hs_hair_2', 'hs_beard_2', 13, 26, 9, '2026-02-03 19:17:53', '2026-02-27 06:59:55');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `specie_backup`
--

CREATE TABLE `specie_backup` (
  `id` int(11) NOT NULL DEFAULT 0,
  `user_id` int(11) NOT NULL,
  `shop_id` int(11) DEFAULT NULL,
  `quest_id` int(11) DEFAULT NULL,
  `specie_name` enum('Neanderthal','Sapiens','Floresiensis') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lvl` int(11) DEFAULT 1 CHECK (`lvl` >= 1),
  `xp` int(11) DEFAULT 0 CHECK (`xp` >= 0),
  `stamina` int(11) DEFAULT 100 CHECK (`stamina` >= 0),
  `base_health` int(11) DEFAULT 10 CHECK (`base_health` >= 0),
  `base_strength` int(11) DEFAULT 10 CHECK (`base_strength` >= 0),
  `base_agility` int(11) DEFAULT 10 CHECK (`base_agility` >= 0),
  `base_luck` int(11) DEFAULT 10 CHECK (`base_luck` >= 0),
  `base_resistance` int(11) DEFAULT 10 CHECK (`base_resistance` >= 0),
  `base_armor` int(11) DEFAULT 0 CHECK (`base_armor` >= 0),
  `hair_style` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `beard_style` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inventory_capacity` int(11) DEFAULT 100 CHECK (`inventory_capacity` >= 0),
  `inventory_state` int(11) DEFAULT 0 CHECK (`inventory_state` >= 0),
  `slot_weapon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slot_armor_1` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slot_armor_2` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slot_armor_3` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slot_armor_4` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quest_1` int(11) DEFAULT NULL,
  `quest_2` int(11) DEFAULT NULL,
  `quest_3` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `specie_backup`
--

INSERT INTO `specie_backup` (`id`, `user_id`, `shop_id`, `quest_id`, `specie_name`, `lvl`, `xp`, `stamina`, `base_health`, `base_strength`, `base_agility`, `base_luck`, `base_resistance`, `base_armor`, `hair_style`, `beard_style`, `inventory_capacity`, `inventory_state`, `slot_weapon`, `slot_armor_1`, `slot_armor_2`, `slot_armor_3`, `slot_armor_4`, `quest_1`, `quest_2`, `quest_3`, `created_at`, `updated_at`) VALUES
(1, 6, NULL, NULL, 'Neanderthal', 1, 0, 100, 10, 10, 10, 10, 10, 0, 'n-hair-5', 'n-beard-3', 100, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-03 18:41:24', '2026-02-03 18:41:24'),
(2, 7, NULL, NULL, 'Sapiens', 1, 0, 100, 10, 10, 10, 10, 10, 0, NULL, 'hs-beard-4', 100, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-03 19:00:02', '2026-02-03 19:00:02'),
(3, 8, NULL, NULL, 'Floresiensis', 1, 0, 100, 10, 10, 10, 10, 10, 0, 'f-hair-3', 'f-beard-3', 100, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-03 19:04:54', '2026-02-03 19:04:54'),
(4, 9, NULL, NULL, 'Floresiensis', 1, 0, 100, 10, 10, 10, 10, 10, 0, 'f-hair-4', 'f-beard-3', 100, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-03 19:07:01', '2026-02-03 19:07:01'),
(5, 10, NULL, NULL, 'Neanderthal', 1, 0, 100, 10, 10, 10, 10, 10, 0, NULL, NULL, 100, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-03 19:17:53', '2026-02-03 19:17:53');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `specie_id` int(11) DEFAULT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `salt` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `nickname` varchar(20) NOT NULL,
  `last_login` date NOT NULL,
  `status` tinyint(1) NOT NULL,
  `currency` int(6) NOT NULL,
  `spec_currency` int(6) NOT NULL,
  `description` text NOT NULL,
  `verification_token` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `user`
--

INSERT INTO `user` (`id`, `specie_id`, `email`, `password`, `salt`, `nickname`, `last_login`, `status`, `currency`, `spec_currency`, `description`, `verification_token`, `is_verified`) VALUES
(6, 1, 'csege0306@gmail.com', '$2b$10$x7T5unm0QVs9sn3OmCMgsemQ3dNQiE3PBph/Kxs9NY/Vrq3GD2Eiy', '$2b$10$x7T5unm0QVs9sn3OmCMgse', 'csegefekete1', '2026-02-03', 1, 0, 0, '', '2424af9166ab360ac876e1e4c2a01f8a946778e9beed2e1004333d6c9d03592a', 0),
(7, 2, 'kezdodikk50@gmail.com', '$2b$10$IqwUAD62v6ozmztp15lXceUgkKVO0CDWjydnc4aZFYIjaOIOdItwS', '$2b$10$IqwUAD62v6ozmztp15lXce', 'csigabiga23', '2026-02-03', 1, 0, 0, '', '19a19218611ba2becf201130b55a7e054cc386e612958fcda3a60799d21b8184', 0),
(8, 3, 'ezustjanos3@gmail.com', '$2b$10$JLckiRZ1CvA/H/Irg.ItKeNkTpwKjqT15FHf/WjJkcs1pt1R0bzdS', '$2b$10$JLckiRZ1CvA/H/Irg.ItKe', 'silverjohn123', '2026-02-03', 1, 0, 0, '', '68eb2c7a557b523703e4ac23ac73edcd5d5a6fbee373ec41d13b2e60baf7db15', 0),
(9, 4, 'janesco897@gmail.com', '$2b$10$jkXNGOjlg.mkH8EqjjWUuOfKiEAEZew9EalbxgzDT9JI1hL36lrXi', '$2b$10$jkXNGOjlg.mkH8EqjjWUuO', 'kukucskajoska1111', '2026-02-03', 1, 0, 0, '', 'ff8837e2981ffcae37b7b5f3a4121eff1567099ea20516a0c0848c06cd41be5b', 0),
(10, 5, 'feketecsegeistvan-40257@taszi.hu', '$2b$10$RC8i1dQ1aK8AZI4lYWv3OOmdNJJJ.9F8rnG85UaEk5I4UnSr89.pu', '$2b$10$RC8i1dQ1aK8AZI4lYWv3OO', 'gipszjakab55', '2026-02-26', 1, 0, 0, '', NULL, 1);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `active_effect`
--
ALTER TABLE `active_effect`
  ADD PRIMARY KEY (`specie_id`,`buff_id`) USING BTREE,
  ADD KEY `buff_id` (`buff_id`);

--
-- A tábla indexei `effect_buff`
--
ALTER TABLE `effect_buff`
  ADD PRIMARY KEY (`effect_id`),
  ADD KEY `food_id` (`food_id`);

--
-- A tábla indexei `enemy`
--
ALTER TABLE `enemy`
  ADD PRIMARY KEY (`enemy_id`);

--
-- A tábla indexei `environment`
--
ALTER TABLE `environment`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `item_armor`
--
ALTER TABLE `item_armor`
  ADD PRIMARY KEY (`item_id`);

--
-- A tábla indexei `item_food`
--
ALTER TABLE `item_food`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `buff_id` (`buff_id`);

--
-- A tábla indexei `item_misc`
--
ALTER TABLE `item_misc`
  ADD PRIMARY KEY (`item_id`);

--
-- A tábla indexei `item_weapon`
--
ALTER TABLE `item_weapon`
  ADD PRIMARY KEY (`item_id`);

--
-- A tábla indexei `quest`
--
ALTER TABLE `quest`
  ADD PRIMARY KEY (`quest_id`),
  ADD KEY `specie_id` (`specie_id`);

--
-- A tábla indexei `specie`
--
ALTER TABLE `specie`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_specie_name` (`specie_name`),
  ADD KEY `idx_lvl` (`lvl`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `quest_id` (`quest_id`);

--
-- A tábla indexei `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `specie_id` (`specie_id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `effect_buff`
--
ALTER TABLE `effect_buff`
  MODIFY `effect_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT a táblához `enemy`
--
ALTER TABLE `enemy`
  MODIFY `enemy_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT a táblához `environment`
--
ALTER TABLE `environment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT a táblához `item_armor`
--
ALTER TABLE `item_armor`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT a táblához `item_food`
--
ALTER TABLE `item_food`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT a táblához `item_misc`
--
ALTER TABLE `item_misc`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT a táblához `item_weapon`
--
ALTER TABLE `item_weapon`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT a táblához `quest`
--
ALTER TABLE `quest`
  MODIFY `quest_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT a táblához `specie`
--
ALTER TABLE `specie`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT a táblához `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `active_effect`
--
ALTER TABLE `active_effect`
  ADD CONSTRAINT `active_effect_ibfk_1` FOREIGN KEY (`buff_id`) REFERENCES `effect_buff` (`effect_id`),
  ADD CONSTRAINT `active_effect_ibfk_3` FOREIGN KEY (`specie_id`) REFERENCES `specie` (`id`);

--
-- Megkötések a táblához `effect_buff`
--
ALTER TABLE `effect_buff`
  ADD CONSTRAINT `effect_buff_ibfk_1` FOREIGN KEY (`food_id`) REFERENCES `item_food` (`item_id`);

--
-- Megkötések a táblához `item_food`
--
ALTER TABLE `item_food`
  ADD CONSTRAINT `item_food_ibfk_2` FOREIGN KEY (`buff_id`) REFERENCES `effect_buff` (`effect_id`);

--
-- Megkötések a táblához `quest`
--
ALTER TABLE `quest`
  ADD CONSTRAINT `quest_ibfk_1` FOREIGN KEY (`specie_id`) REFERENCES `specie` (`id`);

--
-- Megkötések a táblához `specie`
--
ALTER TABLE `specie`
  ADD CONSTRAINT `specie_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `specie_ibfk_3` FOREIGN KEY (`quest_id`) REFERENCES `quest` (`quest_id`);

--
-- Megkötések a táblához `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `user_ibfk_1` FOREIGN KEY (`specie_id`) REFERENCES `specie` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
