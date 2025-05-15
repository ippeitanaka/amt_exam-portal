-- 学生の各テストでの順位を取得する補助関数を作成
CREATE OR REPLACE FUNCTION get_student_test_ranks(
  p_student_id TEXT
)
RETURNS TABLE (
  test_name TEXT,
  test_date DATE,
  test_rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH all_test_ranks AS (
    SELECT 
      ts.test_name,
      ts.test_date,
      ts.student_id,
      RANK() OVER (PARTITION BY ts.test_name, ts.test_date ORDER BY ts.total_score DESC) as rank
    FROM 
      test_scores ts
  )
  SELECT 
    atr.test_name,
    atr.test_date,
    atr.rank
  FROM 
    all_test_ranks atr
  WHERE 
    atr.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;

-- 学生の総合順位を取得する関数を修正（順位の平均を使用）
CREATE OR REPLACE FUNCTION get_student_total_rank(
  p_student_id TEXT
)
RETURNS TABLE (
  rank BIGINT,
  avg_rank NUMERIC
) AS $$
DECLARE
  v_avg_rank NUMERIC;
  v_rank BIGINT;
BEGIN
  -- この学生の各テストでの順位の平均を計算
  SELECT AVG(test_rank) INTO v_avg_rank
  FROM get_student_test_ranks(p_student_id);
  
  -- 全学生の平均順位を計算し、この学生の順位を決定
  WITH all_student_avg_ranks AS (
    SELECT 
      s.id as student_id,
      COALESCE((SELECT AVG(test_rank) FROM get_student_test_ranks(s.id)), 999999) as avg_rank
    FROM 
      students s
  )
  SELECT 
    RANK() OVER (ORDER BY avg_rank)
  INTO 
    v_rank
  FROM 
    all_student_avg_ranks
  WHERE 
    student_id = p_student_id;
  
  -- 結果を返す
  RETURN QUERY
  SELECT 
    v_rank,
    COALESCE(v_avg_rank, 0);
END;
$$ LANGUAGE plpgsql;

-- 総合ランキングを取得する関数も修正（順位の平均を使用）
CREATE OR REPLACE FUNCTION get_total_rankings()
RETURNS TABLE (
  student_id TEXT,
  name TEXT,
  avg_rank NUMERIC,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH student_avg_ranks AS (
    SELECT 
      s.id as student_id,
      s.name,
      COALESCE((SELECT AVG(test_rank) FROM get_student_test_ranks(s.id)), 999999) as avg_rank
    FROM 
      students s
  )
  SELECT 
    sar.student_id,
    sar.name,
    sar.avg_rank,
    RANK() OVER (ORDER BY sar.avg_rank) as rank
  FROM 
    student_avg_ranks sar
  ORDER BY 
    rank, sar.student_id;
END;
$$ LANGUAGE plpgsql;
