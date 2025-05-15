import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const formData = await request.formData()
    const csvFile = formData.get("file") as File
    const testName = formData.get("testName") as string
    const testDate = formData.get("testDate") as string

    if (!csvFile || !testName || !testDate) {
      return NextResponse.json({ error: "必要なパラメータが不足しています" }, { status: 400 })
    }

    // CSVファイルをテキストとして読み込む
    const text = await csvFile.text()
    const rows = text.split("\n")

    // ヘッダー行を確認
    const headers = rows[0].split(",").map((h) => h.trim())
    console.log("CSVヘッダー:", headers) // デバッグ用

    // 必要なカラムのインデックスを取得
    const studentIdIndex = headers.findIndex((h) => h === "student_id")
    const nameIndex = headers.findIndex((h) => h === "name")
    const sectionAIndex = headers.findIndex((h) => h === "section_a")
    const sectionBIndex = headers.findIndex((h) => h === "section_b")
    const sectionCIndex = headers.findIndex((h) => h === "section_c")
    const sectionDIndex = headers.findIndex((h) => h === "section_d")
    const sectionADIndex = headers.findIndex((h) => h === "section_ad")
    const sectionBCIndex = headers.findIndex((h) => h === "section_bc")
    const totalScoreIndex = headers.findIndex((h) => h === "total_score")

    // CSVにヘッダーがない場合や、student_idカラムがない場合は、
    // インデックスを推測する
    const useDefaultIndices = studentIdIndex === -1

    console.log("カラムインデックス:", {
      studentIdIndex: useDefaultIndices ? 2 : studentIdIndex,
      nameIndex: useDefaultIndices ? 3 : nameIndex,
      // 他のインデックス情報
    }) // デバッグ用

    const results = []
    const errors = []

    // ヘッダー行をスキップしてデータを処理（ヘッダーがない場合は最初の行から処理）
    const startIndex = useDefaultIndices ? 0 : 1

    // バッチ処理のためのデータ配列
    const batchData = []

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i].trim()
      if (!row) continue

      try {
        // カンマで分割
        const columns = row.split(",").map((col) => col.trim())

        if (columns.length < 3) {
          errors.push(`行 ${i + 1}: 列が不足しています (${columns.length} 列)`)
          continue
        }

        // データを抽出（インデックスを適切に使用）
        const si = useDefaultIndices ? 2 : studentIdIndex
        const ni = useDefaultIndices ? 3 : nameIndex
        const sai = useDefaultIndices ? 4 : sectionAIndex
        const sbi = useDefaultIndices ? 5 : sectionBIndex
        const sci = useDefaultIndices ? 6 : sectionCIndex
        const sdi = useDefaultIndices ? 7 : sectionDIndex
        const sadi = useDefaultIndices ? 8 : sectionADIndex
        const sbci = useDefaultIndices ? 9 : sectionBCIndex
        const tsi = useDefaultIndices ? 10 : totalScoreIndex

        const studentId = columns[si]
        const name = ni >= 0 && ni < columns.length ? columns[ni] : ""

        // 数値データを適切に変換（小数点を含む可能性がある）
        const sectionA = sai >= 0 && sai < columns.length ? Number.parseFloat(columns[sai]) || 0 : 0
        const sectionB = sbi >= 0 && sbi < columns.length ? Number.parseFloat(columns[sbi]) || 0 : 0
        const sectionC = sci >= 0 && sci < columns.length ? Number.parseFloat(columns[sci]) || 0 : 0
        const sectionD = sdi >= 0 && sdi < columns.length ? Number.parseFloat(columns[sdi]) || 0 : 0
        const sectionAD = sadi >= 0 && sadi < columns.length ? Number.parseFloat(columns[sadi]) || 0 : 0
        const sectionBC = sbci >= 0 && sbci < columns.length ? Number.parseFloat(columns[sbci]) || 0 : 0
        const totalScore = tsi >= 0 && tsi < columns.length ? Number.parseFloat(columns[tsi]) || 0 : 0

        if (!studentId) {
          errors.push(`行 ${i + 1}: 学生IDがありません`)
          continue
        }

        // バッチ処理用のデータを追加
        batchData.push({
          student_id: studentId,
          name: name,
          test_name: testName,
          test_date: testDate,
          section_a: sectionA,
          section_b: sectionB,
          section_c: sectionC,
          section_d: sectionD,
          section_ad: sectionAD,
          section_bc: sectionBC,
          total_score: totalScore,
        })
      } catch (err) {
        console.error(`行 ${i + 1} の例外:`, err) // デバッグ用
        errors.push(`行 ${i + 1}: ${err instanceof Error ? err.message : "不明なエラー"}`)
      }
    }

    // バッチデータがある場合は一括挿入
    if (batchData.length > 0) {
      try {
        // 各レコードについて、同じstudent_id、test_name、test_dateの組み合わせが既に存在するか確認
        const existingRecords = []
        const newRecords = []

        for (const record of batchData) {
          // 既存レコードを確認
          const { data: existingData, error: checkError } = await supabase
            .from("test_scores")
            .select("id, student_id")
            .eq("student_id", record.student_id)
            .eq("test_name", record.test_name)
            .eq("test_date", record.test_date)

          if (checkError) {
            console.error("既存データ確認エラー:", checkError)
            continue
          }

          if (existingData && existingData.length > 0) {
            // 既に同じ学生の同じテストの結果が存在する場合
            existingRecords.push({
              studentId: record.student_id,
              testName: record.test_name,
              testDate: record.test_date,
            })
          } else {
            // 新規レコードとして追加
            newRecords.push(record)
          }
        }

        // 新規レコードのみを挿入
        if (newRecords.length > 0) {
          const { data, error } = await supabase.from("test_scores").insert(newRecords).select()

          if (error) {
            console.error("バッチ挿入エラー:", error)
            return NextResponse.json(
              {
                error: "テスト結果の挿入に失敗しました",
                details: error.message,
                code: error.code,
                hint: error.hint,
              },
              { status: 500 },
            )
          }

          // 成功した結果を追加
          for (const item of data) {
            results.push({
              studentId: item.student_id,
              name: item.name,
              resultId: item.id,
            })
          }
        }

        // 既存レコードがあった場合は警告を追加
        if (existingRecords.length > 0) {
          for (const record of existingRecords) {
            errors.push(
              `学生ID: ${record.studentId}、テスト: ${record.testName}（${record.testDate}）のデータは既に存在するためスキップしました`,
            )
          }
        }
      } catch (batchError) {
        console.error("バッチ処理エラー:", batchError)
        return NextResponse.json(
          {
            error: "テスト結果のバッチ処理に失敗しました",
            details: batchError instanceof Error ? batchError.message : "不明なエラー",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.length}件のテスト結果をインポートしました`,
      results,
      errors: errors.length > 0 ? errors : null,
    })
  } catch (error) {
    console.error("インポートエラー:", error)
    return NextResponse.json(
      {
        error: "テスト結果のインポートに失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 },
    )
  }
}
