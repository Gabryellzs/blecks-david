-- Criar tabela para configurações de notificações do usuário
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios dados
CREATE POLICY "Users can view own notification settings" ON user_notification_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários inserirem apenas seus próprios dados
CREATE POLICY "Users can insert own notification settings" ON user_notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem apenas seus próprios dados
CREATE POLICY "Users can update own notification settings" ON user_notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários deletarem apenas seus próprios dados
CREATE POLICY "Users can delete own notification settings" ON user_notification_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_notification_settings_updated_at
    BEFORE UPDATE ON user_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id 
ON user_notification_settings(user_id);

-- Comentários para documentação
COMMENT ON TABLE user_notification_settings IS 'Configurações de notificações por usuário';
COMMENT ON COLUMN user_notification_settings.user_id IS 'ID do usuário (referência para auth.users)';
COMMENT ON COLUMN user_notification_settings.last_viewed_at IS 'Timestamp da última visualização de notificações';
COMMENT ON COLUMN user_notification_settings.created_at IS 'Timestamp de criação do registro';
COMMENT ON COLUMN user_notification_settings.updated_at IS 'Timestamp da última atualização';
