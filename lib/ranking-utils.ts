import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export type TestScore = {
  id: string
  student_id: string
  name?: string // name列を追加
  test_name: string
  test_date: string
  section_a: number
  section_b: number
  section_c: number
  section_d: number
  section_ad: number
  section_bc: number
  total_score: number
  created_at: string
  rank?: number
}

// TestScoreWithStats型にavg_rankプロパティを追加
export type TestScoreWithStats = TestScore & {
  avg_section_a: number
  avg_section_b: number
  avg_section_c: number
  avg_section_d: number
  avg_section_ad: number
  avg_section_bc: number
  avg_total_score: number
  rank: number
  total_rank: number
  avg_rank?: number
  previous_scores?: {
    section_a_change: number
    section_b_change: number
    section_c_change: number
    section_d_change: number
    section_ad_change: number
    section_bc_change: number
    total_score_change: number
  }
}

// 特定の学生の成績と統計情報を取得
export async function getStudentScoresWithStats(studentId: string): Promise<TestScoreWithStats[]> {
  const supabase = createClientComponentClient()
  console.log("Getting scores for student:", studentId)

  try {
    // 1. 学生の全テスト結果を取得（name列も含める）
    const { data: studentScores, error: scoresError } = await supabase
      .from("test_scores")
      .select("*")
      .eq("student_id", studentId)
      .order("test_date", { ascending: false })

    if (scoresError || !studentScores) {
      console.error("成績データ取得エラー:", scoresError)
      return []
    }

    console.log(`Found ${studentScores.length} scores for student ${studentId}`)

    // 2. 各テストの平均点を計算
    const testAverages: Record<
      string,
      {
        avg_section_a: number
        avg_section_b: number
        avg_section_c: number
        avg_section_d: number
        avg_section_ad: number
        avg_section_bc: number
        avg_total_score: number
      }
    > = {}

    for (const score of studentScores) {
      try {
        console.log(`Getting averages for test: ${score.test_name}, date: ${score.test_date}`)

        const { data: avgData, error: avgError } = await supabase.rpc("get_test_averages", {
          p_test_name: score.test_name,
          p_test_date: score.test_date,
        })

        if (avgError) {
          console.error("平均点取得エラー:", avgError)
          continue
        }

        if (!avgData || avgData.length === 0) {
          console.warn(`No average data found for test: ${score.test_name}, date: ${score.test_date}`)
          continue
        }

        testAverages[`${score.test_name}_${score.test_date}`] = avgData[0]
      } catch (err) {
        console.error(`Error getting averages for test ${score.test_name}:`, err)
      }
    }

    // 3. 各テストの順位を計算
    const testRankings: Record<string, number> = {}
    for (const score of studentScores) {
      try {
        console.log(`Getting rank for student ${studentId} in test: ${score.test_name}, date: ${score.test_date}`)

        const { data: rankData, error: rankError } = await supabase.rpc("get_student_rank", {
          p_student_id: studentId,
          p_test_name: score.test_name,
          p_test_date: score.test_date,
        })

        if (rankError) {
          console.error("順位取得エラー:", rankError)
          continue
        }

        if (!rankData || rankData.length === 0) {
          console.warn(`No rank data found for student ${studentId} in test: ${score.test_name}`)
          continue
        }

        testRankings[`${score.test_name}_${score.test_date}`] = rankData[0].rank
      } catch (err) {
        console.error(`Error getting rank for test ${score.test_name}:`, err)
      }
    }

    // 4. 総合順位を計算
    let totalRank = 0
    let avgRank = 0
    try {
      console.log(`Getting total rank for student ${studentId}`)

      const { data: totalRankData, error: totalRankError } = await supabase.rpc("get_student_total_rank", {
        p_student_id: studentId,
      })

      if (totalRankError) {
        console.error("総合順位取得エラー:", totalRankError)
      } else if (totalRankData && totalRankData.length > 0) {
        totalRank = totalRankData[0].rank
        avgRank = totalRankData[0].avg_rank
      }
    } catch (err) {
      console.error(`Error getting total rank for student ${studentId}:`, err)
    }

    // 5. 前回のテスト結果との比較
    const sortedScores = [...studentScores].sort(
      (a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime(),
    )
    const previousScores: Record<string, TestScore | undefined> = {}

    for (let i = 1; i < sortedScores.length; i++) {
      previousScores[sortedScores[i].test_name] = sortedScores[i - 1]
    }

    // 6. 結果を組み合わせる
    return studentScores.map((score) => {
      const testKey = `${score.test_name}_${score.test_date}`
      const avgData = testAverages[testKey] || {
        avg_section_a: 0,
        avg_section_b: 0,
        avg_section_c: 0,
        avg_section_d: 0,
        avg_section_ad: 0,
        avg_section_bc: 0,
        avg_total_score: 0,
      }

      const prevScore = previousScores[score.test_name]
      const previousScoreData = prevScore
        ? {
            section_a_change: (score.section_a || 0) - (prevScore.section_a || 0),
            section_b_change: (score.section_b || 0) - (prevScore.section_b || 0),
            section_c_change: (score.section_c || 0) - (prevScore.section_c || 0),
            section_d_change: (score.section_d || 0) - (prevScore.section_d || 0),
            section_ad_change: (score.section_ad || 0) - (prevScore.section_ad || 0),
            section_bc_change: (score.section_bc || 0) - (prevScore.section_bc || 0),
            total_score_change: (score.total_score || 0) - (prevScore.total_score || 0),
          }
        : undefined

      return {
        ...score,
        ...avgData,
        rank: testRankings[testKey] || 0,
        total_rank: totalRank,
        avg_rank: avgRank,
        previous_scores: previousScoreData,
      }
    })
  } catch (error) {
    console.error("getStudentScoresWithStats error:", error)
    return []
  }
}

// 特定のテストの全学生の成績と順位を取得
export async function getTestRankings(testName: string, testDate: string): Promise<TestScore[]> {
  const supabase = createClientComponentClient()
  console.log(`Getting rankings for test: ${testName}, date: ${testDate}`)

  try {
    const { data, error } = await supabase.rpc("get_test_rankings", {
      p_test_name: testName,
      p_test_date: testDate,
    })

    if (error) {
      console.error("ランキング取得エラー:", error)
      return []
    }

    if (!data || data.length === 0) {
      console.warn(`No ranking data found for test: ${testName}, date: ${testDate}`)
      return []
    }

    console.log(`Found ${data.length} rankings for test: ${testName}`)
    return data
  } catch (err) {
    console.error(`Error getting rankings for test ${testName}:`, err)
    return []
  }
}

// 総合ランキングを取得
export async function getTotalRankings(): Promise<any[]> {
  const supabase = createClientComponentClient()
  console.log("Getting total rankings")

  try {
    const { data, error } = await supabase.rpc("get_total_rankings")

    if (error) {
      console.error("総合ランキング取得エラー:", error)
      return []
    }

    if (!data || data.length === 0) {
      console.warn("No total ranking data found")
      return []
    }

    console.log(`Found ${data.length} total rankings`)
    return data
  } catch (err) {
    console.error("Error getting total rankings:", err)
    return []
  }
}
