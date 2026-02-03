-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Feb 03. 20:32
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
  `debuff_id` int(11) NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `effect_buff`
--

CREATE TABLE `effect_buff` (
  `effect_id` int(11) NOT NULL,
  `food_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `duration` int(11) NOT NULL,
  `iconPath` varchar(100) NOT NULL,
  `stacking_rule` varchar(100) NOT NULL,
  `isStackable` tinyint(1) NOT NULL,
  `max_stack` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `effect_debuff`
--

CREATE TABLE `effect_debuff` (
  `effect_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `duration` int(11) NOT NULL,
  `iconPath` varchar(100) NOT NULL,
  `base_damage` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `enemy`
--

CREATE TABLE `enemy` (
  `enemy_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `lvl` int(11) NOT NULL DEFAULT 1,
  `base_health` int(11) NOT NULL,
  `base_agility` int(11) NOT NULL DEFAULT 10,
  `base_strength` int(11) NOT NULL DEFAULT 10,
  `base_luck` int(11) NOT NULL DEFAULT 10,
  `iconPath` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `environment`
--

CREATE TABLE `environment` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `background` varchar(5000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `inventory`
--

CREATE TABLE `inventory` (
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
  `shop_id` int(11) NOT NULL,
  `optionality` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `lvl` int(11) NOT NULL DEFAULT 1,
  `category` varchar(100) NOT NULL,
  `rarity` varchar(100) NOT NULL,
  `armor_point` int(11) NOT NULL,
  `buy_price` int(11) NOT NULL,
  `sell_price` int(11) NOT NULL,
  `inventory_size` int(11) NOT NULL,
  `description` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `item_food`
--

CREATE TABLE `item_food` (
  `item_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `buff_id` int(11) NOT NULL,
  `optionality` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `lvl` int(11) NOT NULL DEFAULT 1,
  `category` varchar(100) NOT NULL,
  `rarity` varchar(100) NOT NULL,
  `buff_effect` varchar(100) NOT NULL,
  `buy_price` int(11) NOT NULL,
  `sell_price` int(11) NOT NULL,
  `inventory_size` int(11) NOT NULL,
  `description` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `item_misc`
--

CREATE TABLE `item_misc` (
  `item_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `optionality` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `lvl` int(11) NOT NULL DEFAULT 1,
  `category` varchar(100) NOT NULL,
  `rarity` varchar(100) NOT NULL,
  `buy_price` int(11) NOT NULL,
  `sell_price` int(11) NOT NULL,
  `inventory_size` int(11) NOT NULL,
  `description` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `item_weapon`
--

CREATE TABLE `item_weapon` (
  `item_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `optionality` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `lvl` int(11) NOT NULL DEFAULT 1,
  `category` varchar(100) NOT NULL,
  `rarity` varchar(100) NOT NULL,
  `base_damage` int(11) NOT NULL,
  `buy_price` int(11) NOT NULL,
  `sell_price` int(11) NOT NULL,
  `inventory_size` int(11) NOT NULL,
  `description` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `quest`
--

CREATE TABLE `quest` (
  `quest_id` int(11) NOT NULL,
  `specie_id` int(11) NOT NULL,
  `optionality` varchar(100) NOT NULL,
  `difficulty` varchar(100) NOT NULL,
  `currency` int(11) NOT NULL,
  `spec_currency` int(11) NOT NULL,
  `xp` int(100) NOT NULL,
  `description` varchar(100) NOT NULL,
  `location` varchar(100) NOT NULL,
  `stamina_cost` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `shop`
--

CREATE TABLE `shop` (
  `id` int(11) NOT NULL,
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
  `shop_id` int(11) DEFAULT NULL,
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
  `hair_style` varchar(100) DEFAULT NULL,
  `beard_style` varchar(100) DEFAULT NULL,
  `inventory_capacity` int(11) DEFAULT 100 CHECK (`inventory_capacity` >= 0),
  `inventory_state` int(11) DEFAULT 0 CHECK (`inventory_state` >= 0),
  `slot_weapon` varchar(100) DEFAULT NULL,
  `slot_armor_1` varchar(100) DEFAULT NULL,
  `slot_armor_2` varchar(100) DEFAULT NULL,
  `slot_armor_3` varchar(100) DEFAULT NULL,
  `slot_armor_4` varchar(100) DEFAULT NULL,
  `quest_1` int(11) DEFAULT NULL,
  `quest_2` int(11) DEFAULT NULL,
  `quest_3` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `specie`
--

INSERT INTO `specie` (`id`, `user_id`, `shop_id`, `quest_id`, `specie_name`, `lvl`, `xp`, `stamina`, `base_health`, `base_strength`, `base_agility`, `base_luck`, `base_resistance`, `base_armor`, `hair_style`, `beard_style`, `inventory_capacity`, `inventory_state`, `slot_weapon`, `slot_armor_1`, `slot_armor_2`, `slot_armor_3`, `slot_armor_4`, `quest_1`, `quest_2`, `quest_3`, `created_at`, `updated_at`) VALUES
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
(10, 5, 'feketecsegeistvan-40257@taszi.hu', '$2b$10$RC8i1dQ1aK8AZI4lYWv3OOmdNJJJ.9F8rnG85UaEk5I4UnSr89.pu', '$2b$10$RC8i1dQ1aK8AZI4lYWv3OO', 'gipszjakab55', '2026-02-03', 1, 0, 0, '', NULL, 1);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `active_effect`
--
ALTER TABLE `active_effect`
  ADD PRIMARY KEY (`specie_id`,`buff_id`,`debuff_id`),
  ADD KEY `buff_id` (`buff_id`),
  ADD KEY `debuff_id` (`debuff_id`);

--
-- A tábla indexei `effect_buff`
--
ALTER TABLE `effect_buff`
  ADD PRIMARY KEY (`effect_id`),
  ADD KEY `food_id` (`food_id`);

--
-- A tábla indexei `effect_debuff`
--
ALTER TABLE `effect_debuff`
  ADD PRIMARY KEY (`effect_id`);

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
-- A tábla indexei `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`specie_id`,`armor_id`,`weapon_id`,`misc_id`,`food_id`),
  ADD KEY `armor_id` (`armor_id`),
  ADD KEY `food_id` (`food_id`),
  ADD KEY `misc_id` (`misc_id`),
  ADD KEY `weapon_id` (`weapon_id`);

--
-- A tábla indexei `item_armor`
--
ALTER TABLE `item_armor`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `shop_id` (`shop_id`);

--
-- A tábla indexei `item_food`
--
ALTER TABLE `item_food`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `buff_id` (`buff_id`);

--
-- A tábla indexei `item_misc`
--
ALTER TABLE `item_misc`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `shop_id` (`shop_id`);

--
-- A tábla indexei `item_weapon`
--
ALTER TABLE `item_weapon`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `shop_id` (`shop_id`);

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
  ADD KEY `armor_id` (`armor_id`),
  ADD KEY `weapon_id` (`weapon_id`),
  ADD KEY `misc_id` (`misc_id`),
  ADD KEY `food_id` (`food_id`);

--
-- A tábla indexei `specie`
--
ALTER TABLE `specie`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_specie_name` (`specie_name`),
  ADD KEY `idx_lvl` (`lvl`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `shop_id` (`shop_id`),
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
  MODIFY `effect_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `effect_debuff`
--
ALTER TABLE `effect_debuff`
  MODIFY `effect_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `enemy`
--
ALTER TABLE `enemy`
  MODIFY `enemy_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `environment`
--
ALTER TABLE `environment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `item_armor`
--
ALTER TABLE `item_armor`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `item_food`
--
ALTER TABLE `item_food`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `item_misc`
--
ALTER TABLE `item_misc`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `item_weapon`
--
ALTER TABLE `item_weapon`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `quest`
--
ALTER TABLE `quest`
  MODIFY `quest_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `shop`
--
ALTER TABLE `shop`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  ADD CONSTRAINT `active_effect_ibfk_2` FOREIGN KEY (`debuff_id`) REFERENCES `effect_debuff` (`effect_id`),
  ADD CONSTRAINT `active_effect_ibfk_3` FOREIGN KEY (`specie_id`) REFERENCES `specie` (`id`);

--
-- Megkötések a táblához `effect_buff`
--
ALTER TABLE `effect_buff`
  ADD CONSTRAINT `effect_buff_ibfk_1` FOREIGN KEY (`food_id`) REFERENCES `item_food` (`item_id`);

--
-- Megkötések a táblához `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`specie_id`) REFERENCES `specie` (`id`),
  ADD CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`armor_id`) REFERENCES `item_armor` (`item_id`),
  ADD CONSTRAINT `inventory_ibfk_3` FOREIGN KEY (`food_id`) REFERENCES `item_food` (`item_id`),
  ADD CONSTRAINT `inventory_ibfk_4` FOREIGN KEY (`misc_id`) REFERENCES `item_misc` (`item_id`),
  ADD CONSTRAINT `inventory_ibfk_5` FOREIGN KEY (`weapon_id`) REFERENCES `item_weapon` (`item_id`);

--
-- Megkötések a táblához `item_armor`
--
ALTER TABLE `item_armor`
  ADD CONSTRAINT `item_armor_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`);

--
-- Megkötések a táblához `item_food`
--
ALTER TABLE `item_food`
  ADD CONSTRAINT `item_food_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`),
  ADD CONSTRAINT `item_food_ibfk_2` FOREIGN KEY (`buff_id`) REFERENCES `effect_buff` (`effect_id`);

--
-- Megkötések a táblához `item_misc`
--
ALTER TABLE `item_misc`
  ADD CONSTRAINT `item_misc_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`);

--
-- Megkötések a táblához `item_weapon`
--
ALTER TABLE `item_weapon`
  ADD CONSTRAINT `item_weapon_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`);

--
-- Megkötések a táblához `quest`
--
ALTER TABLE `quest`
  ADD CONSTRAINT `quest_ibfk_1` FOREIGN KEY (`specie_id`) REFERENCES `specie` (`id`);

--
-- Megkötések a táblához `shop`
--
ALTER TABLE `shop`
  ADD CONSTRAINT `shop_ibfk_1` FOREIGN KEY (`specie_id`) REFERENCES `specie` (`id`),
  ADD CONSTRAINT `shop_ibfk_2` FOREIGN KEY (`armor_id`) REFERENCES `item_armor` (`item_id`),
  ADD CONSTRAINT `shop_ibfk_3` FOREIGN KEY (`food_id`) REFERENCES `item_food` (`item_id`),
  ADD CONSTRAINT `shop_ibfk_4` FOREIGN KEY (`misc_id`) REFERENCES `item_misc` (`item_id`),
  ADD CONSTRAINT `shop_ibfk_5` FOREIGN KEY (`weapon_id`) REFERENCES `item_weapon` (`item_id`);

--
-- Megkötések a táblához `specie`
--
ALTER TABLE `specie`
  ADD CONSTRAINT `specie_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `specie_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`),
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
