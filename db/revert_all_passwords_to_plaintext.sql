-- 注意: このスクリプトはセキュリティ上のリスクがあります。
-- 開発環境または一時的な対応としてのみ使用してください。

-- ハッシュ化されたパスワードを持つ学生を特定
CREATE OR REPLACE FUNCTION revert_hashed_passwords(
  dummy_param TEXT DEFAULT 'dummy' -- ダミーパラメータを追加
)
RETURNS TEXT AS $
DECLARE
  updated_count INTEGER;
  student_record RECORD;
  original_password TEXT;
BEGIN
  updated_count := 0;
  
  -- ハッシュ化されたパスワードを持つ学生を処理
  FOR student_record IN 
    SELECT id, student_id, password 
    FROM students 
    WHERE password LIKE '$2a$%'
  LOOP
    -- 学生IDをパスワードとして使用（例として）
    -- 実際の運用では、より安全な方法を検討してください
    original_password := student_record.student_id;
    
    -- パスワードを更新
    UPDATE students 
    SET password = original_password
    WHERE id = student_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN 'ハッシュ化されたパスワードを持つ ' || updated_count || ' 人の学生のパスワードを平文に戻しました。';
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
