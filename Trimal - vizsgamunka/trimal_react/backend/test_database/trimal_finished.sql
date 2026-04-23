-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Ápr 23. 13:24
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

--
-- A tábla adatainak kiíratása `active_effect`
--

INSERT INTO `active_effect` (`specie_id`, `buff_id`, `start_date`) VALUES
(5, 9, '2026-04-11 23:52:56'),
(5, 11, '2026-04-18 00:33:20'),
(5, 13, '2026-04-12 01:07:22'),
(10, 13, '2026-04-20 20:39:08');

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
  `description` varchar(500) NOT NULL,
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

INSERT INTO `enemy` (`enemy_id`, `name`, `description`, `base_health`, `base_agility`, `base_strength`, `base_luck`, `base_resistance`, `iconPath`, `category`, `type`) VALUES
(1, 'Dark confiscator', 'Me saw this giant bird. Bigger than me, much bigger. Wings like a shadow. Other me tried to throw a spear. Bird took the spear and flew away. Me just ran.', 11, 11, 11, 11, 11, 'argentavis_magnificens_cover.png', 'Light', 'poison'),
(2, 'Cave dweller', 'Big cat. Lives in caves. Yellow eyes in the dark. Me went into a cave once. Never again. Other me went in twice. Other me is stupid.', 14, 14, 14, 14, 14, 'cave_lion_cover.png', 'Medium', 'bleed'),
(3, 'Giant horse', 'Looks like a horse but has claws like a bear. Me thought it was friendly. It was not friendly. Kicked me and scratched me. Same time.', 16, 16, 16, 16, 16, 'chalicotherium_cover.png', 'Heavy', 'none'),
(4, 'White powder', 'Wolf but bigger. White fur, red eyes. Pack hunter. Me saw five of them staring. Me ran. Other me ran faster. Good for other me.', 11, 11, 11, 11, 11, 'dire_wolf_cover.png', 'Light', 'none'),
(5, 'Furry me', 'Big monkey. Bigger than me, hairier than me. Me threw a rock at it. It threw a whole branch back. Me respects that but also fears it.', 14, 14, 14, 14, 14, 'giant_ape_cover.png', 'Medium', 'none'),
(6, 'Walking rock', 'Turtle but huge. Big dome shell like a rock on legs. Me hit it with an axe. Axe broke. Me cried a little. It just looked at me.', 14, 14, 14, 14, 14, 'glyptodon_cover.png', 'Medium', 'none'),
(7, 'Digger', 'Big slow bear with long claws. Digs holes bigger than me. Me fell in one hole. Other me laughed. Other me fell in the next hole. Not laughing now.', 16, 16, 16, 16, 16, 'ground_sloth_cover.png', 'Heavy', 'none'),
(8, 'Confiscator', 'Biggest bird that flies. Picks up deer. Picks up me if me not careful. Me stays under trees now. Trees are my friend.', 11, 11, 11, 11, 11, 'haasts_eagle_cover.png', 'Light', 'bleed'),
(9, 'Treehead', 'Big horse. Huge antlers like a whole tree on its head. Me tried to hide behind a bush. Bush was too small. It saw me. I ran.', 16, 16, 16, 16, 16, 'irish_elk_cover.png', 'Heavy', 'none'),
(10, 'Nose', 'Strange animal. Long nose like a snake but on a horse body. Me laughed at its face. It kicked my butt. Me stopped laughing forever.', 14, 14, 14, 14, 14, 'macrauchenia_cover.png', 'Medium', 'none'),
(11, 'Longbeak', 'Big bird. Beak long and sharp with bumps like teeth. Me saw it swallow a fish whole. Me is made of meat. Me did not stay to find out.', 11, 11, 11, 11, 11, 'pelagornis_sandersi_cover.png', 'Light', 'bleed'),
(12, 'Plowmouth', 'Strange tusk but mouth flat like a shovel. Digs mud. Digs plants. Could dig me. Me stays on high ground now.', 16, 16, 16, 16, 16, 'platybelodon_cover.png', 'Heavy', 'none'),
(13, 'Bigrat', 'Giant rat. Hops higher than my head. Punches harder than my face. Me lost two teeth. Not from the Tooth enemy. From this one.', 14, 14, 14, 14, 14, 'procoptodon_cover.png', 'Medium', 'none'),
(14, 'Tooth', 'Big cat with two long teeth like daggers coming from its mouth. Me saw it once. Once was enough. Other me wanted to fight it. Other me is dead now.', 16, 16, 16, 16, 16, 'sabertooth_tiger_cover.png', 'Heavy', 'bleed'),
(15, 'Death', 'Giant bear. Biggest me ever seen. They call it Death because nothing survives. Me calls it \"nope\". Other me called it once. He did not call anything after.', 16, 16, 16, 16, 16, 'shortface_bear_cover.png', 'Heavy', 'bleed'),
(16, 'Longneck', 'Strange long neck animal with four horns and thick neck. Looks weird. Hits like a rock. Me got hit. Me saw stars.', 14, 14, 14, 14, 14, 'sivatherium_cover.png', 'Medium', 'none'),
(17, 'Boulder', 'Big hairy cow with thick fur. Lives in cold. Me touched it once. My finger froze. Other me licked it. His tongue stuck.', 16, 16, 16, 16, 16, 'steppe_bison_cover.png', 'Heavy', 'cold'),
(18, 'Running beak', 'Big angry bird that runs fast. No fly, only run and peck. Me outran it... barely. Other me tripped. Other me is missing an ear now.', 14, 14, 14, 14, 14, 'terrorbird_cover.png', 'Medium', 'bleed'),
(19, 'Rapid bite', 'Cat with sharp teeth. Bites very fast. Me blinked and already had three new holes in my leg. Blood everywhere.', 11, 11, 11, 11, 11, 'thylacoleo_cover.png', 'Light', 'bleed'),
(20, 'Green trunk', 'Big fish. Green like leaves. Me didn\'t see it. That\'s how me got bitten. Felt sick for a week. Other me threw up for two weeks.', 14, 14, 14, 14, 14, 'titanboa_cover.png', 'Medium', 'poison'),
(21, 'Woolly tusk', 'Big hairy elephant with long curved tusks. Lives in snow. Me tried to hide behind a rock. Rock was smaller than its toe.', 16, 16, 16, 16, 16, 'woolly_mammoth_cover.png', 'Heavy', 'cold'),
(22, 'Woolly boulder', 'Hairy boulder. Big horn on nose. Big temper. Me hid in a cave. It tried to dig me out with its horn. Cave almost fell.', 16, 16, 16, 16, 16, 'woolly_rhino_cover.png', 'Heavy', 'cold'),
(23, 'Short tusk', 'Tusk but with short tusks pointing down. Looks funny. Me laughed once. Then it charged. Me ran faster than ever before. Not funny anymore.', 16, 16, 16, 16, 16, 'deinotherium_cover.png', 'Heavy', 'none');

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
  `spec_currency_cost` int(10) DEFAULT NULL,
  `inventory_size` int(11) NOT NULL,
  `description` varchar(100) NOT NULL,
  `iconPath` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `item_misc`
--

INSERT INTO `item_misc` (`item_id`, `name`, `category`, `rarity`, `normal_currency_cost`, `spec_currency_cost`, `inventory_size`, `description`, `iconPath`) VALUES
(1, 'Pebble', 'Misc', 'Common', 20, NULL, 10, 'From a near riverbed', 'misc-common1.png'),
(2, 'Strange tooth', 'Misc', 'Common', 20, NULL, 10, 'It is everywhere in the settlement, some animals even die from it because they think that is edible', 'misc-common2.png'),
(3, 'Hatched egg', 'Misc', 'Rare', 30, NULL, 10, 'Hatched egg of a bird. It is in fact from a bigger one because us humans tend to eat smaller ones.', 'misc-rare1.png'),
(4, 'Shiny pebble', 'Misc', 'Rare', 30, NULL, 10, 'Shiny pebble found at rivers and ponds near caves with shiny stones inside it', 'misc-rare2.png'),
(5, 'Unhacted egg', 'Misc', 'Epic', 40, 1, 10, 'Unhacted egg of a bigger bird. It is a rare occurance so it must be celebrated', 'misc-epic1.png'),
(6, 'Skull of an ungulate', 'Misc', 'Epic', 40, 1, 10, 'These are a sight to be hold! Wonder why would someone leave it', 'misc-epic2.png'),
(7, 'Agni flower', 'Misc', 'Legendary', 50, 3, 10, 'Unseen plant. Even the ones with dedication could not tell anything about it. It seems ancient.', 'misc-legendary1.png'),
(8, 'Ancient amber', 'Misc', 'Legendary', 50, 3, 10, 'It is rock like but something has been stuck inside it. It has many legs and theres legs on his back', 'misc-legendary2.png'),
(9, 'Dungeon script from long-ago', 'Misc', 'Legendary', 50, 3, 10, 'Script older than me and other me\'s from the past. Contains truth that some could not fathom', 'dungeon_script.png');

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
-- Tábla szerkezet ehhez a táblához `shop`
--

CREATE TABLE `shop` (
  `id` int(11) NOT NULL,
  `specie_id` int(11) NOT NULL,
  `shop_type` enum('tinkerer','herbalist') NOT NULL,
  `item_type` enum('weapon','armor','food','misc') NOT NULL,
  `item_id` int(11) NOT NULL,
  `created_date` date NOT NULL,
  `purchased` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `shop`
--

INSERT INTO `shop` (`id`, `specie_id`, `shop_type`, `item_type`, `item_id`, `created_date`, `purchased`) VALUES
(1, 5, 'tinkerer', 'weapon', 12, '2026-03-12', 0),
(2, 5, 'tinkerer', 'weapon', 17, '2026-03-12', 0),
(3, 5, 'tinkerer', 'weapon', 6, '2026-03-12', 0),
(4, 5, 'tinkerer', 'armor', 16, '2026-03-12', 0),
(5, 5, 'tinkerer', 'armor', 12, '2026-03-12', 0),
(6, 5, 'tinkerer', 'armor', 12, '2026-03-12', 0),
(7, 5, 'herbalist', 'food', 2, '2026-03-12', 0),
(8, 5, 'herbalist', 'food', 1, '2026-03-12', 0),
(9, 5, 'herbalist', 'food', 10, '2026-03-12', 0),
(10, 5, 'herbalist', 'food', 11, '2026-03-12', 0),
(11, 5, 'herbalist', 'food', 8, '2026-03-12', 0),
(12, 5, 'herbalist', 'food', 13, '2026-03-12', 0),
(13, 5, 'tinkerer', 'weapon', 7, '2026-03-19', 0),
(14, 5, 'tinkerer', 'weapon', 1, '2026-03-19', 0),
(15, 5, 'tinkerer', 'weapon', 15, '2026-03-19', 0),
(16, 5, 'tinkerer', 'armor', 7, '2026-03-19', 0),
(17, 5, 'tinkerer', 'armor', 2, '2026-03-19', 0),
(18, 5, 'tinkerer', 'armor', 8, '2026-03-19', 0),
(19, 5, 'herbalist', 'food', 10, '2026-03-19', 0),
(20, 5, 'herbalist', 'food', 2, '2026-03-19', 0),
(21, 5, 'herbalist', 'food', 7, '2026-03-19', 0),
(22, 5, 'herbalist', 'food', 2, '2026-03-19', 0),
(23, 5, 'herbalist', 'food', 1, '2026-03-19', 0),
(24, 5, 'herbalist', 'food', 4, '2026-03-19', 0),
(25, 5, 'tinkerer', 'weapon', 17, '2026-03-20', 0),
(26, 5, 'tinkerer', 'weapon', 6, '2026-03-20', 0),
(27, 5, 'tinkerer', 'weapon', 8, '2026-03-20', 0),
(28, 5, 'tinkerer', 'armor', 11, '2026-03-20', 0),
(29, 5, 'tinkerer', 'armor', 15, '2026-03-20', 0),
(30, 5, 'tinkerer', 'armor', 8, '2026-03-20', 0),
(31, 5, 'herbalist', 'food', 1, '2026-03-20', 0),
(32, 5, 'herbalist', 'food', 1, '2026-03-20', 0),
(33, 5, 'herbalist', 'food', 1, '2026-03-20', 0),
(34, 5, 'herbalist', 'food', 7, '2026-03-20', 0),
(35, 5, 'herbalist', 'food', 1, '2026-03-20', 0),
(36, 5, 'herbalist', 'food', 13, '2026-03-20', 0),
(37, 5, 'tinkerer', 'weapon', 7, '2026-03-31', 0),
(38, 5, 'tinkerer', 'weapon', 9, '2026-03-31', 0),
(39, 5, 'tinkerer', 'weapon', 20, '2026-03-31', 0),
(40, 5, 'tinkerer', 'armor', 7, '2026-03-31', 0),
(41, 5, 'tinkerer', 'armor', 9, '2026-03-31', 0),
(42, 5, 'tinkerer', 'armor', 13, '2026-03-31', 0),
(43, 5, 'herbalist', 'food', 13, '2026-03-31', 0),
(44, 5, 'herbalist', 'food', 8, '2026-03-31', 1),
(45, 5, 'herbalist', 'food', 9, '2026-03-31', 0),
(46, 5, 'herbalist', 'food', 6, '2026-03-31', 0),
(47, 5, 'herbalist', 'food', 3, '2026-03-31', 0),
(48, 5, 'herbalist', 'food', 5, '2026-03-31', 0),
(49, 9, 'tinkerer', 'weapon', 4, '2026-03-31', 0),
(50, 9, 'tinkerer', 'weapon', 20, '2026-03-31', 0),
(51, 9, 'tinkerer', 'weapon', 9, '2026-03-31', 0),
(52, 9, 'tinkerer', 'armor', 1, '2026-03-31', 0),
(53, 9, 'tinkerer', 'armor', 6, '2026-03-31', 0),
(54, 9, 'tinkerer', 'armor', 3, '2026-03-31', 0),
(55, 9, 'herbalist', 'food', 10, '2026-03-31', 0),
(56, 9, 'herbalist', 'food', 11, '2026-03-31', 0),
(57, 9, 'herbalist', 'food', 7, '2026-03-31', 0),
(58, 9, 'herbalist', 'food', 4, '2026-03-31', 0),
(59, 9, 'herbalist', 'food', 11, '2026-03-31', 0),
(60, 9, 'herbalist', 'food', 3, '2026-03-31', 0),
(61, 5, 'tinkerer', 'weapon', 11, '2026-04-12', 1),
(62, 5, 'tinkerer', 'weapon', 18, '2026-04-12', 1),
(63, 5, 'tinkerer', 'weapon', 12, '2026-04-12', 1),
(64, 5, 'tinkerer', 'armor', 2, '2026-04-12', 1),
(65, 5, 'tinkerer', 'armor', 10, '2026-04-12', 1),
(66, 5, 'tinkerer', 'armor', 9, '2026-04-12', 0),
(67, 5, 'herbalist', 'food', 12, '2026-04-12', 1),
(68, 5, 'herbalist', 'food', 10, '2026-04-12', 0),
(69, 5, 'herbalist', 'food', 6, '2026-04-12', 1),
(70, 5, 'herbalist', 'food', 4, '2026-04-12', 0),
(71, 5, 'herbalist', 'food', 2, '2026-04-12', 0),
(72, 5, 'herbalist', 'food', 9, '2026-04-12', 0),
(73, 5, 'tinkerer', 'weapon', 5, '2026-04-18', 0),
(74, 5, 'tinkerer', 'weapon', 9, '2026-04-18', 0),
(75, 5, 'tinkerer', 'weapon', 5, '2026-04-18', 0),
(76, 5, 'tinkerer', 'armor', 15, '2026-04-18', 0),
(77, 5, 'tinkerer', 'armor', 3, '2026-04-18', 0),
(78, 5, 'tinkerer', 'armor', 6, '2026-04-18', 0),
(79, 5, 'herbalist', 'food', 11, '2026-04-18', 0),
(80, 5, 'herbalist', 'food', 1, '2026-04-18', 0),
(81, 5, 'herbalist', 'food', 5, '2026-04-18', 0),
(82, 5, 'herbalist', 'food', 4, '2026-04-18', 0),
(83, 5, 'herbalist', 'food', 11, '2026-04-18', 0),
(84, 5, 'herbalist', 'food', 7, '2026-04-18', 0),
(133, 5, 'herbalist', 'food', 7, '2026-04-20', 0),
(134, 5, 'herbalist', 'food', 1, '2026-04-20', 0),
(135, 5, 'herbalist', 'food', 10, '2026-04-20', 0),
(136, 5, 'herbalist', 'food', 1, '2026-04-20', 0),
(137, 5, 'herbalist', 'food', 1, '2026-04-20', 0),
(138, 5, 'herbalist', 'food', 10, '2026-04-20', 0),
(157, 5, 'tinkerer', 'weapon', 8, '2026-04-20', 1),
(158, 5, 'tinkerer', 'weapon', 3, '2026-04-20', 0),
(159, 5, 'tinkerer', 'weapon', 2, '2026-04-20', 0),
(160, 5, 'tinkerer', 'armor', 8, '2026-04-20', 0),
(161, 5, 'tinkerer', 'armor', 7, '2026-04-20', 0),
(162, 5, 'tinkerer', 'armor', 14, '2026-04-20', 0),
(163, 10, 'tinkerer', 'weapon', 3, '2026-04-20', 0),
(164, 10, 'tinkerer', 'weapon', 10, '2026-04-20', 1),
(165, 10, 'tinkerer', 'weapon', 3, '2026-04-20', 0),
(166, 10, 'tinkerer', 'armor', 6, '2026-04-20', 1),
(167, 10, 'tinkerer', 'armor', 16, '2026-04-20', 1),
(168, 10, 'tinkerer', 'armor', 5, '2026-04-20', 1),
(169, 10, 'herbalist', 'food', 1, '2026-04-20', 0),
(170, 10, 'herbalist', 'food', 8, '2026-04-20', 0),
(171, 10, 'herbalist', 'food', 4, '2026-04-20', 0),
(172, 10, 'herbalist', 'food', 7, '2026-04-20', 0),
(173, 10, 'herbalist', 'food', 10, '2026-04-20', 0),
(174, 10, 'herbalist', 'food', 4, '2026-04-20', 1),
(175, 10, 'tinkerer', 'weapon', 1, '2026-04-21', 0),
(176, 10, 'tinkerer', 'weapon', 4, '2026-04-21', 0),
(177, 10, 'tinkerer', 'weapon', 2, '2026-04-21', 0),
(178, 10, 'tinkerer', 'armor', 7, '2026-04-21', 0),
(179, 10, 'tinkerer', 'armor', 14, '2026-04-21', 0),
(180, 10, 'tinkerer', 'armor', 16, '2026-04-21', 0),
(181, 10, 'herbalist', 'food', 10, '2026-04-21', 0),
(182, 10, 'herbalist', 'food', 10, '2026-04-21', 0),
(183, 10, 'herbalist', 'food', 10, '2026-04-21', 0),
(184, 10, 'herbalist', 'food', 10, '2026-04-21', 0),
(185, 10, 'herbalist', 'food', 4, '2026-04-21', 0),
(186, 10, 'herbalist', 'food', 4, '2026-04-21', 0),
(187, 10, 'tinkerer', 'weapon', 1, '2026-04-23', 0),
(188, 10, 'tinkerer', 'weapon', 10, '2026-04-23', 0),
(189, 10, 'tinkerer', 'weapon', 1, '2026-04-23', 0),
(190, 10, 'tinkerer', 'armor', 5, '2026-04-23', 0),
(191, 10, 'tinkerer', 'armor', 15, '2026-04-23', 0),
(192, 10, 'tinkerer', 'armor', 8, '2026-04-23', 0),
(193, 10, 'herbalist', 'food', 10, '2026-04-23', 0),
(194, 10, 'herbalist', 'food', 1, '2026-04-23', 0),
(195, 10, 'herbalist', 'food', 1, '2026-04-23', 0),
(196, 10, 'herbalist', 'food', 7, '2026-04-23', 0),
(197, 10, 'herbalist', 'food', 4, '2026-04-23', 0),
(198, 10, 'herbalist', 'food', 10, '2026-04-23', 0),
(199, 11, 'tinkerer', 'weapon', 8, '2026-04-23', 1),
(200, 11, 'tinkerer', 'weapon', 3, '2026-04-23', 0),
(201, 11, 'tinkerer', 'weapon', 8, '2026-04-23', 1),
(202, 11, 'tinkerer', 'armor', 5, '2026-04-23', 0),
(203, 11, 'tinkerer', 'armor', 7, '2026-04-23', 1),
(204, 11, 'tinkerer', 'armor', 13, '2026-04-23', 1),
(211, 11, 'herbalist', 'food', 7, '2026-04-23', 0),
(212, 11, 'herbalist', 'food', 4, '2026-04-23', 0),
(213, 11, 'herbalist', 'food', 10, '2026-04-23', 0),
(214, 11, 'herbalist', 'food', 10, '2026-04-23', 0),
(215, 11, 'herbalist', 'food', 2, '2026-04-23', 0),
(216, 11, 'herbalist', 'food', 4, '2026-04-23', 0);

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
  `inventory_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '\'{"capacity":100,"used":0,"currency":{"normal":0,"spec":0},"items":[],"equipped":{"weapon":null,"armor_cap":null,"armor_plate":null,"armor_leggings":null,"armor_boots":null}}\'',
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
(5, 10, NULL, 'Neanderthal', 6, 210, 35, 28, 30, 31, 30, 26, 0, '{\"capacity\":200,\"used\":20,\"currency\":{\"normal\":48574,\"spec\":855},\"items\":[{\"id\":2,\"type\":\"misc\",\"name\":\"Strange tooth\",\"rarity\":\"common\",\"quantity\":1,\"description\":\"It is everywhere in the settlement, some animals even die from it because they think that is edible\",\"sell_price\":8,\"iconPath\":\"misc-common2.png\",\"inventory_size\":10,\"category\":\"Misc\"},{\"id\":4,\"type\":\"misc\",\"name\":\"Shiny pebble\",\"rarity\":\"rare\",\"quantity\":1,\"description\":\"Shiny pebble found at rivers and ponds near caves with shiny stones inside it\",\"sell_price\":12,\"iconPath\":\"misc-rare2.png\",\"inventory_size\":10,\"category\":\"Misc\"}],\"equipped\":{\"weapon\":{\"item_id\":8,\"name\":\"Stone knife\",\"category\":\"Weapon\",\"rarity\":\"Rare\",\"base_damage\":15,\"normal_currency_cost\":180,\"spec_currency_cost\":0,\"inventory_size\":10,\"description\":\"Finely knapped flint blade with a good grip.\",\"iconPath\":\"rare_knife.png\",\"id\":1776706823287,\"type\":\"weapon\",\"quantity\":1,\"weapon_damage\":30},\"armor_cap\":{\"item_id\":10,\"name\":\"Worn bone helmet\",\"category\":\"Armor\",\"rarity\":\"Legendary\",\"armor_point\":32,\"normal_currency_cost\":405,\"spec_currency_cost\":10,\"inventory_size\":10,\"description\":\"A dome darkened by old blood marks long use in hunts and violent encounters.\",\"iconPath\":\"legendary-cap.png\",\"id\":1775953210980,\"type\":\"armor\",\"quantity\":1},\"armor_plate\":{\"id\":12,\"type\":\"armor\",\"name\":\"Worn bone plate\",\"category\":\"Armor\",\"rarity\":\"Legendary\",\"quantity\":1,\"description\":\"Bone thorax stained with dried blood signal a warrior who has survived many close fights.\",\"iconPath\":\"legendary-plate.png\",\"armor_point\":28},\"armor_leggings\":{\"id\":11,\"type\":\"armor\",\"name\":\"Worn bone leggings\",\"category\":\"Armor\",\"rarity\":\"Legendary\",\"quantity\":1,\"description\":\"Thick leather leggings guard the legs from scratches, bites, and rough terrain during hunts.\",\"iconPath\":\"legendary-leggings.png\",\"armor_point\":28},\"armor_boots\":{\"id\":9,\"type\":\"armor\",\"name\":\"Worn bone boots\",\"category\":\"Armor\",\"rarity\":\"Legendary\",\"quantity\":1,\"description\":\"Soft leather footwear wraps the feet to prevent cuts and reduce pain on rocky ground.\",\"iconPath\":\"legendary-boots.png\",\"armor_point\":28}},\"stamina\":{\"current\":35,\"max\":100,\"last_reset\":1776706649},\"active_quest\":null,\"active_buffs\":[],\"dungeons_unlocked\":true}', 'hs_hair_2', 'hs_beard_2', 13, 26, 9, '2026-02-03 19:17:53', '2026-04-20 19:27:37'),
(6, 11, NULL, 'Floresiensis', 1, 0, 100, 10, 10, 10, 10, 10, 0, '{\"capacity\":100,\"used\":0,\"currency\":{\"normal\":0,\"spec\":0},\"items\":[],\"equipped\":{\"weapon\":null,\"armor_head\":null,\"armor_chest\":null,\"armor_legs\":null,\"armor_feet\":null}}', 'f-hair-2', 'f-beard-4', 16, 8, 18, '2026-02-28 19:45:44', '2026-02-28 19:45:44'),
(7, 12, NULL, 'Sapiens', 1, 0, 100, 10, 10, 10, 10, 10, 0, '{\"capacity\":100,\"used\":0,\"currency\":{\"normal\":0,\"spec\":0},\"items\":[],\"equipped\":{\"weapon\":null,\"armor_head\":null,\"armor_chest\":null,\"armor_legs\":null,\"armor_feet\":null}}', 'hs-hair-4', 'hs-beard-4', 22, 20, 12, '2026-02-28 19:51:03', '2026-02-28 19:51:03'),
(8, 13, NULL, 'Sapiens', 1, 0, 100, 10, 10, 10, 10, 10, 0, '{\"capacity\":200,\"used\":0,\"currency\":{\"normal\":0,\"spec\":0},\"items\":[],\"equipped\":{\"weapon\":null,\"armor_head\":null,\"armor_chest\":null,\"armor_legs\":null,\"armor_feet\":null}}', 'hs-hair-5', 'hs-beard-5', 16, 5, 6, '2026-03-04 11:55:52', '2026-03-04 11:55:52'),
(9, 14, NULL, 'Neanderthal', 1, 0, 100, 10, 10, 10, 10, 10, 0, '{\"capacity\":200,\"used\":0,\"currency\":{\"normal\":0,\"spec\":0},\"items\":[],\"equipped\":{\"weapon\":null,\"armor_head\":null,\"armor_chest\":null,\"armor_legs\":null,\"armor_feet\":null}}', NULL, NULL, 16, 20, 9, '2026-03-31 08:12:04', '2026-03-31 08:12:04'),
(10, 15, NULL, 'Floresiensis', 4, 30, 100, 13, 13, 13, 13, 13, 0, '{\"capacity\":200,\"used\":0,\"currency\":{\"normal\":426,\"spec\":9},\"items\":[],\"equipped\":{\"weapon\":{\"item_id\":10,\"name\":\"Bow and arrow\",\"category\":\"Weapon\",\"rarity\":\"Rare\",\"base_damage\":15,\"normal_currency_cost\":180,\"spec_currency_cost\":0,\"inventory_size\":10,\"description\":\"A simple wooden bow with bone-tipped arrows for hunting from a distance.\",\"iconPath\":\"rare_throw.png\",\"id\":1776718765152,\"type\":\"weapon\",\"quantity\":1,\"weapon_damage\":21},\"armor_head\":null,\"armor_chest\":null,\"armor_legs\":null,\"armor_feet\":null,\"armor_plate\":{\"item_id\":16,\"name\":\"Hardened wood plate\",\"category\":\"Armor\",\"rarity\":\"Rare\",\"armor_point\":24,\"normal_currency_cost\":235,\"spec_currency_cost\":0,\"inventory_size\":10,\"description\":\"A leather vest strengthened with wooden pieces provides improved defense against blunt impacts.\",\"iconPath\":\"wood-plate.png\",\"id\":1776717492828,\"type\":\"armor\",\"quantity\":1},\"armor_cap\":{\"item_id\":6,\"name\":\"Leather helmet\",\"category\":\"Armor\",\"rarity\":\"Common\",\"armor_point\":16,\"normal_currency_cost\":155,\"spec_currency_cost\":0,\"inventory_size\":10,\"description\":\"A simple leather helmet stitched from cured hide to soften blows and protect the scalp from cold and branches.\",\"iconPath\":\"leather-cap.png\",\"id\":1776717567790,\"type\":\"armor\",\"quantity\":1},\"armor_boots\":{\"item_id\":5,\"name\":\"Leather boots\",\"category\":\"Armor\",\"rarity\":\"Common\",\"armor_point\":20,\"normal_currency_cost\":155,\"spec_currency_cost\":0,\"inventory_size\":10,\"description\":\"Soft leather footwear wraps the feet to prevent cuts and reduce pain on rocky ground.\",\"iconPath\":\"leather-boots.png\",\"id\":1776718767007,\"type\":\"armor\",\"quantity\":1}},\"stamina\":{\"current\":100,\"max\":100,\"last_reset\":1776925190},\"active_quest\":null,\"active_buffs\":[],\"achievements\":{\"enemiesEnc\":[\"White powder\"],\"weaponsEnc\":[8],\"armorsEnc\":[],\"foodsEnc\":[],\"maxCrits\":0,\"flawlessWins\":1,\"deaths\":2,\"spentNormal\":0,\"foundLegendary\":false,\"hoarderAchieved\":false}}', 'f-hair-4', 'f-beard-5', 25, 17, 27, '2026-04-20 20:20:01', '2026-04-23 06:19:50'),
(11, 16, NULL, 'Sapiens', 4, 45, 70, 13, 13, 13, 13, 14, 0, '{\"capacity\":200,\"used\":0,\"currency\":{\"normal\":82,\"spec\":6},\"items\":[],\"equipped\":{\"weapon\":{\"item_id\":8,\"name\":\"Stone knife\",\"category\":\"Weapon\",\"rarity\":\"Rare\",\"base_damage\":15,\"normal_currency_cost\":180,\"spec_currency_cost\":0,\"inventory_size\":10,\"description\":\"Finely knapped flint blade with a good grip.\",\"iconPath\":\"rare_knife.png\",\"id\":1776938568530,\"type\":\"weapon\",\"quantity\":1,\"weapon_damage\":25},\"armor_head\":null,\"armor_chest\":null,\"armor_legs\":null,\"armor_feet\":null,\"armor_boots\":{\"item_id\":13,\"name\":\"Hardened wood boots\",\"category\":\"Armor\",\"rarity\":\"Rare\",\"armor_point\":23,\"normal_currency_cost\":235,\"spec_currency_cost\":0,\"inventory_size\":10,\"description\":\"Leather shoes fitted with wooden parts increase durability and protection during long treks.\",\"iconPath\":\"wood-boots.png\",\"id\":1776938496478,\"type\":\"armor\",\"quantity\":1},\"armor_leggings\":{\"item_id\":7,\"name\":\"Leather leggings\",\"category\":\"Armor\",\"rarity\":\"Common\",\"armor_point\":17,\"normal_currency_cost\":155,\"spec_currency_cost\":0,\"inventory_size\":10,\"description\":\"Thick leather leggings guard the legs from scratches, bites, and rough terrain during hunts.\",\"iconPath\":\"leather-leggings.png\",\"id\":1776938536807,\"type\":\"armor\",\"quantity\":1}},\"stamina\":{\"current\":70,\"max\":100,\"last_reset\":1776942598},\"active_quest\":null,\"active_buffs\":[],\"achievements\":{\"enemiesEnc\":[\"Rapid bite\",\"Plowmouth\",\"Digger\",\"Woolly boulder\",\"Treehead\",\"White powder\",\"Confiscator\"],\"weaponsEnc\":[8,1,3],\"armorsEnc\":[13,7],\"foodsEnc\":[1,2,4],\"maxCrits\":1,\"flawlessWins\":9,\"deaths\":2,\"spentNormal\":824,\"foundLegendary\":false,\"hoarderAchieved\":false}}', 'hs-hair-2', 'hs-beard-4', 1, 5, 30, '2026-04-23 08:41:55', '2026-04-23 11:10:45');

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
  `verification_token` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `user`
--

INSERT INTO `user` (`id`, `specie_id`, `email`, `password`, `salt`, `nickname`, `last_login`, `status`, `currency`, `spec_currency`, `verification_token`, `is_verified`, `reset_token`, `reset_token_expires`) VALUES
(6, 1, 'asd', '$2b$10$x7T5unm0QVs9sn3OmCMgsemQ3dNQiE3PBph/Kxs9NY/Vrq3GD2Eiy', '$2b$10$x7T5unm0QVs9sn3OmCMgse', 'csegefekete1', '2026-02-03', 1, 0, 0, '2424af9166ab360ac876e1e4c2a01f8a946778e9beed2e1004333d6c9d03592a', 0, NULL, NULL),
(7, 2, 'kezdodikk50@gmail.com', '$2b$10$IqwUAD62v6ozmztp15lXceUgkKVO0CDWjydnc4aZFYIjaOIOdItwS', '$2b$10$IqwUAD62v6ozmztp15lXce', 'csigabiga23', '2026-02-03', 1, 0, 0, '19a19218611ba2becf201130b55a7e054cc386e612958fcda3a60799d21b8184', 0, NULL, NULL),
(8, 3, 'ezustjanos3@gmail.com', '$2b$10$JLckiRZ1CvA/H/Irg.ItKeNkTpwKjqT15FHf/WjJkcs1pt1R0bzdS', '$2b$10$JLckiRZ1CvA/H/Irg.ItKe', 'silverjohn123', '2026-02-03', 1, 0, 0, '68eb2c7a557b523703e4ac23ac73edcd5d5a6fbee373ec41d13b2e60baf7db15', 0, NULL, NULL),
(9, 4, 'janesco897@gmail.com', '$2b$10$jkXNGOjlg.mkH8EqjjWUuOfKiEAEZew9EalbxgzDT9JI1hL36lrXi', '$2b$10$jkXNGOjlg.mkH8EqjjWUuO', 'kukucskajoska1111', '2026-02-03', 1, 0, 0, 'ff8837e2981ffcae37b7b5f3a4121eff1567099ea20516a0c0848c06cd41be5b', 0, NULL, NULL),
(10, 5, 'asd', '$2b$10$RC8i1dQ1aK8AZI4lYWv3OOmdNJJJ.9F8rnG85UaEk5I4UnSr89.pu', '$2b$10$RC8i1dQ1aK8AZI4lYWv3OO', 'gipszjakab55', '2026-04-20', 1, 0, 0, NULL, 1, NULL, NULL),
(11, 6, 'asd1', '$2b$10$MTKHOhp8E8ZVywn6xP7ueu1rp3rEdPDZjMpP5gTv5hcIcAk7bk9jO', '$2b$10$MTKHOhp8E8ZVywn6xP7ueu', 'csegef111', '2026-02-28', 1, 0, 0, NULL, 1, NULL, NULL),
(12, 7, '123123', '$2b$10$LVZ7AD02IAgPT4QU479zz.IGfnkcO42HcTuGpCo5ruk8tsnp7kbjK', '$2b$10$LVZ7AD02IAgPT4QU479zz.', 'csegef222', '2026-02-28', 1, 0, 0, NULL, 1, NULL, NULL),
(13, 8, 'veresgaborzalan-40248@taszi.hu', '$2b$10$MOBDsl5SRPZl4V1p3fec4.pdPniY/V0YYq5iPYZ/mu9cSEz7VK4Le', '$2b$10$MOBDsl5SRPZl4V1p3fec4.', 'Teszt', '2026-03-04', 1, 0, 0, NULL, 1, NULL, NULL),
(14, 9, 'tester@example.com', '$2b$10$6DMfULYA7nA14tLHKCgLT.K4n/YbTmcKKo.pte2Dc66WMRWwBT.0e', '$2b$10$6DMfULYA7nA14tLHKCgLT.', 'tester', '2026-03-31', 1, 0, 0, '7f223807b96b8f80f7c8a5805b568acce83e63195478d76b9d2c0a84e907a7c5', 0, NULL, NULL),
(15, 10, 'csege0306@gmail.com', '$2b$10$pVqp/ooU.Ge/wYwwh4LiTeRSM1xAr2gGQ.OeBRhTAByupMhtW0mk2', '$2b$10$pVqp/ooU.Ge/wYwwh4LiTe', 'michaeljackson', '2026-04-23', 1, 0, 0, NULL, 1, NULL, NULL),
(16, 11, 'teszttaszi@gmail.com', '$2b$10$F/Y0mZUwPI3l3cyqGzj/QukJJ/YvG674PTowqZCklle71S8Ttr0oO', '$2b$10$F/Y0mZUwPI3l3cyqGzj/Qu', 'johndoe', '2026-04-23', 1, 0, 0, NULL, 1, NULL, NULL);

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
-- A tábla indexei `shop`
--
ALTER TABLE `shop`
  ADD PRIMARY KEY (`id`),
  ADD KEY `specie_id` (`specie_id`),
  ADD KEY `created_date` (`created_date`);

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
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
-- AUTO_INCREMENT a táblához `shop`
--
ALTER TABLE `shop`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=217;

--
-- AUTO_INCREMENT a táblához `specie`
--
ALTER TABLE `specie`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT a táblához `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

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
