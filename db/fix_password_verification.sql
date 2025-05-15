-- パスワード検証のための関数を修正
CREATE OR REPLACE FUNCTION verify_password(
  stored_hash TEXT,
  password TEXT
)
RETURNS BOOLEAN AS $
BEGIN
  -- ハッシュ化されたパスワードの場合
  IF stored_hash LIKE '$2a$%' THEN
    RETURN stored_hash = crypt(password, stored_hash);
  -- 平文パスワードの場合
  ELSE
    RETURN stored_hash = password;
  END IF;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 学生ログイン検証用の関数も修正
CREATE OR REPLACE FUNCTION verify_student_login(
  p_student_id TEXT,
  p_password TEXT
)
RETURNS SETOF students AS $
BEGIN
  RETURN QUERY
  SELECT *
  FROM students
  WHERE student_id = p_student_id
  AND (
    -- 平文パスワードの場合
    password = p_password
    OR
    -- ハッシュ化されたパスワードの場合
    (password LIKE '$2a$%' AND verify_password(password, p_password))
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
