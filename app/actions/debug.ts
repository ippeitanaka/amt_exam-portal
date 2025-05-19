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

export async function checkDatabaseConnection() {
  try {
    console.log("データベース接続テストを開始します")
    console.log("SUPABASE_URL:", supabaseUrl ? "設定されています" : "未設定")
    console.log("SUPABASE_ANON_KEY:", supabaseAnonKey ? "設定されています" : "未設定")
    console.log("SERVICE_ROLE_KEY:", supabaseServiceRoleKey ? "設定されています" : "未設定")

    // 通常のクライアントでテスト
    const normalResult = await supabase.from("students").select("count").limit(1)

    // 管理者クライアントでテスト
    const adminResult = await adminSupabase.from("students").select("count").limit(1)

    // テーブル一覧を取得
    const { data: tableList, error: tableListError } = await adminSupabase.rpc("get_tables")

    return {
      success: true,
      normalClient: {
        error: normalResult.error ? normalResult.error.message : null,
        data: normalResult.data,
      },
      adminClient: {
        error: adminResult.error ? adminResult.error.message : null,
        data: adminResult.data,
      },
      tables: tableList || [],
      tablesError: tableListError ? tableListError.message : null,
    }
  } catch (error) {
    console.error("データベース接続テストエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "データベース接続テストに失敗しました",
    }
  }
}

export async function checkStudentsTable() {
  try {
    console.log("studentsテーブル確認を開始します")

    // テーブル構造を確認
    const { data: tableInfo, error: tableError } = await adminSupabase.from("students").select("*").limit(1)

    if (tableError) {
      console.error("テーブル構造確認エラー:", tableError)
      return {
        success: false,
        error: tableError.message,
      }
    }

    // 全レコード数を取得
    const { count, error: countError } = await adminSupabase
      .from("students")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("レコード数取得エラー:", countError)
      return {
        success: false,
        error: countError.message,
        structure: tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [],
      }
    }

    // サンプルレコードを取得
    const { data: sampleData, error: sampleError } = await adminSupabase.from("students").select("*").limit(5)

    return {
      success: true,
      structure: tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [],
      count,
      sampleData: sampleData || [],
      sampleError: sampleError ? sampleError.message : null,
    }
  } catch (error) {
    console.error("studentsテーブル確認エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "studentsテーブル確認に失敗しました",
    }
  }
}

export async function testStudentLogin(studentId: number, password: string) {
  try {
    console.log(`学生ログインテスト - ID: ${studentId}, パスワード: ${password}`)

    // studentsテーブルから学生情報を取得
    const { data, error } = await adminSupabase.from("students").select("*").eq("student_id", studentId).maybeSingle()

    if (error) {
      console.error("学生情報取得エラー:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    if (!data) {
      return {
        success: false,
        error: "学生IDが見つかりません",
      }
    }

    // パスワード検証
    const passwordMatch = data.password === password

    return {
      success: true,
      data: {
        ...data,
        password: "********", // パスワードを隠す
      },
      passwordMatch,
    }
  } catch (error) {
    console.error("学生ログインテストエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "学生ログインテストに失敗しました",
    }
  }
}
