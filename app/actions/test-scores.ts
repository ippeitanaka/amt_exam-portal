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

    console.log("テスト結果を取得しました:", result.data?.length || 0, "件")
    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error("テスト結果取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果の取得に失敗しました",
      data: [],
    }
  }
}

export async function importTestResults(results: any[]) {
  try {
    if (!results || results.length === 0) {
      return { success: false, error: "インポートするデータがありません" }
    }

    console.log("テスト結果をインポートします:", results.length, "件")
    console.log("最初のデータ例:", results[0])

    // テーブル構造を確認
    // まず通常のクライアントで試す
    let tableInfoResult = await supabase.from("test_scores").select("*").limit(1)

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (tableInfoResult.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      tableInfoResult = await adminSupabase.from("test_scores").select("*").limit(1)
    }

    if (tableInfoResult.error) {
      console.error("テーブル構造確認エラー:", tableInfoResult.error)
      return { success: false, error: `テーブル構造の確認に失敗しました: ${tableInfoResult.error.message}` }
    }

    // データベースのカラム名を取得
    const dbColumns =
      tableInfoResult.data && tableInfoResult.data.length > 0 ? Object.keys(tableInfoResult.data[0]) : []
    console.log("利用可能なカラム:", dbColumns)

    // 各結果をテーブル構造に合わせて整形
    const formattedResults = results.map((result) => {
      // student_idが数値であることを確認
      const studentId =
        typeof result.student_id === "number"
          ? result.student_id
          : Number.parseInt(String(result.student_id).trim(), 10)

      if (isNaN(studentId)) {
        console.error(`無効な学生ID: ${result.student_id}`)
        return null
      }

      const formattedResult: Record<string, any> = {
        student_id: studentId,
        test_name: result.test_name || "模擬試験",
        test_date: result.test_date || new Date().toISOString().split("T")[0],
      }

      // 科目別得点を追加
      if (result.medical_overview !== undefined) formattedResult.medical_overview = result.medical_overview
      if (result.public_health !== undefined) formattedResult.public_health = result.public_health
      if (result.related_laws !== undefined) formattedResult.related_laws = result.related_laws
      if (result.anatomy !== undefined) formattedResult.anatomy = result.anatomy
      if (result.physiology !== undefined) formattedResult.physiology = result.physiology
      if (result.pathology !== undefined) formattedResult.pathology = result.pathology
      if (result.clinical_medicine_overview !== undefined)
        formattedResult.clinical_medicine_overview = result.clinical_medicine_overview
      if (result.clinical_medicine_detail !== undefined)
        formattedResult.clinical_medicine_detail = result.clinical_medicine_detail
      if (result.rehabilitation !== undefined) formattedResult.rehabilitation = result.rehabilitation
      if (result.oriental_medicine_overview !== undefined)
        formattedResult.oriental_medicine_overview = result.oriental_medicine_overview
      if (result.meridian_points !== undefined) formattedResult.meridian_points = result.meridian_points
      if (result.oriental_medicine_clinical !== undefined)
        formattedResult.oriental_medicine_clinical = result.oriental_medicine_clinical
      if (result.oriental_medicine_clinical_general !== undefined)
        formattedResult.oriental_medicine_clinical_general = result.oriental_medicine_clinical_general
      if (result.acupuncture_theory !== undefined) formattedResult.acupuncture_theory = result.acupuncture_theory
      if (result.moxibustion_theory !== undefined) formattedResult.moxibustion_theory = result.moxibustion_theory

      return formattedResult
    })

    // nullを除外
    const validResults = formattedResults.filter((result) => result !== null)

    if (validResults.length === 0) {
      return { success: false, error: "有効なデータがありません" }
    }

    // データをインポート
    // まず通常のクライアントで試す
    let insertResult = await supabase.from("test_scores").insert(validResults)

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (insertResult.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      insertResult = await adminSupabase.from("test_scores").insert(validResults)
    }

    if (insertResult.error) {
      console.error("テスト結果インポートエラー:", insertResult.error)
      return { success: false, error: insertResult.error.message }
    }

    console.log("テスト結果のインポートが完了しました:", validResults.length, "件")
    return { success: true, count: validResults.length }
  } catch (error) {
    console.error("テスト結果インポートエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果のインポートに失敗しました",
    }
  }
}

// 新しいCSV形式からデータをインポートする関数
export async function importTestScoresFromCSV(csvData: any[]) {
  try {
    if (!csvData || csvData.length === 0) {
      return { success: false, error: "インポートするデータがありません" }
    }

    console.log("CSVからテスト結果をインポートします:", csvData.length, "件")
    console.log("最初のデータ例:", csvData[0])

    // 各行をtest_scores形式に変換
    const testScores = csvData.map((row) => {
      // 学生IDを数値に変換
      const studentId = Number.parseInt(String(row["番号"]).trim(), 10)
      if (isNaN(studentId)) {
        console.error(`無効な学生ID: ${row["番号"]}`)
        return null
      }

      // 各科目の点数を数値に変換
      const convertToNumber = (value: string | null | undefined) => {
        if (value === null || value === undefined || value === "") return null
        const num = Number.parseFloat(String(value).trim())
        return isNaN(num) ? null : num
      }

      return {
        student_id: studentId,
        test_name: "AMT模擬試験",
        test_date: new Date().toISOString().split("T")[0], // 今日の日付

        // 基礎医学系
        medical_overview: convertToNumber(row["医療概論"]),
        public_health: convertToNumber(row["衛生・公衆衛生学"]),
        related_laws: convertToNumber(row["関係法規"]),
        anatomy: convertToNumber(row["解剖学"]),
        physiology: convertToNumber(row["生理学"]),
        pathology: convertToNumber(row["病理学"]),

        // 臨床医学系
        clinical_medicine_overview: convertToNumber(row["臨床医学総論"]),
        clinical_medicine_detail: convertToNumber(row["臨床医学各論"]),
        rehabilitation: convertToNumber(row["リハビリテーション医学"]),

        // 東洋医学系
        oriental_medicine_overview: convertToNumber(row["東洋医学概論"]),
        meridian_points: convertToNumber(row["経絡経穴概論"]),
        oriental_medicine_clinical: convertToNumber(row["東洋医学臨床論"]),
        oriental_medicine_clinical_general: convertToNumber(row["東洋医学臨床論（総合）"]),

        // 専門系
        acupuncture_theory: convertToNumber(row["はり理論"]),
        moxibustion_theory: convertToNumber(row["きゅう理論"]),
      }
    })

    // nullを除外
    const validTestScores = testScores.filter((score) => score !== null)

    if (validTestScores.length === 0) {
      return { success: false, error: "有効なデータがありません" }
    }

    // 学生情報も同時に更新（存在しない場合は作成）
    for (const score of validTestScores) {
      const studentName = csvData.find((row) => Number.parseInt(String(row["番号"]).trim(), 10) === score.student_id)?.[
        "氏名"
      ]
      if (studentName) {
        // 学生情報を確認
        const { data: existingStudent } = await adminSupabase
          .from("students")
          .select("*")
          .eq("student_id", score.student_id)
          .maybeSingle()

        if (!existingStudent) {
          // 学生情報が存在しない場合は作成
          const defaultPassword = String(score.student_id).slice(-4) // 学生IDの下4桁をパスワードとして使用
          await adminSupabase.from("students").insert({
            student_id: score.student_id,
            name: studentName,
            password: defaultPassword || "password",
          })
        }
      }
    }

    // データをインポート
    const insertResult = await adminSupabase.from("test_scores").insert(validTestScores)

    if (insertResult.error) {
      console.error("テスト結果インポートエラー:", insertResult.error)
      return { success: false, error: insertResult.error.message }
    }

    console.log("テスト結果のインポートが完了しました:", validTestScores.length, "件")
    return { success: true, count: validTestScores.length }
  } catch (error) {
    console.error("テスト結果インポートエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果のインポートに失敗しました",
    }
  }
}

// 特定の学生のテスト結果を取得する関数
export async function getStudentTestResults(studentId: number) {
  try {
    console.log(`学生ID ${studentId} のテスト結果取得を開始します`)

    // 学生IDを数値に変換
    const studentIdNum = Number.parseInt(String(studentId), 10)
    if (isNaN(studentIdNum)) {
      return { success: false, error: "無効な学生IDです", data: [] }
    }

    // テスト結果を取得
    const result = await supabase
      .from("test_scores")
      .select("*")
      .eq("student_id", studentIdNum)
      .order("test_date", { ascending: false })

    if (result.error) {
      console.error("テスト結果取得エラー:", result.error)
      return { success: false, error: result.error.message, data: [] }
    }

    console.log(`学生ID ${studentId} のテスト結果を取得しました:`, result.data?.length || 0, "件")
    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error("テスト結果取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果の取得に失敗しました",
      data: [],
    }
  }
}
