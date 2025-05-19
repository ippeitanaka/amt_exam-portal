-- 既存のtest_scoresテーブルを削除（存在する場合）
DROP TABLE IF EXISTS test_scores;

-- 新しいtest_scoresテーブルを作成
CREATE TABLE test_scores (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  test_name TEXT NOT NULL DEFAULT '模擬試験',
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- 基礎医学系
  medical_overview NUMERIC, -- 医療概論
  public_health NUMERIC, -- 衛生・公衆衛生学
  related_laws NUMERIC, -- 関係法規
  anatomy NUMERIC, -- 解剖学
  physiology NUMERIC, -- 生理学
  pathology NUMERIC, -- 病理学
  
  -- 臨床医学系
  clinical_medicine_overview NUMERIC, -- 臨床医学総論
  clinical_medicine_detail NUMERIC, -- 臨床医学各論
  rehabilitation NUMERIC, -- リハビリテーション医学
  
  -- 東洋医学系
  oriental_medicine_overview NUMERIC, -- 東洋医学概論
  meridian_points NUMERIC, -- 経絡経穴概論
  oriental_medicine_clinical NUMERIC, -- 東洋医学臨床論
  oriental_medicine_clinical_general NUMERIC, -- 東洋医学臨床論（総合）
  
  -- 専門系
  acupuncture_theory NUMERIC, -- はり理論
  moxibustion_theory NUMERIC, -- きゅう理論
  
  -- 合計点（自動計算用）
  total_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(medical_overview, 0) +
    COALESCE(public_health, 0) +
    COALESCE(related_laws, 0) +
    COALESCE(anatomy, 0) +
    COALESCE(physiology, 0) +
    COALESCE(pathology, 0) +
    COALESCE(clinical_medicine_overview, 0) +
    COALESCE(clinical_medicine_detail, 0) +
    COALESCE(rehabilitation, 0) +
    COALESCE(oriental_medicine_overview, 0) +
    COALESCE(meridian_points, 0) +
    COALESCE(oriental_medicine_clinical, 0) +
    COALESCE(oriental_medicine_clinical_general, 0) +
    COALESCE(acupuncture_theory, 0) +
    COALESCE(moxibustion_theory, 0)
  ) STORED,
  
  -- 基礎医学系合計
  basic_medicine_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(medical_overview, 0) +
    COALESCE(public_health, 0) +
    COALESCE(related_laws, 0) +
    COALESCE(anatomy, 0) +
    COALESCE(physiology, 0) +
    COALESCE(pathology, 0)
  ) STORED,
  
  -- 臨床医学系合計
  clinical_medicine_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(clinical_medicine_overview, 0) +
    COALESCE(clinical_medicine_detail, 0) +
    COALESCE(rehabilitation, 0)
  ) STORED,
  
  -- 東洋医学系合計
  oriental_medicine_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(oriental_medicine_overview, 0) +
    COALESCE(meridian_points, 0) +
    COALESCE(oriental_medicine_clinical, 0) +
    COALESCE(oriental_medicine_clinical_general, 0)
  ) STORED,
  
  -- 専門系合計
  specialized_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(acupuncture_theory, 0) +
    COALESCE(moxibustion_theory, 0)
  ) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスを作成
CREATE INDEX idx_test_scores_student_id ON test_scores(student_id);
CREATE INDEX idx_test_scores_test_date ON test_scores(test_date);

-- RLSポリシーを設定
ALTER TABLE test_scores ENABLE ROW LEVEL SECURITY;

-- 管理者は全てのデータにアクセス可能
CREATE POLICY admin_all_access ON test_scores
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT auth.uid() FROM admin_users));

-- 学生は自分のデータのみ閲覧可能
CREATE POLICY student_view_own_scores ON test_scores
  FOR SELECT
  TO authenticated
  USING (student_id::text = auth.uid());

-- 匿名ユーザーは何も見れない
CREATE POLICY anon_no_access ON test_scores
  FOR ALL
  TO anon
  USING (false);

-- 学生IDと氏名の対応を保存するためのビューを作成
CREATE OR REPLACE VIEW student_names AS
SELECT DISTINCT student_id, 
  FIRST_VALUE(name) OVER (PARTITION BY student_id ORDER BY created_at DESC) as name
FROM students;

-- テスト結果に学生名を結合するビューを作成
CREATE OR REPLACE VIEW test_scores_with_names AS
SELECT ts.*, sn.name as student_name
FROM test_scores ts
LEFT JOIN student_names sn ON ts.student_id = sn.student_id;

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_test_scores_updated_at
BEFORE UPDATE ON test_scores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
