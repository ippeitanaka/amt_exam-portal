-- test_scoresテーブルのRLSを有効化（すでに有効になっている場合は不要）
ALTER TABLE test_scores ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがある場合は削除
DROP POLICY IF EXISTS test_scores_select_policy ON test_scores;
DROP POLICY IF EXISTS test_scores_insert_policy ON test_scores;
DROP POLICY IF EXISTS test_scores_update_policy ON test_scores;
DROP POLICY IF EXISTS test_scores_delete_policy ON test_scores;

-- 読み取りポリシー（認証済みユーザーと匿名ユーザーが読み取り可能）
CREATE POLICY test_scores_select_policy
  ON test_scores
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 挿入ポリシー（認証済みユーザーと匿名ユーザーが挿入可能）
CREATE POLICY test_scores_insert_policy
  ON test_scores
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 更新ポリシー（認証済みユーザーと匿名ユーザーが更新可能）
CREATE POLICY test_scores_update_policy
  ON test_scores
  FOR UPDATE
  TO authenticated, anon
  USING (true);

-- 削除ポリシー（認証済みユーザーと匿名ユーザーが削除可能）
CREATE POLICY test_scores_delete_policy
  ON test_scores
  FOR DELETE
  TO authenticated, anon
  USING (true);
