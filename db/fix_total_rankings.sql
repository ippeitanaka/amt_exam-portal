-- 総合ランキングの計算を修正するSQL

-- 総合ランキングを取得する関数を修正
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
    s.student_id,
    s.name,
    COALESCE(AVG(ts.total_score), 0) as avg_score,
    RANK() OVER (ORDER BY COALESCE(AVG(ts.total_score), 0) DESC) as rank
  FROM 
    students s
  LEFT JOIN 
    test_scores ts ON s.student_id = ts.student_id
  GROUP BY 
    s.student_id, s.name
  ORDER BY 
    rank, s.student_id;
END;
$$ LANGUAGE plpgsql;

-- 学生の総合順位を取得する関数も修正
CREATE OR REPLACE FUNCTION get_student_total_rank(
  p_student_id TEXT
)
RETURNS TABLE (
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.rank
  FROM (
    SELECT 
      s.student_id,
      COALESCE(AVG(ts.total_score), 0) as avg_score,
      RANK() OVER (ORDER BY COALESCE(AVG(ts.total_score), 0) DESC) as rank
    FROM 
      students s
    LEFT JOIN 
      test_scores ts ON s.student_id = ts.student_id
    GROUP BY 
      s.student_id
  ) as tr
  WHERE 
    tr.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;
