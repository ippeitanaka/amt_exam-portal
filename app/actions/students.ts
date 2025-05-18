"use server"

import { createClient } from "@supabase/supabase-js"

// サーバーサイドでSupabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// 管理者用のクライアント（サービスロールキーを使用）
const adminSupabase = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : createClient(supabaseUrl, supabaseAnonKey)

// 通常のクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// getStudents関数を修正して、常にadminSupabaseを使用するようにします
export async function getStudents() {
  try {
    console.log("学生データ取得を開始します")

    // サービスロールキーを使用してstudentsテーブルからデータを取得
    console.log("studentsテーブルからデータを取得します（サービスロールキー使用）")
    const studentsResult = await adminSupabase.from("students").select("*").order("student_id", { ascending: true })

    if (studentsResult.error) {
      console.error("学生データ取得エラー:", studentsResult.error)
      // エラーが発生した場合はtest_scoresテーブルからのフォールバック取得を試みる
      return getStudentsFromTestScores()
    }

    if (!studentsResult.data || studentsResult.data.length === 0) {
      console.log("studentsテーブルにデータがありません、test_scoresテーブルから取得を試みます")
      return getStudentsFromTestScores()
    }

    console.log("studentsテーブルから", studentsResult.data.length, "件の学生データを取得しました")
    return { success: true, data: studentsResult.data, source: "students_table" }
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
    console.log("test_scoresテーブルからデータを取得します（サービスロールキー使用）")
    const testScoresResult = await adminSupabase
      .from("test_scores")
      .select("student_id")
      .order("student_id", { ascending: true })

    if (testScoresResult.error) {
      console.error("テスト結果からの学生データ取得エラー:", testScoresResult.error)
      return { success: false, error: testScoresResult.error.message, data: [] }
    }

    if (!testScoresResult.data || testScoresResult.data.length === 0) {
      console.log("test_scoresテーブルにもデータがありません")
      return { success: true, data: [], source: "no_data" }
    }

    // 一意の学生IDを抽出
    const uniqueStudentIds = new Map()

    for (const item of testScoresResult.data) {
      if (item.student_id && !uniqueStudentIds.has(item.student_id)) {
        uniqueStudentIds.set(item.student_id, {
          student_id: item.student_id,
          name: `学生${item.student_id}`, // student_nameがないので、学生IDから生成
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

// addOrUpdateStudent関数を修正して、常にadminSupabaseを使用するようにします
export async function addOrUpdateStudent(student: any) {
  try {
    // 入力値の検証
    if (!student || !student.student_id || !student.name || !student.password) {
      return { success: false, error: "必須フィールドが不足しています" }
    }

    console.log("学生データを保存します:", student)

    // まず既存の学生を確認（サービスロールキー使用）
    const { data: existingStudent, error: queryError } = await adminSupabase
      .from("students")
      .select("student_id")
      .eq("student_id", student.student_id)
      .maybeSingle()

    if (queryError) {
      console.error("学生データ検索エラー:", queryError)
      return { success: false, error: queryError.message }
    }

    let result

    try {
      if (existingStudent) {
        // 既存の学生を更新（サービスロールキー使用）
        console.log("既存の学生を更新します:", student.student_id)
        result = await adminSupabase
          .from("students")
          .update({
            name: student.name,
            password: student.password,
          })
          .eq("student_id", student.student_id)
      } else {
        // 新しい学生を挿入（サービスロールキー使用）
        console.log("新しい学生を挿入します:", student.student_id)
        result = await adminSupabase.from("students").insert({
          student_id: student.student_id,
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

// importStudents関数を修正して、サーバーサイドで学生データをインポートするようにします
export async function importStudents(students: any[]) {
  try {
    if (!students || students.length === 0) {
      return { success: false, error: "インポートするデータがありません" }
    }

    console.log("学生データをインポートします:", students.length, "件")

    let successCount = 0
    let errorCount = 0

    for (const student of students) {
      try {
        // 学生情報を保存（サービスロールキー使用）
        const result = await addOrUpdateStudent(student)

        if (result.success) {
          successCount++
        } else {
          errorCount++
          console.error("学生インポートエラー:", result.error)
        }
      } catch (err) {
        console.error("学生インポート処理エラー:", err)
        errorCount++
      }
    }

    console.log("学生データのインポートが完了しました:", successCount, "件成功,", errorCount, "件失敗")

    return {
      success: true,
      successCount,
      errorCount,
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

// checkDatabaseStructure関数を修正して、常にadminSupabaseを使用するようにします
export async function checkDatabaseStructure() {
  try {
    console.log("データベース構造を確認します")

    // studentsテーブルの構造を確認（サービスロールキー使用）
    const studentsResult = await adminSupabase.from("students").select("*").limit(1)

    // test_scoresテーブルの構造を確認（サービスロールキー使用）
    const testScoresResult = await adminSupabase.from("test_scores").select("*").limit(1)

    return {
      success: true,
      studentsColumns: studentsResult.data && studentsResult.data.length > 0 ? Object.keys(studentsResult.data[0]) : [],
      studentsError: studentsResult.error ? studentsResult.error.message : null,
      testScoresColumns:
        testScoresResult.data && testScoresResult.data.length > 0 ? Object.keys(testScoresResult.data[0]) : [],
      testScoresError: testScoresResult.error ? testScoresResult.error.message : null,
    }
  } catch (error) {
    console.error("データベース構造確認エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "データベース構造の確認に失敗しました",
    }
  }
}
