-- Verificar se a coluna image_url existe e adicioná-la se não existir
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'tb_users' 
AND COLUMN_NAME = 'image_url';

SET @statement = IF(@column_exists = 0, 
    'ALTER TABLE tb_users ADD COLUMN image_url VARCHAR(255) DEFAULT NULL',
    'SELECT "Coluna image_url já existe" AS message');

PREPARE stmt FROM @statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 