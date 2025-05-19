"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

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

export async function getTestResults() {
  try {
    console.log("テスト結果取得を開始します")
    const supabase = createSupabaseClient()

    // データを取得
    const { data, error } = await supabase.from("test_scores").select("*").order("test_date", { ascending: false })

    if (error) {
      console.error("テスト結果取得エラー:", error)
      return { success: false, error: error.message, data: [] }
    }

    console.log(`取得したデータ: ${data?.length || 0}件`)

    // データが空の場合は早期リターン
    if (!data || data.length === 0) {
      console.log("テスト結果が見つかりませんでした")
      return { success: true, data: [] }
    }

    // 各レコードに合計点を計算して追加
    const scoresWithTotal = data.map((score) => {
      // 科目ごとの点数を合計
      const totalScore =
        (Number(score.medical_overview) || 0) +
        (Number(score.public_health) || 0) +
        (Number(score.related_laws) || 0) +
        (Number(score.anatomy) || 0) +
        (Number(score.physiology) || 0) +
        (Number(score.pathology) || 0) +
        (Number(score.clinical_medicine_overview) || 0) +
        (Number(score.clinical_medicine_detail) || 0) +
        (Number(score.rehabilitation) || 0) +
        (Number(score.oriental_medicine_overview) || 0) +
        (Number(score.meridian_points) || 0) +
        (Number(score.oriental_medicine_clinical) || 0) +
        (Number(score.oriental_medicine_clinical_general) || 0) +
        (Number(score.acupuncture_theory) || 0) +
        (Number(score.moxibustion_theory) || 0)

      // テスト名と日付が未設定の場合はデフォルト値を設定
      const testName = score.test_name || "未設定のテスト"
      const testDate = score.test_date || new Date().toISOString().split("T")[0]

      return {
        ...score,
        test_name: testName,
        test_date: testDate,
        total_score: Math.round(totalScore * 10) / 10, // 小数点第一位まで丸める
      }
    })

    console.log("テスト結果を取得しました:", scoresWithTotal.length, "件")
    if (scoresWithTotal.length > 0) {
      console.log("最初の結果サンプル:", scoresWithTotal[0])
    }

    return { success: true, data: scoresWithTotal }
  } catch (error) {
    console.error("テスト結果取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果の取得に失敗しました",
      data: [],
    }
  }
}

// 特定のテストの結果を取得する関数
export async function getTestResultsByTest(testName: string, testDate: string) {
  try {
    console.log(`テスト「${testName}」(${testDate})の結果取得を開始します`)
    const supabase = createSupabaseClient()

    // まずテスト結果を取得
    const { data: testScores, error: testScoresError } = await supabase
      .from("test_scores")
      .select("*")
      .eq("test_name", testName)
      .eq("test_date", testDate)
      .order("student_id", { ascending: true })

    if (testScoresError) {
      console.error("テスト結果取得エラー:", testScoresError)
      return { success: false, error: testScoresError.message, data: [] }
    }

    console.log(`取得したテスト結果データ: ${testScores?.length || 0}件`)

    // データが空の場合は早期リターン
    if (!testScores || testScores.length === 0) {
      console.log("テスト結果が見つかりませんでした")
      return { success: true, data: [] }
    }

    // 学生IDのリストを作成
    const studentIds = testScores.map((score) => score.student_id)

    // 学生情報を取得
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("student_id, name")
      .in("student_id", studentIds)

    if (studentsError) {
      console.error("学生情報取得エラー:", studentsError)
      // エラーがあっても処理を続行し、学生名がない場合は「不明」とする
    } else {
      console.log(`取得した学生データ: ${students?.length || 0}件`)
      if (students && students.length > 0) {
        console.log("学生データサンプル:", students[0])
      }
    }

    // 学生IDと名前のマッピングを作成
    const studentMap = new Map()
    if (students) {
      students.forEach((student) => {
        studentMap.set(student.student_id, student.name)
      })
    }

    // 各レコードに合計点を計算して追加し、学生名を設定
    const scoresWithTotal = testScores.map((score) => {
      // 科目ごとの点数を合計
      const totalScore =
        (Number(score.medical_overview) || 0) +
        (Number(score.public_health) || 0) +
        (Number(score.related_laws) || 0) +
        (Number(score.anatomy) || 0) +
        (Number(score.physiology) || 0) +
        (Number(score.pathology) || 0) +
        (Number(score.clinical_medicine_overview) || 0) +
        (Number(score.clinical_medicine_detail) || 0) +
        (Number(score.rehabilitation) || 0) +
        (Number(score.oriental_medicine_overview) || 0) +
        (Number(score.meridian_points) || 0) +
        (Number(score.oriental_medicine_clinical) || 0) +
        (Number(score.oriental_medicine_clinical_general) || 0) +
        (Number(score.acupuncture_theory) || 0) +
        (Number(score.moxibustion_theory) || 0)

      // 学生名を設定（test_scoresテーブルのstudent_nameがある場合はそれを優先）
      const studentName = score.student_name || studentMap.get(score.student_id) || `学生ID: ${score.student_id}`

      return {
        ...score,
        student_name: studentName,
        total_score: Math.round(totalScore * 10) / 10, // 小数点第一位まで丸める
      }
    })

    // 学生名のマッピング状況を確認
    console.log(
      "学生IDと名前のマッピング例:",
      Array.from(studentMap.entries())
        .slice(0, 3)
        .map(([id, name]) => `ID:${id} => ${name}`),
    )

    // 最初の結果に学生名が正しく設定されているか確認
    if (scoresWithTotal.length > 0) {
      console.log("最初の結果の学生名:", scoresWithTotal[0].student_name, "学生ID:", scoresWithTotal[0].student_id)
    }

    console.log("テスト結果を取得しました:", scoresWithTotal.length, "件")
    if (scoresWithTotal.length > 0) {
      console.log("最初の結果サンプル:", scoresWithTotal[0])
    }

    return { success: true, data: scoresWithTotal }
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

    const supabase = createSupabaseClient()

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
      if (result.medical_overview !== undefined) formattedResult.medical_overview = Number(result.medical_overview)
      if (result.public_health !== undefined) formattedResult.public_health = Number(result.public_health)
      if (result.related_laws !== undefined) formattedResult.related_laws = Number(result.related_laws)
      if (result.anatomy !== undefined) formattedResult.anatomy = Number(result.anatomy)
      if (result.physiology !== undefined) formattedResult.physiology = Number(result.physiology)
      if (result.pathology !== undefined) formattedResult.pathology = Number(result.pathology)
      if (result.clinical_medicine_overview !== undefined)
        formattedResult.clinical_medicine_overview = Number(result.clinical_medicine_overview)
      if (result.clinical_medicine_detail !== undefined)
        formattedResult.clinical_medicine_detail = Number(result.clinical_medicine_detail)
      if (result.rehabilitation !== undefined) formattedResult.rehabilitation = Number(result.rehabilitation)
      if (result.oriental_medicine_overview !== undefined)
        formattedResult.oriental_medicine_overview = Number(result.oriental_medicine_overview)
      if (result.meridian_points !== undefined) formattedResult.meridian_points = Number(result.meridian_points)
      if (result.oriental_medicine_clinical !== undefined)
        formattedResult.oriental_medicine_clinical = Number(result.oriental_medicine_clinical)
      if (result.oriental_medicine_clinical_general !== undefined)
        formattedResult.oriental_medicine_clinical_general = Number(result.oriental_medicine_clinical_general)
      if (result.acupuncture_theory !== undefined)
        formattedResult.acupuncture_theory = Number(result.acupuncture_theory)
      if (result.moxibustion_theory !== undefined)
        formattedResult.moxibustion_theory = Number(result.moxibustion_theory)

      return formattedResult
    })

    // nullを除外
    const validResults = formattedResults.filter((result) => result !== null)

    if (validResults.length === 0) {
      return { success: false, error: "有効なデータがありません" }
    }

    // データをインポート
    const { error } = await supabase.from("test_scores").insert(validResults)

    if (error) {
      console.error("テスト結果インポートエラー:", error)
      return { success: false, error: error.message }
    }

    // キャッシュを更新
    revalidatePath("/admin/results")
    revalidatePath("/admin/dashboard")
    revalidatePath("/results")

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
