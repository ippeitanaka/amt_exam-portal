-- 学生ログイン検証用の関数
CREATE OR REPLACE FUNCTION verify_student_login(
  p_student_id TEXT,
  p_password TEXT
)
RETURNS SETOF students AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM students
  WHERE student_id = p_student_id
  AND (
    -- ハッシュ化されたパスワードの場合
    (password LIKE '$2a$%' AND verify_password(password, p_password))
    OR
    -- 平文パスワードの場合（移行期間中のみ）
    (password NOT LIKE '$2a$%' AND password = p_password)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者ログイン検証用の関数
CREATE OR REPLACE FUNCTION verify_admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS SETOF admin_users AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM admin_users
  WHERE username = p_username
  AND (
    -- ハッシュ化されたパスワードの場合
    (password LIKE '$2a$%' AND verify_password(password, p_password))
    OR
    -- 平文パスワードの場合（移行期間中のみ）
    (password NOT LIKE '$2a$%' AND password = p_password)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
