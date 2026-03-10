-- Thay thế email và mật khẩu của bạn vào.
-- Lưu ý: Supabase tự động hash mật khẩu bằng hàm crypt, nên bạn có thể truyền mật khẩu thực tế nếu tạo qua auth.signUp, 
-- nhưng nếu dùng SQL raw, bạn cần dùng hàm extension pgcrypto. 

-- 1. Bật extension (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Khai báo thông tin user
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  user_email text := 'packing@dds.com';
  user_pass text := 'Packing2026@';
  encrypted_pw text;
BEGIN
  -- Mã hóa mật khẩu
  encrypted_pw := crypt(user_pass, gen_salt('bf'));

  -- Thêm vào bảng auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    encrypted_pw,
    now(),
    NULL,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Packing"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Thêm vào bảng identites của auth
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    new_user_id::text,
    format('{"sub":"%s","email":"%s"}', new_user_id, user_email)::jsonb,
    'email',
    now(),
    now(),
    now()
  );

  -- 3. Thêm vào bảng public.users (Do bạn custom db_schema.sql)
  INSERT INTO public.users (id, email, name, role)
  VALUES (new_user_id, user_email, 'Packing Team', 'user');

  RAISE NOTICE 'Đã tạo xong User thành công!';
END $$;
