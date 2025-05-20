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

export async function checkDatabase() {
  try {
    console.log("データベース接続確認を開始します")
    const supabase = createSupabaseClient()

    // 接続テスト
    const { data: pingData, error: pingError } = await supabase
      .from("students")
      .select("count()", { count: "exact", head: true })

    if (pingError) {
      console.error("データベース接続エラー:", pingError)
      return {
        success: false,
        error: pingError.message,
        details: {
          code: pingError.code,
          message: pingError.message,
          hint: pingError.hint,
        },
      }
    }

    // テーブル存在確認
    const tables = ["students", "test_scores"]
    const tableResults = {}

    for (const table of tables) {
      try {
        console.log(`${table}テーブル確認中...`)
        const { data, error } = await supabase.from(table).select("count()", { count: "exact", head: true })

        if (error) {
          console.error(`${table}テーブル確認エラー:`, error)
          tableResults[table] = {
            exists: false,
            error: error.message,
            details: {
              code: error.code,
              hint: error.hint,
            },
          }
        } else {
          console.log(`${table}テーブル確認完了`)
          tableResults[table] = { exists: true }

          // サンプルデータを取得
          const { data: sampleData, error: sampleError } = await supabase.from(table).select("*").limit(2)

          if (sampleError) {
            tableResults[table].sampleError = sampleError.message
          } else {
            tableResults[table].sampleCount = sampleData?.length || 0
            tableResults[table].sampleData = sampleData

            // カラム情報を取得
            if (sampleData && sampleData.length > 0) {
              tableResults[table].columns = Object.keys(sampleData[0])
            }
          }
        }
      } catch (e) {
        console.error(`${table}テーブル確認エラー:`, e)
        tableResults[table] = {
          exists: false,
          error: e instanceof Error ? e.message : "不明なエラー",
        }
      }
    }

    // 学生ログイン検証テスト
    const testStudentId = "222056"
    const testPassword = "2056"
    console.log(`テスト学生認証を試みます: ID=${testStudentId}, パスワード=${testPassword}`)

    // 異なる方法で学生を検索
    const authMethods = [
      {
        name: "文字列として検索",
        query: () => supabase.from("students").select("*").eq("student_id", testStudentId).maybeSingle(),
      },
      {
        name: "数値として検索",
        query: () =>
          supabase.from("students").select("*").eq("student_id", Number.parseInt(testStudentId)).maybeSingle(),
      },
      {
        name: "IDとして検索",
        query: () => supabase.from("students").select("*").eq("id", testStudentId).maybeSingle(),
      },
    ]

    const authResults = []
    for (const method of authMethods) {
      try {
        const { data, error } = await method.query()
        authResults.push({
          method: method.name,
          success: !error && data !== null,
          data: data
            ? {
                id: data.id,
                student_id: data.student_id,
                name: data.name,
                password_matches: data.password === testPassword,
              }
            : null,
          error: error ? error.message : null,
        })
      } catch (e) {
        authResults.push({
          method: method.name,
          success: false,
          error: e instanceof Error ? e.message : "不明なエラー",
        })
      }
    }

    return {
      success: true,
      tableResults,
      authResults,
      environment: {
        url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        anon_key_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    }
  } catch (error) {
    console.error("データベース確認エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "データベース確認に失敗しました",
    }
  }
}

export async function testStudentLogin(studentId: string, password: string) {
  try {
    console.log(`学生ログインテスト: ID=${studentId}, パスワード=${password ? "****" : "なし"}`)
    const supabase = createSupabaseClient()

    // 異なる方法で学生を検索
    const queries = [
      {
        name: "文字列として検索",
        query: supabase.from("students").select("*").eq("student_id", studentId).maybeSingle(),
      },
      {
        name: "数値として検索",
        query: supabase.from("students").select("*").eq("student_id", Number.parseInt(studentId)).maybeSingle(),
      },
      { name: "IDとして検索", query: supabase.from("students").select("*").eq("id", studentId).maybeSingle() },
    ]

    const results = await Promise.all(queries.map((q) => q.query.catch((err) => ({ error: err }))))

    const queryResults = queries.map((q, i) => ({
      method: q.name,
      success: !results[i].error && results[i].data !== null,
      data: results[i].data
        ? {
            id: results[i].data.id,
            student_id: results[i].data.student_id,
            name: results[i].data.name,
            password_matches: results[i].data.password === password,
          }
        : null,
      error: results[i].error ? results[i].error.message : null,
    }))

    // 全データからの検証
    const { data: allStudents, error: allStudentsError } = await supabase.from("students").select("*").limit(10)

    let matchedStudent = null
    if (!allStudentsError && allStudents && allStudents.length > 0) {
      // IDが完全一致する学生を検索
      const exact = allStudents.find(
        (s) => String(s.student_id) === studentId || s.student_id === Number.parseInt(studentId),
      )

      if (exact) {
        matchedStudent = {
          id: exact.id,
          student_id: exact.student_id,
          name: exact.name,
          password_matches: exact.password === password,
        }
      }
    }

    const allData = {
      count: allStudents?.length || 0,
      sample: allStudents?.slice(0, 3),
      matched: matchedStudent,
    }

    return {
      success: true,
      queryResults,
      allData,
      recommendation: matchedStudent
        ? matchedStudent.password_matches
          ? "認証成功: 正しい学生IDとパスワードです"
          : "学生IDは正しいですが、パスワードが一致しません"
        : "学生IDが見つかりませんでした。別のIDを試すか、データベースを確認してください",
    }
  } catch (error) {
    console.error("学生ログインテストエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "学生ログインテストに失敗しました",
    }
  }
}

export async function checkEnvironment() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "設定済み" : "未設定",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "設定済み" : "未設定",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "設定済み" : "未設定",
  }

  return { success: true, envVars }
}
