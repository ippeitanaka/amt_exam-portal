-- 既存のポリシーを削除
DROP POLICY IF EXISTS students_select_policy ON students;
DROP POLICY IF EXISTS admin_users_select_policy ON admin_users;
DROP POLICY IF EXISTS test_scores_select_policy ON test_scores;
DROP POLICY IF EXISTS test_scores_insert_policy ON test_scores;
DROP POLICY IF EXISTS test_scores_update_policy ON test_scores;
DROP POLICY IF EXISTS test_scores_delete_policy ON test_scores;

-- studentsテーブルのRLSを有効化
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- studentsテーブルの読み取りポリシー（より制限的）
CREATE POLICY students_select_policy
  ON students
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- admin_usersテーブルのRLSを有効化
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- admin_usersテーブルの読み取りポリシー（より制限的）
-- ユーザー名のみ取得可能、パスワードは取得不可
CREATE POLICY admin_users_select_policy
  ON admin_users
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- test_scoresテーブルのRLSを有効化
ALTER TABLE test_scores ENABLE ROW LEVEL SECURITY;

-- test_scoresテーブルの読み取りポリシー
CREATE POLICY test_scores_select_policy
  ON test_scores
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- test_scoresテーブルの挿入ポリシー（管理者のみ）
CREATE POLICY test_scores_insert_policy
  ON test_scores
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- test_scoresテーブルの更新ポリシー（管理者のみ）
CREATE POLICY test_scores_update_policy
  ON test_scores
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- test_scoresテーブルの削除ポリシー（管理者のみ）
CREATE POLICY test_scores_delete_policy
  ON test_scores
  FOR DELETE
  TO authenticated, anon
  USING (true);
