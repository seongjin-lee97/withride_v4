"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Script from "next/script";

const FUEL_LABELS = {
  gasoline: "휘발유",
  diesel: "경유",
  lpg: "LPG",
  electric: "전기",
};

const CAR_CATEGORIES = [
  {
    key: "small",
    label: "경차/소형",
    desc: "모닝, 레이, 스파크 등",
    efficiency: 11,
  },
  {
    key: "mid",
    label: "준중형/중형",
    desc: "아반떼, K3, 쏘나타, BMW 3시리즈 등",
    efficiency: 10,
  },
  {
    key: "suv",
    label: "SUV/RV",
    desc: "투싼, 스포티지, 쏘렌토, 카니발, BMW X3 등",
    efficiency: 8.5,
  },
  {
    key: "large",
    label: "세단 대형",
    desc: "그랜저, K8, 벤츠 E클래스 등",
    efficiency: 9.5,
  },
];

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export default function CalculatorPage() {
  const [kakaoLoaded, setKakaoLoaded] = useState(false);

  const [origin, setOrigin] = useState("");
  const [originCoord, setOriginCoord] = useState(null);
  const [originDropdown, setOriginDropdown] = useState([]);

  const [destination, setDestination] = useState("");
  const [destCoord, setDestCoord] = useState(null);
  const [destDropdown, setDestDropdown] = useState([]);

  const [carCategory, setCarCategory] = useState(null);

  const [fuelType, setFuelType] = useState("gasoline");
  const [efficiency, setEfficiency] = useState("");
  const [parking, setParking] = useState("");

  const [fuelPrices, setFuelPrices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/fuel-price")
      .then((r) => r.json())
      .then(setFuelPrices)
      .catch(() => {});
  }, []);

  const searchPlace = useCallback(
    (query) =>
      new Promise((resolve) => {
        if (!kakaoLoaded || !query || query.length < 2) return resolve([]);
        if (!window.kakao?.maps) return resolve([]);
        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(query, (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            resolve(data.slice(0, 6));
          } else {
            resolve([]);
          }
        });
      }),
    [kakaoLoaded]
  );

  const debouncedSearchOrigin = useCallback(
    debounce(async (val) => {
      const results = await searchPlace(val);
      setOriginDropdown(results);
    }, 300),
    [searchPlace]
  );

  const debouncedSearchDest = useCallback(
    debounce(async (val) => {
      const results = await searchPlace(val);
      setDestDropdown(results);
    }, 300),
    [searchPlace]
  );

  function handleOriginInput(e) {
    const val = e.target.value;
    setOrigin(val);
    setOriginCoord(null);
    debouncedSearchOrigin(val);
  }

  function handleDestInput(e) {
    const val = e.target.value;
    setDestination(val);
    setDestCoord(null);
    debouncedSearchDest(val);
  }

  function selectOrigin(place) {
    setOrigin(place.place_name);
    setOriginCoord({ x: place.x, y: place.y });
    setOriginDropdown([]);
  }

  function selectDest(place) {
    setDestination(place.place_name);
    setDestCoord({ x: place.x, y: place.y });
    setDestDropdown([]);
  }

  function selectCarCategory(cat) {
    setCarCategory(cat.key);
    setEfficiency(String(cat.efficiency));
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
      // 좌표: 드롭다운 선택 시 이미 있음, 아니면 geocode API로 fallback
      let oc = originCoord;
      let dc = destCoord;
      if (!oc) {
        const res = await fetch(`/api/geocode?query=${encodeURIComponent(origin)}`);
        if (!res.ok) throw new Error(`"${origin}" 주소를 찾을 수 없습니다`);
        oc = await res.json();
      }
      if (!dc) {
        const res = await fetch(`/api/geocode?query=${encodeURIComponent(destination)}`);
        if (!res.ok) throw new Error(`"${destination}" 주소를 찾을 수 없습니다`);
        dc = await res.json();
      }

      const routeRes = await fetch(
        `/api/route?origin=${oc.x},${oc.y}&destination=${dc.x},${dc.y}`
      );
      if (!routeRes.ok) throw new Error("경로를 계산할 수 없습니다");
      const route = await routeRes.json();

      const distanceKm = route.distance / 1000;
      const onewayToll = route.toll_fee;
      const pricePerUnit =
        fuelType === "electric" ? 200 : (fuelPrices?.[fuelType] ?? 0);
      const eff = parseFloat(efficiency);
      const roundTripKm = distanceKm * 2;
      const dailyFuel = (roundTripKm / eff) * pricePerUnit;
      const dailyToll = onewayToll * 2;
      const dailyParking = parseFloat(parking) || 0;
      const dailyTotal = dailyFuel + dailyToll + dailyParking;

      setResult({
        distanceKm: distanceKm.toFixed(1),
        dailyFuel: Math.round(dailyFuel),
        dailyToll: Math.round(dailyToll),
        dailyParking: Math.round(dailyParking),
        dailyTotal: Math.round(dailyTotal),
        weeklyTotal: Math.round(dailyTotal * 5),
        monthlyTotal: Math.round(dailyTotal * 5 * 4.3),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=7ff44a7770dcb8ae5e36b86bfbd8e979&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          window.kakao.maps.load(() => setKakaoLoaded(true));
        }}
      />

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

          <div className="mt-8 space-y-4">
            {/* 출발지 */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                출발지
              </label>
              <input
                type="text"
                value={origin}
                onChange={handleOriginInput}
                onBlur={() => setTimeout(() => setOriginDropdown([]), 150)}
                placeholder="예: 송도더샵16단지 / 수원한일타운아파트 110동"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white transition"
              />
              {originDropdown.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  {originDropdown.map((place) => (
                    <li
                      key={place.id}
                      onMouseDown={() => selectOrigin(place)}
                      className="px-4 py-3 text-sm cursor-pointer hover:bg-emerald-50 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-semibold">{place.place_name}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        {place.address_name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 도착지 */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                도착지
              </label>
              <input
                type="text"
                value={destination}
                onChange={handleDestInput}
                onBlur={() => setTimeout(() => setDestDropdown([]), 150)}
                placeholder="예: 삼성역 5번 출구 / 테헤란로 133 한국타이어빌딩"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white transition"
              />
              {destDropdown.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  {destDropdown.map((place) => (
                    <li
                      key={place.id}
                      onMouseDown={() => selectDest(place)}
                      className="px-4 py-3 text-sm cursor-pointer hover:bg-emerald-50 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-semibold">{place.place_name}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        {place.address_name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 차종 카테고리 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                차종 선택
              </label>
              <div className="grid gap-2">
                {CAR_CATEGORIES.map((cat) => (
                  <label
                    key={cat.key}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-white cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="carCategory"
                      value={cat.key}
                      checked={carCategory === cat.key}
                      onChange={() => selectCarCategory(cat)}
                      className="h-4 w-4"
                    />
                    <span>
                      {cat.label}{" "}
                      <span className="text-slate-400">({cat.desc})</span>
                    </span>
                  </label>
                ))}
              </div>
              {carCategory && (
                <p className="mt-1.5 text-xs text-slate-400">
                  출퇴근 실연비 기준 자동 입력 · 아래에서 직접 수정 가능
                </p>
              )}
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


            {/* 주차비 */}
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
              <p className="text-sm text-slate-500">
                편도 거리:{" "}
                <span className="font-semibold text-slate-800">
                  {result.distanceKm} km
                </span>
              </p>
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
