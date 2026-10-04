-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id UUID := uuid_generate_v4();
BEGIN
  -- 1. Buat User di sistem Autentikasi Supabase
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'banker@selelos.com',
    crypt('banker123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', ''
  );

  -- 2. Tambahkan Identity (diperlukan oleh Supabase agar user bisa login)
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    uuid_generate_v4(), new_user_id, new_user_id::text,
    jsonb_build_object('sub', new_user_id::text, 'email', 'banker@selelos.com'),
    'email', now(), now(), now()
  );

  -- 3. Buat Profil di tabel profiles kita dan set role menjadi BANKER
  INSERT INTO public.profiles (
    user_id, username, display_name, role
  )
  VALUES (
    new_user_id, 'banker', 'Bankir Selelos', 'BANKER'
  );
END $$;
