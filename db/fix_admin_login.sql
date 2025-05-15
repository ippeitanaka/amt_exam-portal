-- 管理者ログイン検証用の関数を修正
CREATE OR REPLACE FUNCTION verify_admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS SETOF admin_users AS $
BEGIN
  RETURN QUERY
  SELECT *
  FROM admin_users
  WHERE username = p_username
  AND (
    -- 平文パスワードの場合
    password = p_password
    OR
    -- ハッシュ化されたパスワードの場合
    (password LIKE '$2a$%' AND verify_password(password, p_password))
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
