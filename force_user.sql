-- CHỈ CHẠY ĐÚNG 1 ĐOẠN NÀY LÀ VÀO ĐƯỢC APP.
-- Nó sẽ tự động xóa tài khoản bị lỗi cũ và tạo lại mới tinh hoàn toàn (bypass hoàn toàn mọi cơ chế email).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id uuid := '5a66bc48-d6f4-4274-bda9-dca4ae3a07fd'; -- ID cố định cho dễ theo dõi
  user_email text := 'packing@dds.com';
  user_pass text := 'Packing2026@';
  encrypted_pw text;
BEGIN
  -- Dọn dẹp đồ rác nếu nãy giờ tạo lỗi
  DELETE FROM auth.identities WHERE identity_data->>'email' = user_email;
  DELETE FROM public.users WHERE email = user_email;
  DELETE FROM auth.users WHERE email = user_email;

  -- Mã hóa pass
  encrypted_pw := crypt(user_pass, gen_salt('bf'));

  -- ÉP BUỘC TẠO ID MỚI VÀ ĐÁNH DẤU XÁC NHẬN (email_confirmed_at = now())
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
    user_email, encrypted_pw, now(), 
    '{"provider":"email","providers":["email"]}', '{"name":"Packing Team"}', now(), now()
  );

  -- Thêm identity cho supabase
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at) 
  VALUES (gen_random_uuid(), new_user_id, new_user_id::text, format('{"sub":"%s","email":"%s"}', new_user_id, user_email)::jsonb, 'email', now(), now());

  -- Thêm vào public.users của app
  INSERT INTO public.users (id, email, name, role)
  VALUES (new_user_id, user_email, 'Packing Team', 'user');

  RAISE NOTICE 'SUCCESS: Tài khoản đã được dọn dẹp và reset mới hoàn toàn! Đăng nhập thôi!';
END $$;
