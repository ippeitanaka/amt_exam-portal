"use server"

import { createClient } from "@supabase/supabase-js"
import { resetApiKeyStatus } from "./students-actions"

// 環境変数の取得と検証
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// プレビュー環境かどうかを検出
const isPreviewEnvironment =
  process.env.VERCEL_ENV === "preview" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
  process.env.NODE_ENV === "development" ||
  !process.env.VERCEL_ENV // Vercel環境変数がない場合もプレビューとみなす

// 環境変数のチェック
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceRoleKey)

// サービスロールキーを使用したクライアント（サーバーサイドのみ）
let adminSupabase: ReturnType<typeof createClient> | null = null

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

// Supabaseクライアントを初期化する関数
function initSupabaseClient() {
  // プレビュー環境では初期化をスキップ
  if (isPreviewEnvironment) {
    console.log("プレビュー環境のため、Supabaseクライアントを初期化しません")
    return null
  }

  if (!isSupabaseConfigured) {
    console.error("Supabase環境変数が設定されていません")
    return null
  }

  try {
    return createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Supabaseクライアントの初期化エラー:", error)
    return null
  }
}

export async function diagnoseStudentsTable() {
  // プレビュー環境では診断をスキップ
  if (isPreviewEnvironment) {
    return {
      success: false,
      message: "プレビュー環境では診断を実行できません",
      isPreviewEnvironment: true,
      environmentVariables: {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceRoleKey: !!supabaseServiceRoleKey,
      },
    }
  }

  try {
    console.log("診断: students テーブルの診断を開始します")
    console.log("Supabase URL:", supabaseUrl || "未設定")
    console.log("Service Role Key 設定済み:", !!supabaseServiceRoleKey)

    // 環境変数が設定されていない場合はエラーを返す
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message:
          "Supabase環境変数が設定されていません。環境変数 NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を確認してください。",
        environmentVariables: {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceRoleKey: !!supabaseServiceRoleKey,
        },
      }
    }

    // Supabaseクライアントを初期化
    if (!adminSupabase) {
      adminSupabase = initSupabaseClient()
      if (!adminSupabase) {
        return {
          success: false,
          message: "Supabaseクライアントの初期化に失敗しました",
          environmentVariables: {
            supabaseUrl: !!supabaseUrl,
            supabaseServiceRoleKey: !!supabaseServiceRoleKey,
          },
        }
      }
    }

    // テーブル一覧を取得
    try {
      const { data: tableList, error: tableError } = await adminSupabase.from("students").select("*").limit(1)

      if (tableError) {
        console.error("診断: students テーブルへのアクセスエラー:", tableError)

        // APIキーエラーの場合
        if (isApiKeyError(tableError)) {
          return {
            success: false,
            message: `APIキーが無効です: ${tableError.message}`,
            error: tableError,
            environmentVariables: {
              supabaseUrl: !!supabaseUrl,
              supabaseServiceRoleKey: !!supabaseServiceRoleKey,
            },
            isApiKeyError: true,
          }
        }

        // テーブル名の大文字小文字を変えて試す
        console.log("診断: 'Students' テーブルを試します")
        try {
          const { data: altData, error: altError } = await adminSupabase.from("Students").select("*").limit(1)

          if (altError) {
            console.error("診断: 'Students' テーブルへのアクセスエラー:", altError)

            // APIキーエラーの場合
            if (isApiKeyError(altError)) {
              return {
                success: false,
                message: `APIキーが無効です: ${altError.message}`,
                error: altError,
                environmentVariables: {
                  supabaseUrl: !!supabaseUrl,
                  supabaseServiceRoleKey: !!supabaseServiceRoleKey,
                },
                isApiKeyError: true,
              }
            }
          } else {
            console.log("診断: 'Students' テーブルにアクセス成功:", altData)
            return {
              success: true,
              message: "'students'テーブルではなく'Students'テーブルが存在します",
              data: altData,
              correctTableName: "Students",
              environmentVariables: {
                supabaseUrl: !!supabaseUrl,
                supabaseServiceRoleKey: !!supabaseServiceRoleKey,
              },
            }
          }
        } catch (altErr) {
          console.error("診断: 'Students' テーブルへのアクセス中にエラーが発生しました:", altErr)

          // APIキーエラーの場合
          if (isApiKeyError(altErr)) {
            return {
              success: false,
              message: `APIキーが無効です: ${altErr instanceof Error ? altErr.message : String(altErr)}`,
              error: altErr,
              environmentVariables: {
                supabaseUrl: !!supabaseUrl,
                supabaseServiceRoleKey: !!supabaseServiceRoleKey,
              },
              isApiKeyError: true,
            }
          }
        }

        return {
          success: false,
          message: `studentsテーブルへのアクセスエラー: ${tableError.message}`,
          error: tableError,
          environmentVariables: {
            supabaseUrl: !!supabaseUrl,
            supabaseServiceRoleKey: !!supabaseServiceRoleKey,
          },
        }
      }

      // テーブル構造を確認
      console.log("診断: students テーブル構造:", tableList)

      // 全データを取得
      try {
        const { data: allData, error: dataError } = await adminSupabase.from("students").select("*")

        if (dataError) {
          console.error("診断: 全データ取得エラー:", dataError)

          // APIキーエラーの場合
          if (isApiKeyError(dataError)) {
            return {
              success: false,
              message: `APIキーが無効です: ${dataError.message}`,
              error: dataError,
              environmentVariables: {
                supabaseUrl: !!supabaseUrl,
                supabaseServiceRoleKey: !!supabaseServiceRoleKey,
              },
              isApiKeyError: true,
            }
          }

          return {
            success: false,
            message: `全データ取得エラー: ${dataError.message}`,
            error: dataError,
            environmentVariables: {
              supabaseUrl: !!supabaseUrl,
              supabaseServiceRoleKey: !!supabaseServiceRoleKey,
            },
          }
        }

        console.log("診断: 取得したデータ数:", allData?.length || 0)

        return {
          success: true,
          message: `studentsテーブルから${allData?.length || 0}件のデータを取得しました`,
          data: allData,
          correctTableName: "students",
          environmentVariables: {
            supabaseUrl: !!supabaseUrl,
            supabaseServiceRoleKey: !!supabaseServiceRoleKey,
          },
        }
      } catch (dataErr) {
        console.error("診断: データ取得中にエラーが発生しました:", dataErr)

        // APIキーエラーの場合
        if (isApiKeyError(dataErr)) {
          return {
            success: false,
            message: `APIキーが無効です: ${dataErr instanceof Error ? dataErr.message : String(dataErr)}`,
            error: dataErr,
            environmentVariables: {
              supabaseUrl: !!supabaseUrl,
              supabaseServiceRoleKey: !!supabaseServiceRoleKey,
            },
            isApiKeyError: true,
          }
        }

        return {
          success: false,
          message: `データ取得中にエラーが発生しました: ${dataErr instanceof Error ? dataErr.message : String(dataErr)}`,
          error: dataErr,
          environmentVariables: {
            supabaseUrl: !!supabaseUrl,
            supabaseServiceRoleKey: !!supabaseServiceRoleKey,
          },
        }
      }
    } catch (queryErr) {
      console.error("診断: クエリ実行中にエラーが発生しました:", queryErr)

      // APIキーエラーの場合
      if (isApiKeyError(queryErr)) {
        return {
          success: false,
          message: `APIキーが無効です: ${queryErr instanceof Error ? queryErr.message : String(queryErr)}`,
          error: queryErr,
          environmentVariables: {
            supabaseUrl: !!supabaseUrl,
            supabaseServiceRoleKey: !!supabaseServiceRoleKey,
          },
          isApiKeyError: true,
        }
      }

      return {
        success: false,
        message: `クエリ実行中にエラーが発生しました: ${queryErr instanceof Error ? queryErr.message : String(queryErr)}`,
        error: queryErr,
        environmentVariables: {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceRoleKey: !!supabaseServiceRoleKey,
        },
      }
    }
  } catch (error) {
    console.error("診断エラー:", error)

    // APIキーエラーの場合
    if (isApiKeyError(error)) {
      return {
        success: false,
        message: `APIキーが無効です: ${error instanceof Error ? error.message : String(error)}`,
        error,
        environmentVariables: {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceRoleKey: !!supabaseServiceRoleKey,
        },
        isApiKeyError: true,
      }
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "不明なエラーが発生しました",
      error,
      environmentVariables: {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceRoleKey: !!supabaseServiceRoleKey,
      },
    }
  }
}

// APIキーをテストする関数
export async function testApiKey() {
  // プレビュー環境ではテストをスキップ
  if (isPreviewEnvironment) {
    return {
      success: false,
      message: "プレビュー環境ではAPIキーをテストできません",
      isPreviewEnvironment: true,
      environmentVariables: {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceRoleKey: !!supabaseServiceRoleKey,
      },
    }
  }

  try {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: "Supabase環境変数が設定されていません",
        environmentVariables: {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceRoleKey: !!supabaseServiceRoleKey,
        },
      }
    }

    // APIキーの状態をリセット
    await resetApiKeyStatus()

    // Supabaseクライアントを初期化
    try {
      const testClient = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      // 簡単なクエリを実行してAPIキーをテスト
      try {
        const { error } = await testClient.from("_test").select("*").limit(1)

        if (error) {
          // エラーメッセージからAPIキーの問題を特定
          if (isApiKeyError(error)) {
            return {
              success: false,
              message: `APIキーが無効です: ${error.message}`,
              error,
              environmentVariables: {
                supabaseUrl: !!supabaseUrl,
                supabaseServiceRoleKey: !!supabaseServiceRoleKey,
              },
              isAuthError: true,
              apiKeyDetails: {
                length: supabaseServiceRoleKey?.length || 0,
                prefix: supabaseServiceRoleKey?.substring(0, 3) || "",
                format: supabaseServiceRoleKey?.includes(".") ? "JWT形式" : "不明な形式",
              },
            }
          }

          // テーブルが存在しないエラーは正常（APIキーは有効）
          if (error.message?.includes("does not exist") || error.code === "42P01") {
            return {
              success: true,
              message: "APIキーは有効です。_testテーブルは存在しませんが、これは予期された動作です。",
              environmentVariables: {
                supabaseUrl: !!supabaseUrl,
                supabaseServiceRoleKey: !!supabaseServiceRoleKey,
              },
            }
          }

          return {
            success: false,
            message: `APIキーテストエラー: ${error.message}`,
            error,
            environmentVariables: {
              supabaseUrl: !!supabaseUrl,
              supabaseServiceRoleKey: !!supabaseServiceRoleKey,
            },
          }
        }

        // エラーがない場合（_testテーブルが存在する場合）
        return {
          success: true,
          message: "APIキーは有効です",
          environmentVariables: {
            supabaseUrl: !!supabaseUrl,
            supabaseServiceRoleKey: !!supabaseServiceRoleKey,
          },
        }
      } catch (queryError) {
        // クエリ実行中の例外
        console.error("APIキーテスト中のクエリエラー:", queryError)

        // APIキーエラーの場合
        if (isApiKeyError(queryError)) {
          return {
            success: false,
            message: `APIキーが無効です: ${queryError instanceof Error ? queryError.message : String(queryError)}`,
            error: queryError,
            environmentVariables: {
              supabaseUrl: !!supabaseUrl,
              supabaseServiceRoleKey: !!supabaseServiceRoleKey,
            },
            isAuthError: true,
            apiKeyDetails: {
              length: supabaseServiceRoleKey?.length || 0,
              prefix: supabaseServiceRoleKey?.substring(0, 3) || "",
              format: supabaseServiceRoleKey?.includes(".") ? "JWT形式" : "不明な形式",
            },
          }
        }

        return {
          success: false,
          message: `APIキーのテスト中にクエリエラーが発生しました: ${queryError instanceof Error ? queryError.message : String(queryError)}`,
          error: queryError,
          environmentVariables: {
            supabaseUrl: !!supabaseUrl,
            supabaseServiceRoleKey: !!supabaseServiceRoleKey,
          },
        }
      }
    } catch (clientError) {
      // クライアント初期化中の例外
      console.error("Supabaseクライアント初期化エラー:", clientError)

      // APIキーエラーの場合
      if (isApiKeyError(clientError)) {
        return {
          success: false,
          message: `APIキーが無効です: ${clientError instanceof Error ? clientError.message : String(clientError)}`,
          error: clientError,
          environmentVariables: {
            supabaseUrl: !!supabaseUrl,
            supabaseServiceRoleKey: !!supabaseServiceRoleKey,
          },
          isAuthError: true,
          apiKeyDetails: {
            length: supabaseServiceRoleKey?.length || 0,
            prefix: supabaseServiceRoleKey?.substring(0, 3) || "",
            format: supabaseServiceRoleKey?.includes(".") ? "JWT形式" : "不明な形式",
          },
        }
      }

      return {
        success: false,
        message: `Supabaseクライアントの初期化に失敗しました: ${clientError instanceof Error ? clientError.message : String(clientError)}`,
        error: clientError,
        environmentVariables: {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceRoleKey: !!supabaseServiceRoleKey,
        },
      }
    }
  } catch (error) {
    console.error("APIキーテスト中の一般エラー:", error)

    // APIキーエラーの場合
    if (isApiKeyError(error)) {
      return {
        success: false,
        message: `APIキーが無効です: ${error instanceof Error ? error.message : String(error)}`,
        error,
        environmentVariables: {
          supabaseUrl: !!supabaseUrl,
          supabaseServiceRoleKey: !!supabaseServiceRoleKey,
        },
        isAuthError: true,
        apiKeyDetails: {
          length: supabaseServiceRoleKey?.length || 0,
          prefix: supabaseServiceRoleKey?.substring(0, 3) || "",
          format: supabaseServiceRoleKey?.includes(".") ? "JWT形式" : "不明な形式",
        },
      }
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "APIキーのテスト中に不明なエラーが発生しました",
      error,
      environmentVariables: {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceRoleKey: !!supabaseServiceRoleKey,
      },
    }
  }
}

// 代替テーブルを検索する関数
export async function findAlternativeTables() {
  // プレビュー環境では検索をスキップ
  if (isPreviewEnvironment) {
    return {
      success: false,
      message: "プレビュー環境ではテーブル検索を実行できません",
      isPreviewEnvironment: true,
      tables: [],
    }
  }

  try {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: "Supabase環境変数が設定されていません",
        tables: [],
      }
    }

    // Supabaseクライアントを初期化
    if (!adminSupabase) {
      adminSupabase = initSupabaseClient()
      if (!adminSupabase) {
        return {
          success: false,
          message: "Supabaseクライアントの初期化に失敗しました",
          tables: [],
        }
      }
    }

    // 一般的なテーブル名のバリエーションを試す
    const tableVariations = ["students", "Students", "STUDENTS", "student", "Student", "STUDENT"]
    const foundTables = []

    for (const tableName of tableVariations) {
      try {
        const { data, error } = await adminSupabase.from(tableName).select("*").limit(1)
        if (!error) {
          foundTables.push({
            name: tableName,
            recordCount: data?.length || 0,
            sample: data && data.length > 0 ? data[0] : null,
          })
        }
      } catch (e) {
        // APIキーエラーの場合は処理を中断
        if (isApiKeyError(e)) {
          return {
            success: false,
            message: `APIキーが無効です: ${e instanceof Error ? e.message : String(e)}`,
            error: e,
            tables: [],
            isApiKeyError: true,
          }
        }
        // その他のエラーは無視して次のテーブルを試す
      }
    }

    return {
      success: true,
      message: `${foundTables.length}個のテーブルが見つかりました`,
      tables: foundTables,
    }
  } catch (error) {
    // APIキーエラーの場合
    if (isApiKeyError(error)) {
      return {
        success: false,
        message: `APIキーが無効です: ${error instanceof Error ? error.message : String(error)}`,
        error,
        tables: [],
        isApiKeyError: true,
      }
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "テーブル検索中に不明なエラーが発生しました",
      error,
      tables: [],
    }
  }
}
