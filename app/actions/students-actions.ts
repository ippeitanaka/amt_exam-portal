"use server"

import { createClient } from "@supabase/supabase-js"

// 環境変数の取得と検証
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// プレビュー環境かどうかを検出（より厳格に）
const isPreviewEnvironment = (() => {
  try {
    // 複数の方法でプレビュー環境を検出
    const isVercelPreview = process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"

    const isDevelopment = process.env.NODE_ENV === "development"

    // Vercel環境変数がない場合もプレビューとみなす
    const noVercelEnv = !process.env.VERCEL_ENV && !process.env.NEXT_PUBLIC_VERCEL_ENV

    // v0.devのプレビュー環境を検出
    const isV0Preview =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("localhost"))

    console.log("環境検出:", {
      isVercelPreview,
      isDevelopment,
      noVercelEnv,
      isV0Preview,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
    })

    return isVercelPreview || isDevelopment || noVercelEnv || isV0Preview
  } catch (e) {
    console.error("環境検出エラー:", e)
    // エラーが発生した場合は安全のためにプレビュー環境とみなす
    return true
  }
})()

// デバッグ用のログ
console.log("プレビュー環境:", isPreviewEnvironment)
console.log("Supabase URL:", supabaseUrl ? "設定済み" : "未設定")
console.log("Supabase Service Role Key:", supabaseServiceRoleKey ? "設定済み" : "未設定")

// 環境変数のチェック
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceRoleKey)

// サービスロールキーを使用したクライアント（サーバーサイドのみ）
let adminSupabase: ReturnType<typeof createClient> | null = null
let isApiKeyValid = !isPreviewEnvironment // プレビュー環境では最初からAPIキーを無効とする
let apiKeyErrorMessage: string | null = isPreviewEnvironment ? "プレビュー環境ではSupabase接続を無効化しています" : null

// ローカルデータのサンプル（APIキーが無効な場合のフォールバック用）
const sampleLocalData = [
  {
    student_id: "1001",
    name: "サンプル学生1",
    password: "password",
    created_at: new Date().toISOString(),
    source: "sample",
  },
  {
    student_id: "1002",
    name: "サンプル学生2",
    password: "password",
    created_at: new Date().toISOString(),
    source: "sample",
  },
  {
    student_id: "1003",
    name: "サンプル学生3",
    password: "password",
    created_at: new Date().toISOString(),
    source: "sample",
  },
]

// テーブル名を定数化（診断結果に基づいて変更可能）
let STUDENTS_TABLE_NAME = "students"

// エラーをログに記録する関数
function errorLog(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error)
  return { message, error }
}

// Supabaseクライアントを初期化する関数
function initSupabaseClient() {
  // プレビュー環境では初期化をスキップ
  if (isPreviewEnvironment) {
    console.log("プレビュー環境のため、Supabaseクライアントを初期化しません")
    return null
  }

  // APIキーが無効な場合は初期化をスキップ
  if (!isApiKeyValid) {
    console.log("APIキーが無効なため、Supabaseクライアントを初期化しません")
    return null
  }

  // 環境変数が設定されていない場合は初期化をスキップ
  if (!isSupabaseConfigured) {
    console.log("Supabase環境変数が設定されていないため、Supabaseクライアントを初期化しません")
    return null
  }

  try {
    // APIキーが無効な場合のエラーをキャッチするためにtry-catchで囲む
    const client = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    return client
  } catch (error) {
    const logResult = errorLog("Supabaseクライアントの初期化エラー:", error)
    // 初期化エラーの場合はAPIキーを無効としてマーク
    isApiKeyValid = false
    apiKeyErrorMessage = error instanceof Error ? error.message : "Supabaseクライアントの初期化に失敗しました"
    return null
  }
}

// APIキーが無効かどうかをチェックする関数
function isApiKeyError(error: any): boolean {
  if (!error) return false

  const errorMessage = error.message || error.toString()
  return (
    errorMessage.includes("Invalid API key") ||
    errorMessage.includes("invalid api key") ||
    errorMessage.includes("JWT") ||
    errorMessage.includes("jwt") ||
    errorMessage.includes("invalid") ||
    errorMessage.includes("auth") ||
    errorMessage.includes("key") ||
    errorMessage.includes("token")
  )
}

// サーバーから学生データを取得する関数
export async function fetchStudentsFromServer() {
  try {
    // プレビュー環境では即座にサンプルデータを返す
    if (isPreviewEnvironment) {
      console.log("プレビュー環境のため、サンプルデータを返します")
      return {
        success: true,
        data: sampleLocalData,
        source: "sample_data",
        error: "プレビュー環境ではSupabase接続を無効化しています",
        isOfflineMode: true,
        isPreviewEnvironment: true,
      }
    }

    // APIキーが既に無効とマークされている場合は、即座にサンプルデータを返す
    if (!isApiKeyValid) {
      console.log("APIキーが無効なため、サンプルデータを返します:", apiKeyErrorMessage)
      return {
        success: true, // クライアントでのエラー処理を避けるためにtrueを返す
        data: sampleLocalData,
        source: "sample_data",
        error: `APIキーが無効です: ${apiKeyErrorMessage}`,
        isOfflineMode: true,
      }
    }

    // 環境変数が設定されていない場合もサンプルデータを返す
    if (!isSupabaseConfigured) {
      console.log("Supabase環境変数が設定されていないため、サンプルデータを返します")
      return {
        success: true,
        data: sampleLocalData,
        source: "sample_data",
        error:
          "Supabase環境変数が設定されていません。環境変数 NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を確認してください。",
        isOfflineMode: true,
      }
    }

    console.log("サーバーサイドで学生データ取得を開始します")
    console.log(`テーブル名: ${STUDENTS_TABLE_NAME}`)

    // Supabaseクライアントを初期化
    if (!adminSupabase) {
      adminSupabase = initSupabaseClient()
      if (!adminSupabase) {
        // クライアント初期化に失敗した場合はサンプルデータを返す
        isApiKeyValid = false
        return {
          success: true,
          data: sampleLocalData,
          source: "sample_data",
          error: "Supabaseクライアントの初期化に失敗しました",
          isOfflineMode: true,
        }
      }
    }

    // サービスロールキーを使用してstudentsテーブルからデータを取得
    try {
      const { data, error } = await adminSupabase
        .from(STUDENTS_TABLE_NAME)
        .select("*")
        .order("student_id", { ascending: true })

      if (error) {
        errorLog(`学生データ取得エラー (${STUDENTS_TABLE_NAME}):`, error)

        // APIキーエラーの場合
        if (isApiKeyError(error)) {
          isApiKeyValid = false
          apiKeyErrorMessage = error.message
          return {
            success: true, // クライアントでのエラー処理を避けるためにtrueを返す
            data: sampleLocalData,
            source: "sample_data",
            error: `APIキーが無効です: ${error.message}`,
            isApiKeyError: true,
            isOfflineMode: true,
          }
        }

        // 別のテーブル名を試す
        const altTableName = STUDENTS_TABLE_NAME === "students" ? "Students" : "students"
        console.log(`代替テーブル名 ${altTableName} を試します`)

        try {
          const { data: altData, error: altError } = await adminSupabase
            .from(altTableName)
            .select("*")
            .order("student_id", { ascending: true })

          if (!altError) {
            console.log(`${altTableName} テーブルからデータ取得成功:`, altData?.length || 0, "件")
            // 成功したテーブル名を記憶
            STUDENTS_TABLE_NAME = altTableName
            return { success: true, data: altData || [], source: "students_table" }
          }
        } catch (altErr) {
          errorLog(`代替テーブル ${altTableName} へのアクセスエラー:`, altErr)

          // APIキーエラーの場合
          if (isApiKeyError(altErr)) {
            isApiKeyValid = false
            apiKeyErrorMessage = altErr instanceof Error ? altErr.message : String(altErr)
            return {
              success: true,
              data: sampleLocalData,
              source: "sample_data",
              error: `APIキーが無効です: ${apiKeyErrorMessage}`,
              isApiKeyError: true,
              isOfflineMode: true,
            }
          }
        }

        // テーブルエラーの場合はサンプルデータを返す
        return {
          success: true,
          data: sampleLocalData,
          source: "sample_data",
          error: error.message,
          isOfflineMode: true,
        }
      }

      console.log("学生データを取得しました:", data?.length || 0, "件")
      if (data && data.length > 0) {
        console.log("最初のレコード:", data[0])
      }

      return { success: true, data: data || [], source: "students_table" }
    } catch (queryError) {
      errorLog("クエリ実行エラー:", queryError)

      // APIキーエラーの場合
      if (isApiKeyError(queryError)) {
        isApiKeyValid = false
        apiKeyErrorMessage = queryError instanceof Error ? queryError.message : String(queryError)
        return {
          success: true,
          data: sampleLocalData,
          source: "sample_data",
          error: `APIキーが無効です: ${apiKeyErrorMessage}`,
          isApiKeyError: true,
          isOfflineMode: true,
        }
      }

      return {
        success: true,
        data: sampleLocalData,
        source: "sample_data",
        error: queryError instanceof Error ? queryError.message : "クエリの実行中にエラーが発生しました",
        isOfflineMode: true,
      }
    }
  } catch (error) {
    errorLog("学生データ取得エラー:", error)

    // APIキーエラーの場合
    if (isApiKeyError(error)) {
      isApiKeyValid = false
      apiKeyErrorMessage = error instanceof Error ? error.message : String(error)
    }

    // エラーをスローせずに、サンプルデータを返す
    return {
      success: true,
      data: sampleLocalData,
      source: "sample_data",
      error: error instanceof Error ? error.message : "学生データの取得に失敗しました",
      isOfflineMode: true,
    }
  }
}

// 学生データをローカルストレージと統合するためのヘルパー関数
export async function getStudentsWithFallback() {
  try {
    // プレビュー環境では即座にサンプルデータを返す
    if (isPreviewEnvironment) {
      console.log("プレビュー環境のため、サンプルデータを返します")
      return {
        success: true,
        data: sampleLocalData,
        source: "sample_data",
        error: "プレビュー環境ではSupabase接続を無効化しています",
        isOfflineMode: true,
        isPreviewEnvironment: true,
      }
    }

    // APIキーが既に無効とマークされている場合は、即座にサンプルデータを返す
    if (!isApiKeyValid) {
      console.log("APIキーが無効なため、サンプルデータを返します:", apiKeyErrorMessage)
      return {
        success: true,
        data: sampleLocalData,
        source: "sample_data",
        error: `APIキーが無効です: ${apiKeyErrorMessage}`,
        isOfflineMode: true,
      }
    }

    // 環境変数が設定されていない場合もサンプルデータを返す
    if (!isSupabaseConfigured) {
      console.log("Supabase環境変数が設定されていないため、サンプルデータを返します")
      return {
        success: true,
        data: sampleLocalData,
        source: "sample_data",
        error:
          "Supabase環境変数が設定されていません。環境変数 NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を確認してください。",
        isOfflineMode: true,
      }
    }

    // まずサーバーサイドでstudentsテーブルからデータを取得
    const result = await fetchStudentsFromServer().catch((error) => {
      errorLog("fetchStudentsFromServer エラー:", error)
      // エラーが発生した場合はサンプルデータを返す
      return {
        success: true,
        data: sampleLocalData,
        source: "error_fallback",
        error: error instanceof Error ? error.message : "データ取得中にエラーが発生しました",
        isOfflineMode: true,
      }
    })

    // 成功した場合はそのまま返す
    if (result.success && !result.isOfflineMode) {
      return result
    }

    // エラーまたはオフラインモードの場合はサンプルデータを返す
    return {
      success: true,
      data: result.data || sampleLocalData,
      source: result.source || "sample_data",
      error: result.error,
      isOfflineMode: true,
    }
  } catch (error) {
    errorLog("学生データ取得エラー:", error)

    // APIキーエラーの場合
    if (isApiKeyError(error)) {
      isApiKeyValid = false
      apiKeyErrorMessage = error instanceof Error ? error.message : String(error)
    }

    // 最終的なフォールバック - サンプルデータを返す
    return {
      success: true,
      data: sampleLocalData,
      source: "sample_data",
      error: error instanceof Error ? error.message : "学生データの取得に失敗しました",
      isOfflineMode: true,
    }
  }
}

// テーブル名を設定する関数
export async function setStudentsTableName(tableName: string) {
  STUDENTS_TABLE_NAME = tableName
  return { success: true, tableName }
}

// 環境変数の状態を確認する関数
export async function checkEnvironmentVariables() {
  return {
    supabaseUrl: {
      defined: !!supabaseUrl,
      value: supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : undefined,
    },
    supabaseServiceRoleKey: {
      defined: !!supabaseServiceRoleKey,
      value: supabaseServiceRoleKey ? `${supabaseServiceRoleKey.substring(0, 3)}...` : undefined,
    },
    isSupabaseConfigured,
    isApiKeyValid,
    apiKeyErrorMessage,
    isPreviewEnvironment,
    environment: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "unknown",
  }
}

// APIキーの状態をリセットする関数（診断ツールから呼び出し可能）
export async function resetApiKeyStatus() {
  // プレビュー環境ではリセットしない
  if (isPreviewEnvironment) {
    return {
      success: false,
      message: "プレビュー環境ではAPIキーの状態をリセットできません",
      isPreviewEnvironment: true,
    }
  }

  isApiKeyValid = true
  apiKeyErrorMessage = null
  adminSupabase = null
  return { success: true }
}
