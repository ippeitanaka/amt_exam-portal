-- get_student_rank関数を修正して、rank列の参照を明確にする
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
    rankings.rank
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
    rankings.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;

-- get_student_total_rank関数も同様に修正
CREATE OR REPLACE FUNCTION get_student_total_rank(
  p_student_id TEXT
)
RETURNS TABLE (
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rankings.rank
  FROM (
    SELECT 
      student_id,
      RANK() OVER (ORDER BY AVG(total_score) DESC) as rank
    FROM 
      test_scores
    GROUP BY 
      student_id
  ) as rankings
  WHERE 
    rankings.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;

-- get_test_rankings関数も修正
CREATE OR REPLACE FUNCTION get_test_rankings(
  p_test_name TEXT,
  p_test_date DATE
)
RETURNS TABLE (
  student_id TEXT,
  name TEXT,
  section_a NUMERIC,
  section_b NUMERIC,
  section_c NUMERIC,
  section_d NUMERIC,
  section_ad NUMERIC,
  section_bc NUMERIC,
  total_score NUMERIC,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.student_id,
    ts.name,
    ts.section_a,
    ts.section_b,
    ts.section_c,
    ts.section_d,
    ts.section_ad,
    ts.section_bc,
    ts.total_score,
    RANK() OVER (ORDER BY ts.total_score DESC) as rank
  FROM 
    test_scores ts
  WHERE 
    ts.test_name = p_test_name
    AND ts.test_date = p_test_date
  ORDER BY 
    RANK() OVER (ORDER BY ts.total_score DESC);
END;
$$ LANGUAGE plpgsql;

-- get_total_rankings関数も修正
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
    RANK() OVER (ORDER BY AVG(ts.total_score) DESC);
END;
$$ LANGUAGE plpgsql;
