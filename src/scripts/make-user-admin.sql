-- Script para tornar um usuário existente administrador
-- Execute este script no MySQL Workbench

-- INSTRUÇÕES:
-- 1. Substitua 'SEU_EMAIL_AQUI' pelo email do usuário que deve ser admin
-- 2. Execute o script
-- 3. Verifique se o usuário foi definido como admin

-- Tornar usuário administrador (SUBSTITUA O EMAIL)
UPDATE tb_users 
SET is_admin = TRUE 
WHERE email = 'SEU_EMAIL_AQUI';

-- Verificar se a alteração foi feita
SELECT id, username, email, is_admin, created_at 
FROM tb_users 
WHERE email = 'SEU_EMAIL_AQUI';

-- Listar todos os administradores
SELECT id, username, email, is_admin, created_at 
FROM tb_users 
WHERE is_admin = TRUE 
ORDER BY created_at DESC; 