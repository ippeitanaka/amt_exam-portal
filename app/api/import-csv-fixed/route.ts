import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // CSVファイルを取得
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/24%E6%9C%9F%E7%94%9FID-UZj37SYowlEWDNiqVa2ARXrax14Cv5.csv",
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`)
    }

    // バイナリデータとして取得
    const buffer = await response.arrayBuffer()

    // UTF-8としてデコード
    const decoder = new TextDecoder("utf-8")
    let text = decoder.decode(buffer)

    // BOMがある場合は削除
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1)
    }

    // Shift-JISの可能性がある場合の対処
    // Note: ブラウザ環境ではShift-JISのデコードが難しいため、
    // サーバーサイドで適切に処理するか、事前にUTF-8に変換されたCSVを使用することをお勧めします

    // CSVデータを解析
    const rows = text.split("\n")
    const students = []

    // デバッグ情報
    const debugInfo = {
      totalRows: rows.length,
      processedRows: 0,
      skippedRows: 0,
      errors: [],
    }

    // ヘッダー行を確認
    const headerRow = rows[0].trim()
    const headers = headerRow.split(",")

    // 期待されるヘッダー（CSVの実際のヘッダーに合わせて調整）
    // 注: ここではCSVの実際のヘッダーがわからないため、一般的な名前を使用
    const expectedHeaders = ["name", "ID", "PASS"]

    // ヘッダー行をスキップ
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim()
      if (!row) {
        debugInfo.skippedRows++
        continue
      }

      try {
        // カンマで分割（引用符で囲まれたフィールドを考慮）
        const columns = row.split(",").map((col) => col.trim().replace(/^"|"$/g, ""))

        if (columns.length < 3) {
          debugInfo.errors.push(`行 ${i + 1}: 列が不足しています (${columns.length} 列)`)
          debugInfo.skippedRows++
          continue
        }

        // 列の値を取得（CSVの実際の構造に合わせて調整）
        const name = columns[0]
        const studentId = columns[1]
        const password = columns[2]

        // 必須フィールドの検証
        if (!studentId || !password) {
          debugInfo.errors.push(`行 ${i + 1}: 学生IDまたはパスワードがありません`)
          debugInfo.skippedRows++
          continue
        }

        // 学生データを追加
        students.push({
          name: name || "名前なし", // 名前がない場合のデフォルト値
          student_id: studentId,
          password: password,
        })

        debugInfo.processedRows++
      } catch (err) {
        debugInfo.errors.push(`行 ${i + 1}: ${err instanceof Error ? err.message : "不明なエラー"}`)
        debugInfo.skippedRows++
      }
    }

    if (students.length === 0) {
      return NextResponse.json(
        {
          error: "有効な学生データが見つかりませんでした",
          debugInfo,
        },
        { status: 400 },
      )
    }

    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies })

    // テーブル構造を確認
    const { data: tableInfo, error: tableError } = await supabase.from("students").select("*").limit(0)

    if (tableError) {
      return NextResponse.json(
        {
          error: "テーブル構造の確認に失敗しました",
          details: tableError.message,
          debugInfo,
        },
        { status: 500 },
      )
    }

    // 学生データをデータベースに挿入
    const { data, error } = await supabase
      .from("students")
      .upsert(students, {
        onConflict: "student_id",
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      return NextResponse.json(
        {
          error: "学生データの挿入に失敗しました",
          details: error.message,
          debugInfo,
          sampleData: students.slice(0, 3), // サンプルデータを表示
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `${students.length}人の学生データをインポートしました`,
      students: data,
      debugInfo,
    })
  } catch (error) {
    console.error("インポートエラー:", error)
    return NextResponse.json(
      {
        error: "学生データのインポートに失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 },
    )
  }
}
