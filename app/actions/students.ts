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

export async function getStudents() {
  try {
    console.log("学生データ取得を開始します")
    const supabase = createSupabaseClient()

    // studentsテーブルからデータを取得
    const { data, error } = await supabase.from("students").select("*").order("student_id", { ascending: true })

    if (error) {
      console.error("学生データ取得エラー:", error)
      // エラーが発生した場合はtest_scoresテーブルからのフォールバック取得を試みる
      return getStudentsFromTestScores()
    }

    if (!data || data.length === 0) {
      console.log("studentsテーブルにデータがありません、test_scoresテーブルから取得を試みます")
      return getStudentsFromTestScores()
    }

    console.log("studentsテーブルから", data.length, "件の学生データを取得しました")
    return { success: true, data, source: "students_table" }
  } catch (error) {
    console.error("学生データ取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "学生データの取得に失敗しました",
      data: [],
    }
  }
}

// test_scoresテーブルから学生データを取得するフォールバック関数
async function getStudentsFromTestScores() {
  try {
    console.log("test_scoresテーブルからデータを取得します")
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from("test_scores")
      .select("student_id, student_name")
      .order("student_id", { ascending: true })

    if (error) {
      console.error("テスト結果からの学生データ取得エラー:", error)
      return { success: false, error: error.message, data: [] }
    }

    if (!data || data.length === 0) {
      console.log("test_scoresテーブルにもデータがありません")
      return { success: true, data: [], source: "no_data" }
    }

    // 一意の学生IDを抽出
    const uniqueStudentIds = new Map()

    for (const item of data) {
      if (item.student_id && !uniqueStudentIds.has(item.student_id)) {
        uniqueStudentIds.set(item.student_id, {
          student_id: item.student_id,
          name: item.student_name || `学生${item.student_id}`, // student_nameがない場合、学生IDから生成
          password: "password", // デフォルト値
          created_at: new Date().toISOString(),
        })
      }
    }

    const uniqueStudents = Array.from(uniqueStudentIds.values())
    console.log("test_scoresテーブルから", uniqueStudents.length, "件の学生データを抽出しました")

    return { success: true, data: uniqueStudents, source: "test_scores_table" }
  } catch (error) {
    console.error("学生データ取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "学生データの取得に失敗しました",
      data: [],
    }
  }
}

export async function addOrUpdateStudent(student: any) {
  try {
    // 入力値の検証
    if (!student || !student.student_id || !student.name || !student.password) {
      return { success: false, error: "必須フィールドが不足しています" }
    }

    // student_idが数値であることを確認
    const studentId =
      typeof student.student_id === "number"
        ? student.student_id
        : Number.parseInt(String(student.student_id).trim(), 10)

    if (isNaN(studentId)) {
      return { success: false, error: `無効な学生ID: ${student.student_id}` }
    }

    console.log("学生データを保存します:", {
      student_id: studentId,
      name: student.name,
      password: student.password ? "********" : "未設定",
    })

    const supabase = createSupabaseClient()

    // まず既存の学生を確認
    const { data: existingStudent, error: queryError } = await supabase
      .from("students")
      .select("student_id")
      .eq("student_id", studentId)
      .maybeSingle()

    if (queryError) {
      console.error("学生データ検索エラー:", queryError)
      return { success: false, error: queryError.message }
    }

    let result

    try {
      if (existingStudent) {
        // 既存の学生を更新
        console.log("既存の学生を更新します:", studentId)
        result = await supabase
          .from("students")
          .update({
            name: student.name,
            password: student.password,
          })
          .eq("student_id", studentId)
      } else {
        // 新しい学生を挿入
        console.log("新しい学生を挿入します:", studentId)
        result = await supabase.from("students").insert({
          student_id: studentId,
          name: student.name,
          password: student.password,
          created_at: student.created_at || new Date().toISOString(),
        })
      }

      if (result.error) {
        console.error("学生データ保存エラー:", result.error)
        return { success: false, error: result.error.message }
      }

      console.log("学生データを保存しました")
      return { success: true }
    } catch (dbError) {
      console.error("データベース操作エラー:", dbError)
      return { success: false, error: "データベース操作に失敗しました" }
    }
  } catch (error) {
    console.error("学生データ保存エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "学生データの保存に失敗しました",
    }
  }
}

export async function importStudents(students: any[]) {
  try {
    if (!students || students.length === 0) {
      return { success: false, error: "インポートするデータがありません" }
    }

    console.log("学生データをインポートします:", students.length, "件")
    console.log("最初の学生データ例:", students[0])

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const student of students) {
      try {
        // student_idが数値であることを確認
        if (typeof student.student_id !== "number") {
          const numericId = Number.parseInt(String(student.student_id).trim(), 10)
          if (isNaN(numericId)) {
            errorCount++
            errors.push(`無効な学生ID: ${student.student_id}`)
            continue
          }
          student.student_id = numericId
        }

        // 学生情報を保存
        const result = await addOrUpdateStudent(student)

        if (result.success) {
          successCount++
        } else {
          errorCount++
          errors.push(result.error || "不明なエラー")
          console.error("学生インポートエラー:", result.error)
        }
      } catch (err) {
        console.error("学生インポート処理エラー:", err)
        errorCount++
        errors.push(err instanceof Error ? err.message : "不明なエラー")
      }
    }

    console.log("学生データのインポートが完了しました:", successCount, "件成功,", errorCount, "件失敗")
    if (errors.length > 0) {
      console.log("エラー詳細:", errors.slice(0, 5))
    }

    return {
      success: true,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors.slice(0, 5) : [],
      message: `${successCount}件の学生情報をインポートしました${
        errorCount > 0 ? `（${errorCount}件の処理に失敗しました）` : ""
      }`,
    }
  } catch (error) {
    console.error("学生インポートエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "学生情報のインポートに失敗しました",
    }
  }
}

export async function checkDatabaseStructure() {
  try {
    console.log("データベース構造を確認します")
    const supabase = createSupabaseClient()

    // studentsテーブルの構造を確認
    const { data: studentsData, error: studentsError } = await supabase.from("students").select("*").limit(1)

    // test_scoresテーブルの構造を確認
    const { data: testScoresData, error: testScoresError } = await supabase.from("test_scores").select("*").limit(1)

    let studentsColumns: string[] = []
    let testScoresColumns: string[] = []
    let studentsErrorMsg: string | null = null
    let testScoresErrorMsg: string | null = null

    if (studentsError) {
      console.error("studentsテーブル構造確認エラー:", studentsError)
      studentsErrorMsg = studentsError.message
    } else if (studentsData && studentsData.length > 0) {
      studentsColumns = Object.keys(studentsData[0])
    } else {
      studentsErrorMsg = "studentsテーブルにデータが存在しません"
    }

    if (testScoresError) {
      console.error("test_scoresテーブル構造確認エラー:", testScoresError)
      testScoresErrorMsg = testScoresError.message
    } else if (testScoresData && testScoresData.length > 0) {
      testScoresColumns = Object.keys(testScoresData[0])
    } else {
      testScoresErrorMsg = "test_scoresテーブルにデータが存在しません"
    }

    return {
      success: true,
      studentsColumns,
      testScoresColumns,
      studentsError: studentsErrorMsg,
      testScoresError: testScoresErrorMsg,
    }
  } catch (error) {
    console.error("データベース構造確認エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "データベース構造の確認に失敗しました",
      studentsColumns: [],
      testScoresColumns: [],
    }
  }
}
