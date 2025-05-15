-- 既存のポリシーを削除（先に実行）
DROP POLICY IF EXISTS students_select_policy ON students;
DROP POLICY IF EXISTS admin_users_select_policy ON admin_users;

-- studentsテーブルのRLSを有効化
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- admin_usersテーブルのRLSを有効化
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ポリシーを作成（削除後に実行）
CREATE POLICY students_select_policy
  ON students
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY admin_users_select_policy
  ON admin_users
  FOR SELECT
  TO authenticated, anon
  USING (true);
