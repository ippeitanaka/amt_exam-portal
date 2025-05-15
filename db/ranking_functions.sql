-- テスト平均点を取得する関数
CREATE OR REPLACE FUNCTION get_test_averages(
  p_test_name TEXT,
  p_test_date DATE
)
RETURNS TABLE (
  avg_section_a NUMERIC,
  avg_section_b NUMERIC,
  avg_section_c NUMERIC,
  avg_section_d NUMERIC,
  avg_section_ad NUMERIC,
  avg_section_bc NUMERIC,
  avg_total_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    AVG(section_a) as avg_section_a,
    AVG(section_b) as avg_section_b,
    AVG(section_c) as avg_section_c,
    AVG(section_d) as avg_section_d,
    AVG(section_ad) as avg_section_ad,
    AVG(section_bc) as avg_section_bc,
    AVG(total_score) as avg_total_score
  FROM 
    test_scores
  WHERE 
    test_name = p_test_name
    AND test_date = p_test_date;
END;
$$ LANGUAGE plpgsql;

-- 特定のテストでの学生の順位を取得する関数
CREATE OR REPLACE FUNCTION get_student_rank(
  p_student_id TEXT,
  p_test_name TEXT,
  p_test_date DATE
)
RETURNS TABLE (
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rank
  FROM (
    SELECT 
      student_id,
      RANK() OVER (ORDER BY total_score DESC) as rank
    FROM 
      test_scores
    WHERE 
      test_name = p_test_name
      AND test_date = p_test_date
  ) as rankings
  WHERE 
    student_id = p_student_id;
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

-- 特定のテストの全学生の順位を取得する関数
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
    s.name,
    ts.total_score,
    RANK() OVER (ORDER BY ts.total_score DESC) as rank
  FROM 
    test_scores ts
  JOIN 
    students s ON ts.student_id = s.student_id
  WHERE 
    ts.test_name = p_test_name
    AND ts.test_date = p_test_date
  ORDER BY 
    rank;
END;
$$ LANGUAGE plpgsql;

-- 総合ランキングを取得する関数を修正
-- 各学生のすべてのテスト結果の平均点に基づいて順位を計算

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
