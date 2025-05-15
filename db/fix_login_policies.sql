-- studentsテーブルのRLSを有効化
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- studentsテーブルの読み取りポリシー
CREATE POLICY students_select_policy
  ON students
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- admin_usersテーブルのRLSを有効化
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- admin_usersテーブルの読み取りポリシー
CREATE POLICY admin_users_select_policy
  ON admin_users
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 既存のポリシーがある場合は、上書きするために一度削除
DROP POLICY IF EXISTS students_select_policy ON students;
DROP POLICY IF EXISTS admin_users_select_policy ON admin_users;

-- 再度ポリシーを作成
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
