"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const FUEL_LABELS = {
  gasoline: "휘발유",
  diesel: "경유",
  lpg: "LPG",
  electric: "전기",
};

const WORK_DAYS = [1, 2, 3, 4, 5, 6];

export default function CalculatorPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [fuelType, setFuelType] = useState("gasoline");
  const [efficiency, setEfficiency] = useState(""); // km/L or km/kWh
  const [hipass, setHipass] = useState(true);
  const [parking, setParking] = useState(""); // 원/일
  const [workDays, setWorkDays] = useState(5);

  const [fuelPrices, setFuelPrices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // 앱 로드 시 유가 미리 fetch
  useEffect(() => {
    fetch("/api/fuel-price")
      .then((r) => r.json())
      .then(setFuelPrices)
      .catch(() => {});
  }, []);

  async function geocode(address) {
    const res = await fetch(`/api/geocode?query=${encodeURIComponent(address)}`);
    if (!res.ok) throw new Error(`"${address}" 주소를 찾을 수 없습니다`);
    return res.json();
  }

  async function calculate() {
    setError("");
    setResult(null);
    if (!origin || !destination) {
      setError("출발지와 도착지를 입력해주세요");
      return;
    }
    if (fuelType !== "electric" && !efficiency) {
      setError("연비를 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      // 1. 좌표 변환
      const [originCoord, destCoord] = await Promise.all([
        geocode(origin),
        geocode(destination),
      ]);

      // 2. 경로 계산
      const routeRes = await fetch(
        `/api/route?origin=${originCoord.x},${originCoord.y}&destination=${destCoord.x},${destCoord.y}&hipass=${hipass}`
      );
      if (!routeRes.ok) throw new Error("경로를 계산할 수 없습니다");
      const route = await routeRes.json();

      const distanceKm = route.distance / 1000;
      const onewayToll = route.toll_fee;

      // 3. 유가
      let pricePerUnit = 0;
      if (fuelType === "electric") {
        pricePerUnit = 200; // 전기차 kWh당 약 200원 (완속 기준)
      } else {
        pricePerUnit = fuelPrices?.[fuelType] ?? 0;
      }

      const eff = parseFloat(efficiency);

      // 4. 계산
      const roundTripKm = distanceKm * 2;
      const dailyFuel = fuelType === "electric"
        ? (roundTripKm / eff) * pricePerUnit
        : (roundTripKm / eff) * pricePerUnit;
      const dailyToll = onewayToll * 2;
      const dailyParking = parseFloat(parking) || 0;
      const dailyTotal = dailyFuel + dailyToll + dailyParking;

      setResult({
        distanceKm: distanceKm.toFixed(1),
        pricePerUnit: Math.round(pricePerUnit),
        dailyFuel: Math.round(dailyFuel),
        dailyToll: Math.round(dailyToll),
        dailyParking: Math.round(dailyParking),
        dailyTotal: Math.round(dailyTotal),
        weeklyTotal: Math.round(dailyTotal * workDays),
        monthlyTotal: Math.round(dailyTotal * workDays * 4.3),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto max-w-xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            WithRide
          </Link>
          <Link
            href="/commute"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            경로 등록하기
          </Link>
        </div>
      </nav>

      <main className="pt-28 pb-24 px-6">
        <div className="mx-auto max-w-xl">
          <h1 className="text-2xl font-extrabold tracking-tight">
            출퇴근 비용 계산기
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            자차 출퇴근에 드는 실비(연료비·톨비·주차비)를 계산합니다.
          </p>

          {/* 입력 폼 */}
          <div className="mt-8 space-y-4">
            {/* 출발지 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                출발지
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="예: 인천 송도동"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white transition"
              />
            </div>

            {/* 도착지 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                도착지
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="예: 서울 테헤란로"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white transition"
              />
            </div>

            {/* 유종 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                유종
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(FUEL_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFuelType(key)}
                    className={`rounded-2xl py-2.5 text-sm font-semibold transition ${
                      fuelType === key
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {fuelPrices && fuelType !== "electric" && (
                <p className="mt-1.5 text-xs text-slate-400">
                  현재 전국 평균:{" "}
                  <span className="font-semibold text-slate-600">
                    {fuelPrices[fuelType]?.toLocaleString()}원/L
                  </span>
                </p>
              )}
              {fuelType === "electric" && (
                <p className="mt-1.5 text-xs text-slate-400">
                  완속 충전 기준 약 200원/kWh 적용
                </p>
              )}
            </div>

            {/* 연비 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {fuelType === "electric" ? "전비 (km/kWh)" : "연비 (km/L)"}
              </label>
              <input
                type="number"
                value={efficiency}
                onChange={(e) => setEfficiency(e.target.value)}
                placeholder={fuelType === "electric" ? "예: 5.5" : "예: 12.3"}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white transition"
              />
            </div>

            {/* 하이패스 + 주차비 + 출근일수 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  하이패스
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => setHipass(v)}
                      className={`rounded-2xl py-2.5 text-sm font-semibold transition ${
                        hipass === v
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {v ? "있음" : "없음"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  주 출근일수
                </label>
                <select
                  value={workDays}
                  onChange={(e) => setWorkDays(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white transition"
                >
                  {WORK_DAYS.map((d) => (
                    <option key={d} value={d}>
                      주 {d}일
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                일 주차비 (원, 없으면 0)
              </label>
              <input
                type="number"
                value={parking}
                onChange={(e) => setParking(e.target.value)}
                placeholder="예: 5000"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white transition"
              />
            </div>

            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* 계산 버튼 */}
            <button
              onClick={calculate}
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-600 py-4 font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {loading ? "계산 중..." : "비용 계산하기"}
            </button>
          </div>

          {/* 결과 */}
          {result && (
            <div className="mt-8 space-y-4">
              <h2 className="text-lg font-extrabold">계산 결과</h2>

              {/* 편도 거리 */}
              <p className="text-sm text-slate-500">
                편도 거리:{" "}
                <span className="font-semibold text-slate-800">
                  {result.distanceKm} km
                </span>
              </p>

              {/* 일/주/월 비용 카드 */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "일", value: result.dailyTotal },
                  { label: "주", value: result.weeklyTotal },
                  { label: "월", value: result.monthlyTotal },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-3xl bg-emerald-600 p-4 text-center text-white"
                  >
                    <p className="text-xs font-medium opacity-80">{label}간</p>
                    <p className="mt-1 text-lg font-extrabold">
                      {value.toLocaleString()}
                      <span className="text-xs font-normal">원</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* 항목별 breakdown */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                {[
                  { label: "연료비", value: result.dailyFuel },
                  { label: "톨비", value: result.dailyToll },
                  { label: "주차비", value: result.dailyParking },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label} (일)</span>
                    <span className="font-semibold">
                      {value.toLocaleString()}원
                    </span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-3 flex justify-between text-sm font-bold">
                  <span>합계 (일)</span>
                  <span>{result.dailyTotal.toLocaleString()}원</span>
                </div>
              </div>

              {/* WithRide 유입 멘트 */}
              <div className="rounded-3xl bg-slate-900 p-5 text-white">
                <p className="text-sm font-bold">
                  월 {result.monthlyTotal.toLocaleString()}원, WithRide로 줄일 수 있어요.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  같은 방향 동승자와 연료비·톨비를 나눠 부담해보세요.
                </p>
                <Link
                  href="/commute"
                  className="mt-4 inline-block rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500 transition-colors"
                >
                  30초 만에 내 경로 신청하기 →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
