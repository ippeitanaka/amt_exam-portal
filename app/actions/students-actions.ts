"use server"

import { createClient } from "@supabase/supabase-js"

// サーバーサイドでSupabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// サービスロールキーを使用したクライアント（サーバーサイドのみ）
const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function fetchStudentsFromServer() {
  try {
    console.log("サーバーサイドで学生データ取得を開始します")

    // サービスロールキーを使用してstudentsテーブルからデータを取得
    const { data, error } = await adminSupabase.from("students").select("*").order("student_id", { ascending: true })

    if (error) {
      console.error("学生データ取得エラー:", error)
      return { success: false, error: error.message, data: [] }
    }

    console.log("学生データを取得しました:", data?.length || 0, "件")
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("学生データ取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "学生データの取得に失敗しました",
      data: [],
    }
  }
}

// 学生データをローカルストレージと統合するためのヘルパー関数
export async function getStudentsWithFallback() {
  try {
    // まずサーバーサイドでstudentsテーブルからデータを取得
    const result = await fetchStudentsFromServer()

    if (result.success && result.data.length > 0) {
      return { success: true, data: result.data, source: "students_table" }
    }

    // studentsテーブルからのデータ取得に失敗した場合、test_scoresテーブルから取得を試みる
    console.log("test_scoresテーブルからデータを取得します")

    const { data: testScoresData, error: testScoresError } = await adminSupabase
      .from("test_scores")
      .select("student_id")
      .order("student_id", { ascending: true })

    if (testScoresError) {
      console.error("テスト結果からの学生データ取得エラー:", testScoresError)
      return { success: false, error: testScoresError.message, data: [] }
    }

    if (!testScoresData || testScoresData.length === 0) {
      console.log("test_scoresテーブルにもデータがありません")
      return { success: true, data: [], source: "no_data" }
    }

    // 一意の学生IDを抽出
    const uniqueStudentIds = new Map()

    for (const item of testScoresData) {
      if (item.student_id && !uniqueStudentIds.has(item.student_id)) {
        uniqueStudentIds.set(item.student_id, {
          student_id: item.student_id,
          name: `学生${item.student_id}`,
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
