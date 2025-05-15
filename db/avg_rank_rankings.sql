-- 学生の総合順位を取得する関数を修正（順位の平均を使用）
CREATE OR REPLACE FUNCTION get_student_total_rank(
  p_student_id TEXT
)
RETURNS TABLE (
  rank BIGINT,
  avg_rank NUMERIC
) AS $$
BEGIN
  -- まず、この学生の各テストでの順位を計算
  WITH student_ranks AS (
    SELECT 
      ts.student_id,
      ts.test_name,
      ts.test_date,
      RANK() OVER (PARTITION BY ts.test_name, ts.test_date ORDER BY ts.total_score DESC) as test_rank
    FROM 
      test_scores ts
    WHERE
      ts.student_id = p_student_id
  ),
  
  -- 次に、すべての学生の平均順位を計算
  all_avg_ranks AS (
    SELECT 
      s.student_id,
      COALESCE(AVG(sr.test_rank), 0) as avg_rank
    FROM 
      students s
    LEFT JOIN (
      SELECT 
        ts.student_id,
        ts.test_name,
        ts.test_date,
        RANK() OVER (PARTITION BY ts.test_name, ts.test_date ORDER BY ts.total_score DESC) as test_rank
      FROM 
        test_scores ts
    ) sr ON s.student_id = sr.student_id
    GROUP BY 
      s.student_id
  )
  
  -- 最後に、平均順位に基づいて総合順位を計算
  RETURN QUERY
  SELECT 
    RANK() OVER (ORDER BY aar.avg_rank) as rank,
    aar.avg_rank
  FROM 
    all_avg_ranks aar
  WHERE 
    aar.student_id = p_student_id;
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
  -- 各学生の各テストでの順位を計算
  WITH student_test_ranks AS (
    SELECT 
      ts.student_id,
      ts.test_name,
      ts.test_date,
      RANK() OVER (PARTITION BY ts.test_name, ts.test_date ORDER BY ts.total_score DESC) as test_rank
    FROM 
      test_scores ts
  ),
  
  -- 各学生の平均順位を計算
  student_avg_ranks AS (
    SELECT 
      s.student_id,
      s.name,
      COALESCE(AVG(str.test_rank), 0) as avg_rank
    FROM 
      students s
    LEFT JOIN 
      student_test_ranks str ON s.student_id = str.student_id
    GROUP BY 
      s.student_id, s.name
  )
  
  -- 平均順位に基づいて総合順位を計算
  RETURN QUERY
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
