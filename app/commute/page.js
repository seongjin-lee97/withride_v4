"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzySUTpJGzUTkHHxtbfoWs7t9DClHwrpw7z63ZSQ7QAip3qdEh0VYuN7jj3RFbvQiPf/exec";

const PASSENGER_OPTIONS = {
  "경차/소형": [1, 2, 3],
  "준중형/중형": [1, 2, 3],
  "SUV/RV": [1, 2, 3, 4, 5],
  "세단 대형": [1, 2, 3],
};

const SLOT_MAP = {
  "17시 이전": ["16:00", "16:30"],
  "17~18시": ["17:00", "17:30"],
  "18~19시": ["18:00", "18:30"],
  "19~20시": ["19:00", "19:30"],
  "20시 이후": ["20:00", "20:30"],
};

function formatPhone(value) {
  const numbers = value.replace(/[^0-9]/g, "");
  if (numbers.length < 4) return numbers;
  if (numbers.length < 8) return numbers.slice(0, 3) + "-" + numbers.slice(3);
  return (
    numbers.slice(0, 3) +
    "-" +
    numbers.slice(3, 7) +
    "-" +
    numbers.slice(7, 11)
  );
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export default function CommutePage() {
  const [count, setCount] = useState(null);
  const [kakaoLoaded, setKakaoLoaded] = useState(false);

  // Form state
  const [from, setFrom] = useState("");
  const [fromLat, setFromLat] = useState("");
  const [fromLng, setFromLng] = useState("");
  const [to, setTo] = useState("");
  const [toLat, setToLat] = useState("");
  const [toLng, setToLng] = useState("");
  const [fromDropdown, setFromDropdown] = useState([]);
  const [toDropdown, setToDropdown] = useState([]);

  const [arrivalTime, setArrivalTime] = useState("");
  const [flexibility, setFlexibility] = useState("");
  const [earlyArrival, setEarlyArrival] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [timeFixed, setTimeFixed] = useState("");
  const [exactTime, setExactTime] = useState("");
  const [gender, setGender] = useState("");
  const [contact, setContact] = useState("");
  const [carpoolDriver, setCarpoolDriver] = useState(false);
  const [carpoolTendency, setCarpoolTendency] = useState("");
  const [carType, setCarType] = useState("");
  const [passengerCount, setPassengerCount] = useState("");
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [privacyDetailOpen, setPrivacyDetailOpen] = useState(false);

  // UI state
  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Dropdown ref for close on blur
  const fromDropdownRef = useRef(null);
  const toDropdownRef = useRef(null);

  useEffect(() => {
    fetch(SCRIPT_URL)
      .then((r) => r.json())
      .then((data) => {
        if (data.count > 0) setCount(data.count);
      })
      .catch(() => {});
  }, []);

  // Kakao place search
  const searchPlace = useCallback(
    (query) => {
      return new Promise((resolve) => {
        if (!kakaoLoaded || !query || query.length < 2) return resolve([]);
        if (
          typeof window === "undefined" ||
          !window.kakao ||
          !window.kakao.maps
        )
          return resolve([]);
        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(query, (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            resolve(data.slice(0, 6));
          } else {
            resolve([]);
          }
        });
      });
    },
    [kakaoLoaded]
  );

  const debouncedSearchFrom = useCallback(
    debounce(async (val) => {
      const results = await searchPlace(val);
      setFromDropdown(results);
    }, 300),
    [searchPlace]
  );

  const debouncedSearchTo = useCallback(
    debounce(async (val) => {
      const results = await searchPlace(val);
      setToDropdown(results);
    }, 300),
    [searchPlace]
  );

  function handleFromInput(e) {
    const val = e.target.value;
    setFrom(val);
    setFromLat("");
    setFromLng("");
    debouncedSearchFrom(val);
  }

  function handleToInput(e) {
    const val = e.target.value;
    setTo(val);
    setToLat("");
    setToLng("");
    debouncedSearchTo(val);
  }

  function selectFromPlace(place) {
    setFrom(place.place_name);
    setFromLat(place.y);
    setFromLng(place.x);
    setFromDropdown([]);
  }

  function selectToPlace(place) {
    setTo(place.place_name);
    setToLat(place.y);
    setToLng(place.x);
    setToDropdown([]);
  }

  // Departure time slots
  const slots = SLOT_MAP[departureTime] || [];
  const showExactTimePicker =
    timeFixed === "거의 같은 시간" && slots.length > 0;
  const showPatternFixed = slots.length > 0;
  const showEarlyArrivalQuestion = flexibility === "정확히 그 시간";

  // Passenger options based on carType
  const passengerOptions = PASSENGER_OPTIONS[carType] || [1, 2, 3];

  function validate() {
    const newErrors = {};
    if (!from) newErrors["err-from"] = "출발 지점을 입력해주세요";
    if (!to) newErrors["err-to"] = "도착 지점을 입력해주세요";
    if (!arrivalTime) newErrors["err-arrival-time"] = "도착 시간을 선택해주세요";
    if (!flexibility) newErrors["err-flexibility"] = "시간 유연성을 선택해주세요";
    if (flexibility === "정확히 그 시간" && !earlyArrival)
      newErrors["err-early-arrival"] = "항목을 선택해주세요";
    if (!departureTime) newErrors["err-departure-time"] = "퇴근 시간대를 선택해주세요";
    if (!timeFixed) newErrors["err-time-fixed"] = "퇴근 패턴을 선택해주세요";
    if (
      timeFixed === "거의 같은 시간" &&
      departureTime !== "일정하지 않음" &&
      !exactTime
    )
      newErrors["err-exact-time"] = "구체적인 퇴근 시간을 선택해주세요";

    if (carpoolDriver) {
      if (!carpoolTendency)
        newErrors["err-carpool-tendency"] = "카풀 참여 성향을 선택해주세요";
      if (!carType) newErrors["err-car-type"] = "차량 종류를 선택해주세요";
      if (!passengerCount)
        newErrors["err-passenger"] = "탑승 가능 인원을 선택해주세요";
    }
    if (!gender) newErrors["err-gender"] = "성별을 선택해주세요";
    const digits = contact.replace(/[^0-9]/g, "");
    if (!contact) {
      newErrors["err-contact"] = "연락처를 입력해주세요";
    } else if (digits.length !== 11 || !digits.startsWith("010")) {
      newErrors["err-contact"] = "올바른 형식으로 입력해주세요 (010-XXXX-XXXX)";
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const effectiveFlexibility =
      flexibility === "정확히 그 시간" && earlyArrival
        ? earlyArrival
        : flexibility;

    setSubmitted(true);
    setStatusMsg(`등록 완료! 경로가 매칭되면 ${contact}로 알려드릴게요.`);

    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        timestamp: new Date().toLocaleString("ko-KR"),
        from,
        fromLat,
        fromLng,
        to,
        toLat,
        toLng,
        arrivalTime,
        flexibility: effectiveFlexibility,
        departureTime,
        timeFixed,
        exactTime,
        gender,
        contact,
        carpoolDriver: carpoolDriver ? "예" : "아니오",
        carpoolTendency: carpoolDriver ? carpoolTendency : "",
        carType: carpoolDriver ? carType : "",
        passengerCount: carpoolDriver ? passengerCount : "",
      }),
    });
  }

  function ErrorMsg({ id }) {
    if (!errors[id]) return null;
    return (
      <span className="text-xs text-red-500 font-medium">{errors[id]}</span>
    );
  }

  return (
    <>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-KWZPVF5Y4Q"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-KWZPVF5Y4Q');
      `}</Script>

      {/* Kakao Maps SDK */}
      <Script
        src="//dapi.kakao.com/v2/maps/sdk.js?appkey=7ff44a7770dcb8ae5e36b86bfbd8e979&libraries=services"
        strategy="afterInteractive"
        onLoad={() => setKakaoLoaded(true)}
      />

      <div className="bg-white text-slate-900 antialiased">
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="mx-auto max-w-3xl px-6 py-4 flex items-center">
            <Link href="/" className="text-lg font-extrabold tracking-tight py-1">
              WithRide
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <main className="mx-auto max-w-3xl px-4">
          <section className="pt-24 pb-8">
            {/* Headline */}
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>{" "}
                출퇴근 경로 등록
              </p>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
                출퇴근 경로만 등록해두세요
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                앱 설치 전에,{" "}
                <span className="font-semibold text-slate-900">출퇴근 경로만 등록</span>
                해두세요. 같은 방향 운전자가 등록되는 순간{" "}
                <span className="font-semibold text-slate-900">알려드리고</span>, 첫
                동승은{" "}
                <span className="font-semibold text-slate-900">무료</span>로
                연결해드립니다.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                * 불필요한 오해를 줄이기 위해 같은 성별로 매칭합니다.
              </p>
            </div>

            {/* SMS Mock */}
            <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-2 text-center">
                예시 문자 알림
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="w-full rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                  <div className="text-sm font-semibold">[WithRide 퇴근길 동승]</div>
                  <p className="mt-1 text-sm leading-relaxed">
                    매칭 가능! 오늘 퇴근길 무료 동승이 가능합니다.
                  </p>
                  <div className="mt-2 text-sm">
                    • 출발: <span className="font-semibold">삼성역</span>
                    <br />
                    • 도착: <span className="font-semibold">송도더샵16단지</span>
                    <br />
                    • 출발 시간: <span className="font-semibold">18:40</span>
                  </div>
                </div>
                <div className="w-full rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                  <div className="text-sm font-semibold">[WithRide 출근길 동승]</div>
                  <p className="mt-1 text-sm leading-relaxed">
                    매칭 가능! 오늘 출근길 무료 동승이 가능합니다.
                  </p>
                  <div className="mt-2 text-sm">
                    • 출발: <span className="font-semibold">송도더샵16단지</span>
                    <br />
                    • 도착: <span className="font-semibold">삼성역</span>
                    <br />
                    • 출발 시간: <span className="font-semibold">07:10</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500">오늘은</div>
                  <div className="mt-1 text-sm font-semibold">경로만 등록</div>
                  <div className="mt-2 text-xs text-slate-500">딱 20초면 끝</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500">매칭시</div>
                  <div className="mt-1 text-sm font-semibold">문자만 확인</div>
                  <div className="mt-2 text-xs text-slate-500">실탑승은 그때 결정</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500">처음엔</div>
                  <div className="mt-1 text-sm font-semibold">무료로 한 번</div>
                  <div className="mt-2 text-xs text-slate-500">부담 없이 체험</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500">맘에 들면</div>
                  <div className="mt-1 text-sm font-semibold">계속 같이</div>
                  <div className="mt-2 text-xs text-slate-500">정기 동승 가능</div>
                </div>
              </div>
            </div>
          </section>

          {/* Register form */}
          <section id="register" className="py-10">
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">
                  내 출퇴근 경로 등록
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  지금은 '대기 리스트' 형태로 운영해요. 등록해두면, 같은 방향
                  운전자가 생겼을 때 알려드립니다.
                </p>
                {count !== null && (
                  <p className="mt-2 text-sm text-slate-500">
                    현재{" "}
                    <span className="font-semibold text-slate-900">{count}</span>
                    명이 경로를 등록했어요
                  </p>
                )}
                <div className="mt-4 rounded-3xl border border-slate-200 p-5 bg-slate-50">
                  <div className="text-sm font-semibold">등록하고 잊어도 되는 이유</div>
                  <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                    <li>
                      • 매칭이 없을 수도 있어요. 대신{" "}
                      <span className="font-semibold">생기는 순간에</span> 알려드려요.
                    </li>
                    <li>
                      • 첫 매칭시 꼭 탈 필요 없어요. 문자를 또 받으면{" "}
                      <span className="font-semibold">가능한 날에</span> 타면 됩니다.
                    </li>
                    <li>
                      • 첫 동승은 무료로 연결되어,{" "}
                      <span className="font-semibold">부담없이 퇴근해요</span>.
                    </li>
                  </ul>
                </div>
              </div>

              <form
                className="rounded-3xl border border-slate-200 p-6 bg-slate-50"
                onSubmit={handleSubmit}
              >
                <div className="grid gap-4">
                  {/* 출근 지점 (집) */}
                  <label className="grid gap-1">
                    <span className="text-sm font-semibold">🏠 출근 지점(집 근처)</span>
                    <ErrorMsg id="err-to" />
                    <div className="relative">
                      <input
                        value={to}
                        onChange={handleToInput}
                        onBlur={() =>
                          setTimeout(() => setToDropdown([]), 150)
                        }
                        required
                        autoComplete="off"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                        placeholder="예: 송도더샵16단지 / 수원한일타운아파트 110동"
                      />
                      {toDropdown.length > 0 && (
                        <div
                          ref={toDropdownRef}
                          className="absolute z-10 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden"
                        >
                          {toDropdown.map((place, i) => (
                            <div
                              key={i}
                              className="px-4 py-3 text-sm cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectToPlace(place);
                              }}
                            >
                              <div className="font-medium text-slate-900">
                                {place.place_name}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {place.road_address_name || place.address_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      실제 승하차 지점은 매칭된 경로에 따라 달라질 수 있습니다.
                    </span>
                  </label>

                  {/* 퇴근 지점 (회사) */}
                  <label className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">🏢 퇴근 지점(회사 근처)</span>
                      <ErrorMsg id="err-from" />
                    </div>
                    <div className="relative">
                      <input
                        value={from}
                        onChange={handleFromInput}
                        onBlur={() =>
                          setTimeout(() => setFromDropdown([]), 150)
                        }
                        required
                        autoComplete="off"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                        placeholder="예: 삼성역 5번 출구 / 테헤란로 133 한국타이어빌딩"
                      />
                      {fromDropdown.length > 0 && (
                        <div
                          ref={fromDropdownRef}
                          className="absolute z-10 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden"
                        >
                          {fromDropdown.map((place, i) => (
                            <div
                              key={i}
                              className="px-4 py-3 text-sm cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectFromPlace(place);
                              }}
                            >
                              <div className="font-medium text-slate-900">
                                {place.place_name}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {place.road_address_name || place.address_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      실제 승하차 지점은 매칭된 경로에 따라 달라질 수 있습니다.
                    </span>
                  </label>

                  {/* Map links */}
                  <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
                    <span>참고용 지도: </span>
                    <a
                      href="https://map.kakao.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <img
                        src="https://map.kakao.com/favicon.ico"
                        alt="카카오"
                        className="h-3.5 w-3.5"
                      />
                      카카오
                    </a>
                    <a
                      href="https://map.naver.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <img
                        src="https://ssl.pstatic.net/static/maps/assets/icons/favicon.ico"
                        alt="네이버"
                        className="h-3.5 w-3.5"
                      />
                      네이버
                    </a>
                    <a
                      href="https://www.google.com/maps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <img
                        src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32"
                        alt="구글"
                        className="h-3.5 w-3.5"
                      />
                      구글
                    </a>
                  </div>

                  {/* 출근 도착 시간 */}
                  <label className="grid gap-1">
                    <span className="text-sm font-semibold">몇 시까지 출근해야 하나요?</span>
                    <ErrorMsg id="err-arrival-time" />
                    <select
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
                    >
                      <option value="">시간 선택</option>
                      <option value="07:30">07:30</option>
                      <option value="08:00">08:00</option>
                      <option value="08:30">08:30</option>
                      <option value="09:00">09:00</option>
                      <option value="09:30">09:30</option>
                      <option value="10:00">10:00</option>
                      <option value="10:30">10:30</option>
                    </select>
                  </label>

                  {/* 출근 시간 유연성 */}
                  <label className="grid gap-1">
                    <span className="text-sm font-semibold">출근 시간은 얼마나 유동적인가요?</span>
                    <ErrorMsg id="err-flexibility" />
                    <div className="grid grid-cols-2 gap-2">
                      {["정확히 그 시간", "±15분 가능", "±30분 가능", "±1시간 가능"].map(
                        (val) => (
                          <label
                            key={val}
                            className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-white"
                          >
                            <input
                              type="radio"
                              name="flexibility"
                              value={val}
                              checked={flexibility === val}
                              onChange={() => {
                                setFlexibility(val);
                                if (val !== "정확히 그 시간") setEarlyArrival("");
                              }}
                              className="h-4 w-4"
                            />
                            <span>{val}</span>
                          </label>
                        )
                      )}
                    </div>
                  </label>

                  {/* 일찍 도착 가능 시간 */}
                  {showEarlyArrivalQuestion && (
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">몇 분까지 일찍 도착할 수 있나요?</span>
                        <ErrorMsg id="err-early-arrival" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {["-10분 가능", "-15분 가능", "-30분 가능", "-1시간 가능"].map(
                          (val) => (
                            <label
                              key={val}
                              className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-white"
                            >
                              <input
                                type="radio"
                                name="early-arrival"
                                value={val}
                                checked={earlyArrival === val}
                                onChange={() => setEarlyArrival(val)}
                                className="h-4 w-4"
                              />
                              <span>{val}</span>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* 퇴근 시간대 */}
                  <label className="grid gap-1">
                    <span className="text-sm font-semibold">평소 퇴근은 언제쯤 하세요?</span>
                    <ErrorMsg id="err-departure-time" />
                    <select
                      value={departureTime}
                      onChange={(e) => {
                        setDepartureTime(e.target.value);
                        setExactTime("");
                        const newSlots = SLOT_MAP[e.target.value] || [];
                        if (newSlots.length === 0 && timeFixed === "거의 같은 시간") {
                          setTimeFixed("");
                        }
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
                    >
                      <option value="">시간 선택</option>
                      <option value="17시 이전">17시 이전</option>
                      <option value="17~18시">17~18시</option>
                      <option value="18~19시">18~19시</option>
                      <option value="19~20시">19~20시</option>
                      <option value="20시 이후">20시 이후</option>
                      <option value="일정하지 않음">일정하지 않음</option>
                    </select>
                  </label>

                  {/* 퇴근 패턴 */}
                  <label className="grid gap-1">
                    <span className="text-sm font-semibold">퇴근 패턴은 어떤가요?</span>
                    <ErrorMsg id="err-time-fixed" />
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        {showPatternFixed && (
                          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-white">
                            <input
                              type="radio"
                              name="time-fixed"
                              value="거의 같은 시간"
                              checked={timeFixed === "거의 같은 시간"}
                              onChange={() => setTimeFixed("거의 같은 시간")}
                              className="h-4 w-4"
                            />
                            <span>거의 같은 시간</span>
                          </label>
                        )}
                        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-white">
                          <input
                            type="radio"
                            name="time-fixed"
                            value="매일 다름"
                            checked={timeFixed === "매일 다름"}
                            onChange={() => setTimeFixed("매일 다름")}
                            className="h-4 w-4"
                          />
                          <span>매일 다름</span>
                        </label>
                      </div>

                      {/* 정확한 퇴근 시간 선택 */}
                      {showExactTimePicker && (
                        <div className="grid gap-2">
                          <ErrorMsg id="err-exact-time" />
                          <div className="grid grid-cols-2 gap-2">
                            {slots.map((slot) => (
                              <label
                                key={slot}
                                className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-white"
                              >
                                <input
                                  type="radio"
                                  name="exact-time"
                                  value={slot}
                                  checked={exactTime === slot}
                                  onChange={() => setExactTime(slot)}
                                  className="h-4 w-4"
                                />
                                <span>{slot}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* 성별 */}
                  <label className="grid gap-1">
                    <span className="text-sm font-semibold">성별(동일 성별 매칭)</span>
                    <ErrorMsg id="err-gender" />
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-white">
                        <input
                          type="radio"
                          name="gender"
                          value="남성"
                          checked={gender === "남성"}
                          onChange={() => setGender("남성")}
                          className="h-4 w-4"
                        />
                        <span>남성</span>
                      </label>
                      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-white">
                        <input
                          type="radio"
                          name="gender"
                          value="여성"
                          checked={gender === "여성"}
                          onChange={() => setGender("여성")}
                          className="h-4 w-4"
                        />
                        <span>여성</span>
                      </label>
                    </div>
                  </label>

                  {/* 연락처 */}
                  <label className="grid gap-1">
                    <span className="text-sm font-semibold">연락처</span>
                    <ErrorMsg id="err-contact" />
                    <input
                      value={contact}
                      onChange={(e) => setContact(formatPhone(e.target.value))}
                      inputMode="numeric"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
                      placeholder="예: 010-1234-5678"
                    />
                    <span className="text-xs text-slate-500">
                      매칭 알림 문자를 보내드립니다.
                    </span>
                  </label>

                  {/* 카풀 운전자 */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">🚗</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          운전하면서 카풀도 해보실래요?
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          하고 싶을 때만 참여해도 됩니다.
                        </p>
                      </div>
                    </div>
                    <label className="mt-4 flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={carpoolDriver}
                        onChange={(e) => {
                          setCarpoolDriver(e.target.checked);
                          if (!e.target.checked) {
                            setCarpoolTendency("");
                            setCarType("");
                            setPassengerCount("");
                          }
                        }}
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="text-sm font-semibold">카풀 운전도 가능합니다</span>
                    </label>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      같은 방향으로 출퇴근하신다면<br />기름값을 나누고 편하게
                      이동할 수 있어요.
                    </p>

                    {carpoolDriver && (
                      <div className="mt-4 border-t border-slate-100 pt-4 grid gap-4">
                        {/* 카풀 참여 성향 */}
                        <div className="grid gap-2">
                          <span className="text-sm font-semibold">카풀 참여 성향</span>
                          <ErrorMsg id="err-carpool-tendency" />
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              "탑승 위주, 가끔 운전",
                              "운전 위주, 가끔 탑승",
                              "운전만 할게요",
                              "일단 하면서 생각할게요",
                            ].map((val) => (
                              <label
                                key={val}
                                className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-white cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name="carpoolTendency"
                                  value={val}
                                  checked={carpoolTendency === val}
                                  onChange={() => setCarpoolTendency(val)}
                                  className="h-4 w-4 shrink-0"
                                />
                                <span>{val}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* 차량 종류 */}
                        <div className="grid gap-2">
                          <span className="text-sm font-semibold">차량 종류</span>
                          <ErrorMsg id="err-car-type" />
                          <div className="grid gap-2">
                            {[
                              {
                                val: "경차/소형",
                                desc: "(모닝, 레이, 스파크 등)",
                              },
                              {
                                val: "준중형/중형",
                                desc: "(아반떼, K3, 쏘나타, BMW 3시리즈 등)",
                              },
                              {
                                val: "SUV/RV",
                                desc: "(투싼, 스포티지, 쏘렌토, 카니발, BMW X3 등)",
                              },
                              {
                                val: "세단 대형",
                                desc: "(그랜저, K8, 벤츠 E클래스)",
                              },
                            ].map(({ val, desc }) => (
                              <label
                                key={val}
                                className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-white"
                              >
                                <input
                                  type="radio"
                                  name="carType"
                                  value={val}
                                  checked={carType === val}
                                  onChange={() => {
                                    setCarType(val);
                                    setPassengerCount("");
                                  }}
                                  className="h-4 w-4"
                                />
                                <span>
                                  {val}{" "}
                                  <span className="text-slate-400">{desc}</span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* 탑승 가능 인원 */}
                        <div className="grid gap-2 mt-4">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold">탑승 가능 인원</span>
                            <span className="text-xs text-slate-400">
                              💰 인원이 많을수록 더 많은 수익
                            </span>
                          </div>
                          <ErrorMsg id="err-passenger" />
                          <div className="grid grid-cols-3 gap-2">
                            {passengerOptions.map((n) => (
                              <label
                                key={n}
                                className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-white"
                              >
                                <input
                                  type="radio"
                                  name="passengerCount"
                                  value={String(n)}
                                  checked={passengerCount === String(n)}
                                  onChange={() => setPassengerCount(String(n))}
                                  className="h-4 w-4"
                                />
                                <span>{n}명</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 개인정보 동의 */}
                  <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacyAgree}
                        onChange={(e) => setPrivacyAgree(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0"
                      />
                      <span className="text-sm">
                        <span className="font-semibold">개인정보 수집 및 이용 동의</span>
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          필수
                        </span>
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPrivacyDetailOpen((v) => !v)}
                      className="mt-2 ml-7 text-xs font-semibold text-slate-500 hover:text-slate-900 underline underline-offset-2"
                    >
                      내용보기
                    </button>
                    {privacyDetailOpen && (
                      <div className="mt-3 ml-7">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                          <p>
                            WithRide는 동승 매칭 서비스 제공을 위해 아래와 같이
                            개인정보를 수집·이용합니다.
                          </p>
                          <table className="mt-3 w-full text-left">
                            <tbody>
                              <tr className="border-b border-slate-200">
                                <td className="py-2 pr-3 font-semibold text-slate-900 align-top whitespace-nowrap">
                                  수집 항목
                                </td>
                                <td className="py-2">
                                  휴대전화번호, 출퇴근 경로(출발지·도착지), 성별,
                                  출근 시간대, 퇴근 시간대
                                </td>
                              </tr>
                              <tr className="border-b border-slate-200">
                                <td className="py-2 pr-3 font-semibold text-slate-900 align-top whitespace-nowrap">
                                  수집·이용 목적
                                </td>
                                <td className="py-2">
                                  동승 경로 매칭 및 매칭 알림 SMS 발송
                                </td>
                              </tr>
                              <tr className="border-b border-slate-200">
                                <td className="py-2 pr-3 font-semibold text-slate-900 align-top whitespace-nowrap">
                                  보유·이용 기간
                                </td>
                                <td className="py-2">
                                  <span className="font-semibold text-slate-900">
                                    수집일로부터 1년
                                  </span>{" "}
                                  또는 삭제 요청 시 즉시 파기
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <p className="mt-3 text-slate-500">
                            * 귀하는 위 동의를 거부할 권리가 있으며, 동의를
                            거부하실 경우 경로 등록 및 매칭 서비스 이용이
                            제한됩니다.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!privacyAgree || submitted}
                    className={`mt-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-colors ${
                      privacyAgree && !submitted
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-emerald-600/40 cursor-not-allowed"
                    }`}
                  >
                    {submitted ? "등록 완료 ✓" : "경로 등록하고 알림 받기"}
                  </button>

                  {statusMsg && (
                    <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {statusMsg}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </section>

          {/* How it works */}
          <section id="how" className="py-10">
            <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">
              어떻게 동작하나요?
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 p-6 bg-slate-50">
                <div className="text-sm font-semibold">1) 출퇴근 경로 등록</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  출발 · 도착 방향 · 출퇴근 시간대만 적어두면 끝.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 p-6 bg-slate-50">
                <div className="text-sm font-semibold">2) 운전자 노선 등록</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  같은 방향 운전자가 들어오면 자동으로 후보가 만들어져요.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 p-6 bg-slate-50">
                <div className="text-sm font-semibold">3) 알림 → 첫 동승 무료</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  처음은 무료 체험으로 부담 없이. 이후엔 선택적으로 계속.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="text-sm font-semibold">운영 원칙</div>
              <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                <li>• 출퇴근길 이동 편의를 위한 동승 연결입니다.</li>
                <li>• 불필요한 오해를 줄이기 위해 같은 성별로 매칭합니다.</li>
                <li>• 개인정보는 최소로 받습니다. (이동 정보 중심)</li>
                <li>
                  • 매칭은 07:00~09:00, 18:00~20:00 시간대에만 진행됩니다.
                  (탑승 시각 기준)
                </li>
              </ul>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200">
          <div className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-500">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>© 위드라이드 (베타 테스트)</div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
