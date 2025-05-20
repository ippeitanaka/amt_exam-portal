import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    if (!studentId) {
      return NextResponse.json({ success: false, error: "学生IDが指定されていません" })
    }

    console.log(`デバッグクエリ: 学生ID ${studentId} のテスト結果を検索します`)

    // Supabaseクライアントを作成
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ success: false, error: "Supabase環境変数が設定されていません" })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // 学生IDを文字列として扱う
    const studentIdStr = String(studentId).trim()

    // 数値に変換可能か確認
    const studentIdNum = Number.parseInt(studentIdStr, 10)
    const isNumeric = !isNaN(studentIdNum)

    // 全件取得（制限付き）
    const allResult = await supabase.from("test_scores").select("*").limit(100).order("test_date", { ascending: false })

    if (allResult.error) {
      return NextResponse.json({
        success: false,
        error: allResult.error.message,
        queryInfo: {
          studentId,
          studentIdStr,
          isNumeric,
          studentIdNum: isNumeric ? studentIdNum : null,
        },
      })
    }

    // 全データを取得
    const allData = allResult.data || []

    // 重複を排除する関数
    function removeDuplicates(data: any[]) {
      const uniqueMap = new Map()
      data.forEach((item) => {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item)
        }
      })
      return Array.from(uniqueMap.values())
    }

    // 文字列比較でフィルタリング
    const filteredData = allData.filter((item) => {
      const itemStudentId = String(item.student_id).trim()
      return itemStudentId === studentIdStr
    })

    // 重複を排除
    const uniqueFilteredData = removeDuplicates(filteredData)

    // サンプルデータ（最初の数件）
    const sampleData = allData.slice(0, 5).map((item) => ({
      id: item.id,
      student_id: item.student_id,
      test_name: item.test_name,
      test_date: item.test_date,
      student_id_type: typeof item.student_id,
    }))

    return NextResponse.json({
      success: true,
      resultCount: uniqueFilteredData.length,
      results: uniqueFilteredData,
      queryInfo: {
        studentId,
        studentIdStr,
        isNumeric,
        studentIdNum: isNumeric ? studentIdNum : null,
        totalRecords: allData.length,
        beforeDeduplication: filteredData.length,
        afterDeduplication: uniqueFilteredData.length,
      },
      sampleData,
    })
  } catch (error) {
    console.error("デバッグクエリエラー:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "デバッグクエリの実行に失敗しました",
    })
  }
}
