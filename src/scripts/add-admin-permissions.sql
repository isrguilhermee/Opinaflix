-- Script para adicionar permissões de administrador
-- Execute este script no MySQL Workbench

-- 1. Adicionar coluna 'is_admin' na tabela tb_users
ALTER TABLE tb_users 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE COMMENT 'Define se o usuário é administrador';

-- 2. Criar índice para performance nas consultas de admin
CREATE INDEX idx_is_admin ON tb_users(is_admin);

-- 3. Definir um usuário como administrador (substitua 'seu_email@exemplo.com' pelo email do usuário que deve ser admin)
-- UPDATE tb_users SET is_admin = TRUE WHERE email = 'seu_email@exemplo.com';

-- 4. Opcional: Criar um usuário administrador padrão (descomente as linhas abaixo se necessário)
-- INSERT INTO tb_users (username, email, password, is_admin, created_at) 
-- VALUES ('admin', 'admin@opinaflix.com', '$2b$12$exemplo_hash_da_senha', TRUE, NOW());

-- 5. Verificar se a coluna foi adicionada corretamente
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'tb_users' 
AND COLUMN_NAME = 'is_admin';

-- 6. Verificar usuários administradores
SELECT id, username, email, is_admin, created_at 
FROM tb_users 
WHERE is_admin = TRUE; 