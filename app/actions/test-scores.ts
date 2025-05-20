"use server"

import { createClient } from "@supabase/supabase-js"

// サーバーサイドでSupabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// 管理者用のクライアント（サービスロールキーが設定されている場合のみ使用）
const adminSupabase = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : createClient(supabaseUrl, supabaseAnonKey)

// 通常のクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 重複を排除する関数（同じ学生IDでも異なるテスト名・日付のデータは保持）
function removeDuplicates(data: any[]) {
  // id, test_name, test_dateの組み合わせをキーとして使用して重複を排除
  const uniqueMap = new Map()
  data.forEach((item) => {
    const key = `${item.id}`
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item)
    }
  })
  return Array.from(uniqueMap.values())
}

// 同じ学生の同じテスト・同じ日付の重複のみを排除する関数
function removeTestDuplicates(data: any[]) {
  // student_id, test_name, test_dateの組み合わせをキーとして使用して重複を排除
  const uniqueMap = new Map()
  data.forEach((item) => {
    const key = `${item.student_id}_${item.test_name}_${item.test_date}`
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item)
    }
  })
  return Array.from(uniqueMap.values())
}

export async function getTestResults() {
  try {
    console.log("テスト結果取得を開始します")

    // まず通常のクライアントで試す
    let result = await supabase.from("test_scores").select("*").order("test_date", { ascending: false })

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (result.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      result = await adminSupabase.from("test_scores").select("*").order("test_date", { ascending: false })
    }

    if (result.error) {
      console.error("テスト結果取得エラー:", result.error)
      return { success: false, error: result.error.message, data: [] }
    }

    // 重複を排除（IDのみで重複を判断）
    const uniqueData = removeDuplicates(result.data || [])

    console.log("テスト結果を取得しました:", result.data?.length || 0, "件")
    console.log("重複排除後:", uniqueData.length, "件")

    return { success: true, data: uniqueData }
  } catch (error) {
    console.error("テスト結果取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果の取得に失敗しました",
      data: [],
    }
  }
}

// 特定の学生のテスト結果を取得する関数
export async function getStudentTestResults(studentId: string | number) {
  try {
    console.log(`学生ID ${studentId} のテスト結果取得を開始します`)

    // 学生IDを文字列に変換
    const studentIdStr = String(studentId).trim()

    // 数値に変換可能か確認
    const studentIdNum = Number.parseInt(studentIdStr, 10)
    const isNumeric = !isNaN(studentIdNum)

    console.log(`検索条件: 文字列=${studentIdStr}, 数値=${isNumeric ? studentIdNum : "変換不可"}`)

    // 複数の方法を試みる
    let data = null
    let error = null

    // 方法1: 文字列として検索
    console.log("方法1: 文字列として検索")
    const stringResult = await adminSupabase
      .from("test_scores")
      .select("*")
      .eq("student_id", studentIdStr)
      .order("test_date", { ascending: false })

    if (stringResult.error) {
      console.error("文字列検索エラー:", stringResult.error)
      error = stringResult.error
    } else if (stringResult.data && stringResult.data.length > 0) {
      console.log(`文字列検索で ${stringResult.data.length} 件のデータが見つかりました`)
      data = stringResult.data
    } else {
      console.log("文字列検索ではデータが見つかりませんでした")
    }

    // 方法2: 数値として検索（数値変換可能な場合のみ）
    if (!data && isNumeric) {
      console.log("方法2: 数値として検索")
      const numericResult = await adminSupabase
        .from("test_scores")
        .select("*")
        .eq("student_id", studentIdNum)
        .order("test_date", { ascending: false })

      if (numericResult.error) {
        console.error("数値検索エラー:", numericResult.error)
        if (!error) error = numericResult.error
      } else if (numericResult.data && numericResult.data.length > 0) {
        console.log(`数値検索で ${numericResult.data.length} 件のデータが見つかりました`)
        data = numericResult.data
      } else {
        console.log("数値検索ではデータが見つかりませんでした")
      }
    }

    // 方法3: OR条件で検索
    if (!data) {
      console.log("方法3: OR条件で検索")
      const orQuery = isNumeric
        ? `student_id.eq.${studentIdStr},student_id.eq.${studentIdNum}`
        : `student_id.eq.${studentIdStr}`

      const orResult = await adminSupabase
        .from("test_scores")
        .select("*")
        .or(orQuery)
        .order("test_date", { ascending: false })

      if (orResult.error) {
        console.error("OR条件検索エラー:", orResult.error)
        if (!error) error = orResult.error
      } else if (orResult.data && orResult.data.length > 0) {
        console.log(`OR条件検索で ${orResult.data.length} 件のデータが見つかりました`)
        data = orResult.data
      } else {
        console.log("OR条件検索ではデータが見つかりませんでした")
      }
    }

    // 方法4: 全件取得してフィルタリング
    if (!data) {
      console.log("方法4: 全件取得してフィルタリング")
      const allResult = await adminSupabase
        .from("test_scores")
        .select("*")
        .limit(500)
        .order("test_date", { ascending: false })

      if (allResult.error) {
        console.error("全件取得エラー:", allResult.error)
        if (!error) error = allResult.error
      } else if (allResult.data && allResult.data.length > 0) {
        console.log(`全件取得で ${allResult.data.length} 件のデータを取得しました`)

        // 文字列比較でフィルタリング
        const filteredData = allResult.data.filter((item) => {
          const itemStudentId = String(item.student_id).trim()
          return itemStudentId === studentIdStr
        })

        if (filteredData.length > 0) {
          console.log(`フィルタリングで ${filteredData.length} 件のデータが見つかりました`)
          data = filteredData
        } else {
          console.log("フィルタリングではデータが見つかりませんでした")

          // デバッグ情報
          const sampleData = allResult.data.slice(0, 3)
          console.log("サンプルデータ:", sampleData)
          console.log(
            "サンプルデータの学生ID型:",
            sampleData.map((item) => typeof item.student_id),
          )
          console.log("検索対象の学生ID:", studentIdStr)
        }
      } else {
        console.log("全件取得ではデータが見つかりませんでした")
      }
    }

    // 結果を返す前に同じテスト・同じ日付の重複のみを排除
    if (data && data.length > 0) {
      // 同じテスト・同じ日付の重複のみを排除
      const uniqueData = removeTestDuplicates(data)

      console.log(`学生ID ${studentId} のテスト結果を ${data.length} 件取得しました`)
      console.log(`重複排除後: ${uniqueData.length} 件`)

      return { success: true, data: uniqueData }
    } else {
      console.log(`学生ID ${studentId} のテスト結果が見つかりませんでした`)

      // デバッグ用のAPIエンドポイントを呼び出す
      try {
        const debugResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/debug-query?studentId=${encodeURIComponent(studentIdStr)}`,
        )
        const debugData = await debugResponse.json()

        console.log("デバッグクエリ結果:", {
          success: debugData.success,
          resultCount: debugData.resultCount,
          queryInfo: debugData.queryInfo,
        })

        if (debugData.success && debugData.results && debugData.results.length > 0) {
          // 同じテスト・同じ日付の重複のみを排除
          const uniqueDebugData = removeTestDuplicates(debugData.results)

          console.log(`デバッグクエリで ${debugData.results.length} 件のデータが見つかりました`)
          console.log(`重複排除後: ${uniqueDebugData.length} 件`)

          return { success: true, data: uniqueDebugData, debugSource: true }
        }
      } catch (debugError) {
        console.error("デバッグクエリエラー:", debugError)
      }

      return {
        success: false,
        error: error ? error.message : "テスト結果が見つかりませんでした",
        data: [],
      }
    }
  } catch (error) {
    console.error("テスト結果取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果の取得に失敗しました",
      data: [],
    }
  }
}
