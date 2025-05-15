-- テスト一覧とそれぞれの結果数を取得する関数
CREATE OR REPLACE FUNCTION get_test_summary()
RETURNS TABLE (
  test_name TEXT,
  test_date DATE,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.test_name,
    ts.test_date,
    COUNT(*) as count
  FROM 
    test_scores ts
  GROUP BY 
    ts.test_name, ts.test_date
  ORDER BY 
    ts.test_date DESC, ts.test_name;
END;
$$ LANGUAGE plpgsql;
