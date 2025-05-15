-- 既存のポリシーを削除
DROP POLICY IF EXISTS students_select_policy ON students;

-- studentsテーブルの読み取りポリシー（より緩和的）
CREATE POLICY students_select_policy
  ON students
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- パスワード検証用の関数を修正（平文パスワードも許可）
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
