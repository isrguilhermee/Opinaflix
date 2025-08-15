-- Script para tornar um usuário administrador
-- INSTRUÇÕES:
-- 1. Substitua 'SEU_EMAIL_AQUI' pelo email da conta que deve ser admin
-- 2. Execute este script no MySQL Workbench
-- 3. A pessoa poderá acessar o dashboard administrativo

-- PASSO 1: Verificar se o usuário existe
SELECT id, username, email, is_admin 
FROM tb_users 
WHERE email = 'SEU_EMAIL_AQUI';

-- PASSO 2: Tornar o usuário administrador
UPDATE tb_users 
SET is_admin = TRUE 
WHERE email = 'SEU_EMAIL_AQUI';

-- PASSO 3: Confirmar que funcionou
SELECT id, username, email, is_admin, created_at 
FROM tb_users 
WHERE email = 'SEU_EMAIL_AQUI';

-- EXTRA: Ver todos os administradores
SELECT id, username, email, is_admin 
FROM tb_users 
WHERE is_admin = TRUE 
ORDER BY created_at DESC; 