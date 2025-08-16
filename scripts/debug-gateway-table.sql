-- Verificar estrutura da tabela gateway_transactions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'gateway_transactions' 
ORDER BY ordinal_position;
