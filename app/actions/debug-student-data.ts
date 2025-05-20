"use server"

import { createClient } from "@supabase/supabase-js"

// Supabaseクライアントを作成する関数
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase環境変数が設定されていません")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function debugStudentData(studentId: string) {
  try {
    console.log(`学生ID: ${studentId} のデータをデバッグします`)
    const supabase = createSupabaseClient()

    // 学生IDを数値に変換
    const studentIdNum = Number.parseInt(studentId, 10)
    const isNumeric = !isNaN(studentIdNum)

    // studentsテーブルのデータを確認
    console.log("studentsテーブルを確認します")
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*")
      .or(`student_id.eq.${studentId},student_id.eq.${isNumeric ? studentIdNum : studentId}`)

    // test_scoresテーブルのデータを確認
    console.log("test_scoresテーブルを確認します")
    const { data: testScoresData, error: testScoresError } = await supabase
      .from("test_scores")
      .select("*")
      .or(`student_id.eq.${studentId},student_id.eq.${isNumeric ? studentIdNum : studentId}`)
      .order("test_date", { ascending: false })

    // テーブルのカラム情報を取得
    const { data: studentsColumns, error: studentsColumnsError } = await supabase.rpc("get_table_columns", {
      table_name: "students",
    })

    const { data: testScoresColumns, error: testScoresColumnsError } = await supabase.rpc("get_table_columns", {
      table_name: "test_scores",
    })

    // 全てのテストデータを取得（最大10件）
    const { data: allTestScores, error: allTestScoresError } = await supabase
      .from("test_scores")
      .select("*")
      .limit(10)
      .order("created_at", { ascending: false })

    // 全ての学生データを取得（最大10件）
    const { data: allStudents, error: allStudentsError } = await supabase
      .from("students")
      .select("*")
      .limit(10)
      .order("created_at", { ascending: false })

    return {
      studentId,
      studentIdNum,
      studentData: studentData || [],
      studentError: studentError?.message,
      testScoresData: testScoresData || [],
      testScoresError: testScoresError?.message,
      studentsColumns: studentsColumns || [],
      studentsColumnsError: studentsColumnsError?.message,
      testScoresColumns: testScoresColumns || [],
      testScoresColumnsError: testScoresColumnsError?.message,
      allTestScores: allTestScores || [],
      allTestScoresError: allTestScoresError?.message,
      allStudents: allStudents || [],
      allStudentsError: allStudentsError?.message,
    }
  } catch (error) {
    console.error("デバッグエラー:", error)
    return {
      error: error instanceof Error ? error.message : "デバッグ中にエラーが発生しました",
    }
  }
}

// テストデータを追加する関数
export async function addTestDataForStudent(studentId: string) {
  try {
    console.log(`学生ID: ${studentId} のテストデータを追加します`)
    const supabase = createSupabaseClient()

    // 学生IDを数値に変換
    const studentIdNum = Number.parseInt(studentId, 10)
    const isNumeric = !isNaN(studentIdNum)

    // 現在の日付を取得
    const today = new Date().toISOString().split("T")[0]

    // サンプルテストデータを作成
    const testData = {
      student_id: isNumeric ? studentIdNum : studentId,
      test_name: "サンプル模擬試験",
      test_date: today,
      medical_overview: 1,
      public_health: 8,
      related_laws: 3,
      anatomy: 12,
      physiology: 13,
      pathology: 5,
      clinical_medicine_overview: 15,
      clinical_medicine_detail: 25,
      rehabilitation: 6,
      oriental_medicine_overview: 15,
      meridian_points: 16,
      oriental_medicine_clinical: 15,
      oriental_medicine_clinical_general: 8,
      acupuncture_theory: 8,
      moxibustion_theory: 7,
      created_at: new Date().toISOString(),
    }

    // データを挿入
    const { data, error } = await supabase.from("test_scores").insert([testData]).select()

    if (error) {
      console.error("テストデータ追加エラー:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("テストデータ追加エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テストデータの追加に失敗しました",
    }
  }
}
