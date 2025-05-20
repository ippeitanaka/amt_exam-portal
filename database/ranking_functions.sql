-- テストのランキングを計算する関数
CREATE OR REPLACE FUNCTION calculate_test_rankings(test_name_param TEXT)
RETURNS TABLE (
  rank BIGINT,
  student_id TEXT,
  student_name TEXT,
  total_score NUMERIC,
  test_date DATE
) AS $$
BEGIN
  RETURN QUERY
  WITH scores AS (
    SELECT 
      ts.student_id,
      COALESCE(s.name, 'Unknown') as student_name,
      (
        COALESCE(ts.medical_overview, 0) +
        COALESCE(ts.public_health, 0) +
        COALESCE(ts.related_laws, 0) +
        COALESCE(ts.anatomy, 0) +
        COALESCE(ts.physiology, 0) +
        COALESCE(ts.pathology, 0) +
        COALESCE(ts.clinical_medicine_overview, 0) +
        COALESCE(ts.clinical_medicine_detail, 0) +
        COALESCE(ts.rehabilitation, 0) +
        COALESCE(ts.oriental_medicine_overview, 0) +
        COALESCE(ts.meridian_points, 0) +
        COALESCE(ts.oriental_medicine_clinical, 0) +
        COALESCE(ts.oriental_medicine_clinical_general, 0) +
        COALESCE(ts.acupuncture_theory, 0) +
        COALESCE(ts.moxibustion_theory, 0)
      ) as total_score,
      ts.test_date
    FROM test_scores ts
    LEFT JOIN students s ON ts.student_id::text = s.student_id::text
    WHERE ts.test_name = test_name_param
  )
  SELECT 
    RANK() OVER (ORDER BY total_score DESC) as rank,
    student_id,
    student_name,
    total_score,
    test_date
  FROM scores
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql;

-- 学生の全テストにおける平均ランキングを計算する関数
CREATE OR REPLACE FUNCTION calculate_student_overall_ranking(student_id_param TEXT)
RETURNS TABLE (
  average_rank NUMERIC,
  total_tests INTEGER,
  best_rank INTEGER,
  best_test TEXT,
  percentile NUMERIC
) AS $$
DECLARE
  total_students INTEGER;
BEGIN
  -- 総学生数を取得
  SELECT COUNT(DISTINCT student_id) INTO total_students FROM test_scores;
  
  RETURN QUERY
  WITH student_ranks AS (
    SELECT 
      ts.test_name,
      RANK() OVER (PARTITION BY ts.test_name ORDER BY (
        COALESCE(ts.medical_overview, 0) +
        COALESCE(ts.public_health, 0) +
        COALESCE(ts.related_laws, 0) +
        COALESCE(ts.anatomy, 0) +
        COALESCE(ts.physiology, 0) +
        COALESCE(ts.pathology, 0) +
        COALESCE(ts.clinical_medicine_overview, 0) +
        COALESCE(ts.clinical_medicine_detail, 0) +
        COALESCE(ts.rehabilitation, 0) +
        COALESCE(ts.oriental_medicine_overview, 0) +
        COALESCE(ts.meridian_points, 0) +
        COALESCE(ts.oriental_medicine_clinical, 0) +
        COALESCE(ts.oriental_medicine_clinical_general, 0) +
        COALESCE(ts.acupuncture_theory, 0) +
        COALESCE(ts.moxibustion_theory, 0)
      ) DESC) as rank,
      (
        COALESCE(ts.medical_overview, 0) +
        COALESCE(ts.public_health, 0) +
        COALESCE(ts.related_laws, 0) +
        COALESCE(ts.anatomy, 0) +
        COALESCE(ts.physiology, 0) +
        COALESCE(ts.pathology, 0) +
        COALESCE(ts.clinical_medicine_overview, 0) +
        COALESCE(ts.clinical_medicine_detail, 0) +
        COALESCE(ts.rehabilitation, 0) +
        COALESCE(ts.oriental_medicine_overview, 0) +
        COALESCE(ts.meridian_points, 0) +
        COALESCE(ts.oriental_medicine_clinical, 0) +
        COALESCE(ts.oriental_medicine_clinical_general, 0) +
        COALESCE(ts.acupuncture_theory, 0) +
        COALESCE(ts.moxibustion_theory, 0)
      ) as total_score
    FROM test_scores ts
    WHERE ts.student_id::text = student_id_param
  ),
  best_rank_info AS (
    SELECT test_name, rank
    FROM student_ranks
    ORDER BY rank ASC
    LIMIT 1
  )
  SELECT 
    ROUND(AVG(sr.rank), 1) as average_rank,
    COUNT(sr.test_name) as total_tests,
    MIN(sr.rank) as best_rank,
    (SELECT test_name FROM best_rank_info) as best_test,
    ROUND((1 - (AVG(sr.rank) / NULLIF(total_students, 0))) * 100, 1) as percentile
  FROM student_ranks sr;
END;
$$ LANGUAGE plpgsql;
