-- test_scoresテーブルにname列を追加
ALTER TABLE test_scores ADD COLUMN name TEXT;

-- 既存のデータに対して、studentsテーブルから名前を取得して更新
UPDATE test_scores ts
SET name = s.name
FROM students s
WHERE ts.student_id = s.student_id;
