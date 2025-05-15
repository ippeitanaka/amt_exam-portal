-- 学生パスワードをリセットする関数
CREATE OR REPLACE FUNCTION reset_student_password(
  p_student_id TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE students
  SET password = p_new_password
  WHERE student_id = p_student_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- 更新された行数が0より大きければ成功
  RETURN updated_count > 0;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
