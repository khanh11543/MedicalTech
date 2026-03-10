SET NAMES utf8mb4;
UPDATE doctors SET full_name = CONCAT('BS. Nguy', CHAR(0x1EC5 USING utf8mb4), 'n H', CHAR(0x1ED3 USING utf8mb4), ' Duy Kh', CHAR(0xE1), 'nh') WHERE user_id = 23;
