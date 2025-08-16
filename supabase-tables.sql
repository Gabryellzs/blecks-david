-- Tabela para armazenar configurações de gateways de pagamento por usuário
CREATE TABLE IF NOT EXISTS gateway_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  configs JSONB NOT NULL, -- Armazena um array de PaymentGatewayConfig
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índice para user_id para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_gateway_configs_user_id ON gateway_configs (user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE gateway_configs ENABLE ROW LEVEL SECURITY;

-- Política para usuários poderem ver e atualizar suas próprias configurações
CREATE POLICY "Users can manage their own gateway configs."
  ON gateway_configs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tabela para armazenar transações individuais de gateways de pagamento
CREATE TABLE IF NOT EXISTS gateway_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id TEXT NOT NULL, -- ID da transação no gateway
  gateway_id TEXT NOT NULL, -- ID do gateway (kirvano, cakto, etc.)
  customer_name TEXT,
  customer_email TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  fees NUMERIC(10, 2) DEFAULT 0,
  net_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL, -- completed, pending, failed, refunded
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT,
  raw_payload JSONB, -- Para armazenar o payload completo do webhook
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_gateway_transactions_user_id ON gateway_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_gateway_transactions_gateway_id ON gateway_transactions (gateway_id);
CREATE INDEX IF NOT EXISTS idx_gateway_transactions_status ON gateway_transactions (status);
CREATE INDEX IF NOT EXISTS idx_gateway_transactions_created_at ON gateway_transactions (created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE gateway_transactions ENABLE ROW LEVEL SECURITY;

-- Política para usuários poderem ver e gerenciar suas próprias transações
CREATE POLICY "Users can manage their own gateway transactions."
  ON gateway_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tabela para armazenar transações financeiras gerais por usuário
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transactions JSONB NOT NULL, -- Armazena um array de Transaction (do tipo financeiro)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índice para user_id para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_id ON finance_transactions (user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

-- Política para usuários poderem ver e atualizar suas próprias transações financeiras
CREATE POLICY "Users can manage their own finance transactions."
  ON finance_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Remover tabela sales se existir
DROP TABLE IF EXISTS sales CASCADE;

-- Remover tabela events se existir (substituída por gateway_transactions)
DROP TABLE IF EXISTS events CASCADE;
