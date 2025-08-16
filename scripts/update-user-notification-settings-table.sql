-- Criar tabela user_notification_settings se não existir
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_sales_viewed TIMESTAMPTZ,
    last_popup_viewed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Adicionar coluna last_popup_viewed se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_notification_settings' 
        AND column_name = 'last_popup_viewed'
    ) THEN
        ALTER TABLE user_notification_settings 
        ADD COLUMN last_popup_viewed TIMESTAMPTZ;
    END IF;
END $$;

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios dados
DROP POLICY IF EXISTS "Users can view own notification settings" ON user_notification_settings;
CREATE POLICY "Users can view own notification settings" ON user_notification_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários atualizarem apenas seus próprios dados
DROP POLICY IF EXISTS "Users can update own notification settings" ON user_notification_settings;
CREATE POLICY "Users can update own notification settings" ON user_notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);

-- Comentários para documentação
COMMENT ON TABLE user_notification_settings IS 'Configurações de notificações dos usuários';
COMMENT ON COLUMN user_notification_settings.last_sales_viewed IS 'Timestamp da última visualização das notificações de vendas';
COMMENT ON COLUMN user_notification_settings.last_popup_viewed IS 'Timestamp da última visualização das notificações popup';
