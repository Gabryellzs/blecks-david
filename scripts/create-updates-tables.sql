-- Função para criar a tabela app_updates
CREATE OR REPLACE FUNCTION create_app_updates_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS public.app_updates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text NOT NULL,
        version text NOT NULL,
        importance text NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        features jsonb,
        image_url text,
        action_url text,
        action_text text
    );

    -- Habilitar RLS se ainda não estiver habilitado
    ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;

    -- Políticas de RLS para app_updates:
    -- Permitir leitura para todos
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.app_updates;
    CREATE POLICY "Enable read access for all users" ON public.app_updates FOR SELECT USING (true);

    -- Permitir inserção, atualização e exclusão para usuários autenticados (ou ajuste para 'service_role' se for apenas para admins via backend)
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.app_updates;
    CREATE POLICY "Enable insert for authenticated users" ON public.app_updates FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.app_updates;
    CREATE POLICY "Enable update for authenticated users" ON public.app_updates FOR UPDATE USING (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.app_updates;
    CREATE POLICY "Enable delete for authenticated users" ON public.app_updates FOR DELETE USING (auth.role() = 'authenticated');

END;
$$;

-- Função para criar a tabela user_seen_updates
CREATE OR REPLACE FUNCTION create_user_seen_updates_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS public.user_seen_updates (
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        update_id uuid NOT NULL REFERENCES public.app_updates(id) ON DELETE CASCADE,
        seen_at timestamp with time zone DEFAULT now() NOT NULL,
        PRIMARY KEY (user_id, update_id)
    );

    -- Habilitar RLS se ainda não estiver habilitado
    ALTER TABLE public.user_seen_updates ENABLE ROW LEVEL SECURITY;

    -- Políticas de RLS para user_seen_updates:
    -- Permitir leitura apenas para o próprio usuário
    DROP POLICY IF EXISTS "Enable read access for authenticated users based on user_id" ON public.user_seen_updates;
    CREATE POLICY "Enable read access for authenticated users based on user_id" ON public.user_seen_updates FOR SELECT USING (auth.uid() = user_id);

    -- Permitir inserção apenas para o próprio usuário
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_seen_updates;
    CREATE POLICY "Enable insert for authenticated users" ON public.user_seen_updates FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Não são necessárias políticas de UPDATE/DELETE para esta tabela, pois é um registro de visualização.
    -- Se precisar de funcionalidade para "desmarcar" uma atualização, adicione uma política de DELETE.

END;
$$;
