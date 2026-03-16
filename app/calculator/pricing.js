// WithRide 운전자 탑승비 산정 로직
//
// 기준:
//   최소가 = 월 출퇴근 비용 ÷ (동승자 2명 × 왕복 2회 × 21.5일)
//            → 이 가격으로 받으면 월 출퇴근 비용이 정확히 상쇄됨
//   최대가 = 최소가 × 2
//   거리 기반: 짧을수록 최대가에 가깝게, 길수록 최소가에 가깝게

const PASSENGERS = 2;    // 편도당 동승자 수
const DIRECTIONS = 2;    // 왕복
const WORK_DAYS = 5 * 4.3; // ≈ 21.5일/월

const TOTAL_RIDES_PER_MONTH = PASSENGERS * DIRECTIONS * WORK_DAYS; // 86회

const DISTANCE_SHORT_KM = 5;   // 이하: 최대가
const DISTANCE_LONG_KM = 30;   // 이상: 최소가

/**
 * WithRide 운전자 탑승비 및 예상 수익 계산
 *
 * @param {number} monthlyCommuteCost - 운전자의 월 출퇴근 비용 (원)
 * @param {number} distanceKm         - 편도 거리 (km)
 * @returns {{
 *   minPrice: number,        // 최소 탑승비 (원/회, 100원 단위 반올림)
 *   maxPrice: number,        // 최대 탑승비 (원/회)
 *   suggestedPrice: number,  // 거리 기반 권장 탑승비 (원/회)
 *   monthlyIncome: number,   // 월 예상 수익 (원)
 *   coveragePercent: number, // 출퇴근 비용 대비 충당 비율 (%)
 * }}
 */
export function calcWithridePricing(monthlyCommuteCost, distanceKm) {
  const rawMin = monthlyCommuteCost / TOTAL_RIDES_PER_MONTH;
  const rawMax = rawMin * 2;

  // t = 0: 짧은 거리 → 최대가, t = 1: 긴 거리 → 최소가
  const t = Math.min(
    1,
    Math.max(
      0,
      (distanceKm - DISTANCE_SHORT_KM) / (DISTANCE_LONG_KM - DISTANCE_SHORT_KM)
    )
  );
  const rawSuggested = rawMax * (1 - t) + rawMin * t;

  // 100원 단위 반올림
  const round100 = (n) => Math.round(n / 100) * 100;
  const minPrice = round100(rawMin);
  const maxPrice = round100(rawMax);
  const suggestedPrice = round100(rawSuggested);

  const monthlyIncome = Math.round(suggestedPrice * TOTAL_RIDES_PER_MONTH);
  const coveragePercent = Math.round((monthlyIncome / monthlyCommuteCost) * 100);

  return { minPrice, maxPrice, suggestedPrice, monthlyIncome, coveragePercent };
}
