-- パスワードハッシュ化のための関数を作成
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- パスワード検証のための関数を作成
CREATE OR REPLACE FUNCTION verify_password(stored_hash TEXT, password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN stored_hash = crypt(password, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のパスワードをハッシュ化するための一時的な関数
-- 注意: これは一度だけ実行してください
CREATE OR REPLACE FUNCTION hash_existing_passwords()
RETURNS VOID AS $$
BEGIN
  -- studentsテーブルのパスワードをハッシュ化
  UPDATE students
  SET password = hash_password(password)
  WHERE password NOT LIKE '$2a$%'; -- 既にハッシュ化されていないパスワードのみ

  -- admin_usersテーブルのパスワードをハッシュ化
  UPDATE admin_users
  SET password = hash_password(password)
  WHERE password NOT LIKE '$2a$%'; -- 既にハッシュ化されていないパスワードのみ
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
