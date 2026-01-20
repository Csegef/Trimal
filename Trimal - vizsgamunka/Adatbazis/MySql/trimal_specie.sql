-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2025. Dec 12. 12:40
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
-- Tábla szerkezet ehhez a táblához `specie`
--

CREATE TABLE `specie` (
  `id` int(11) NOT NULL,
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
  `currency` int(11) DEFAULT 0 CHECK (`currency` >= 0),
  `spec_currency` int(11) DEFAULT 0 CHECK (`spec_currency` >= 0),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `specie`
--
ALTER TABLE `specie`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_specie_name` (`specie_name`),
  ADD KEY `idx_lvl` (`lvl`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `specie`
--
ALTER TABLE `specie`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
