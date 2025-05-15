-- 特定のテストの全学生の順位を取得する関数（name列を直接使用）
CREATE OR REPLACE FUNCTION get_test_rankings(
  p_test_name TEXT,
  p_test_date DATE
)
RETURNS TABLE (
  student_id TEXT,
  name TEXT,
  total_score NUMERIC,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.student_id,
    ts.name,
    ts.total_score,
    RANK() OVER (ORDER BY ts.total_score DESC) as rank
  FROM 
    test_scores ts
  WHERE 
    ts.test_name = p_test_name
    AND ts.test_date = p_test_date
  ORDER BY 
    rank;
END;
$$ LANGUAGE plpgsql;

-- 総合ランキングを取得する関数（name列を直接使用）
CREATE OR REPLACE FUNCTION get_total_rankings()
RETURNS TABLE (
  student_id TEXT,
  name TEXT,
  avg_score NUMERIC,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.student_id,
    MAX(ts.name) as name,
    AVG(ts.total_score) as avg_score,
    RANK() OVER (ORDER BY AVG(ts.total_score) DESC) as rank
  FROM 
    test_scores ts
  GROUP BY 
    ts.student_id
  ORDER BY 
    rank;
END;
$$ LANGUAGE plpgsql;
