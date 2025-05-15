-- admin_usersテーブルのRLSを確認
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS admin_users_select_policy ON admin_users;

-- admin_usersテーブルの読み取りポリシー（より緩和的）
CREATE POLICY admin_users_select_policy
  ON admin_users
  FOR SELECT
  TO authenticated, anon
  USING (true);
