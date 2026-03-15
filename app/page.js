"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";

export default function Home() {
  const [count, setCount] = useState(null);
  const [blogUrl, setBlogUrl] = useState("https://blog.naver.com/withride");
  const swiperRef = useRef(null);

  useEffect(() => {
    // Device detection for blog URL
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    setBlogUrl(
      isMobile
        ? "https://m.blog.naver.com/withride"
        : "https://blog.naver.com/withride"
    );

    // Fetch counter
    fetch(
      "https://script.google.com/macros/s/AKfycbwmkgXaRUDbJOqWDO1XvDm36NhIFE_tQPmnj4BQzRa6mJxNONUJrJPze_qbHFti_iW2/exec"
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.count > 0) setCount(data.count);
      })
      .catch(() => {});
  }, []);

  function onSwiperLoad() {
    if (typeof window !== "undefined" && window.Swiper) {
      new window.Swiper(".cluster-swiper", {
        loop: true,
        autoplay: { delay: 3500, disableOnInteraction: false },
        pagination: { el: ".swiper-pagination", clickable: true },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      });
    }
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

      {/* Swiper CSS */}
      <Script
        id="swiper-css-loader"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';document.head.appendChild(l);})();`,
        }}
      />

      {/* Swiper JS */}
      <Script
        src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"
        strategy="afterInteractive"
        onLoad={onSwiperLoad}
      />

      <style>{`
        .cluster-swiper {
          padding-bottom: 2.5rem !important;
        }
        .cluster-swiper .swiper-pagination-bullet {
          background: #d1d5db;
          opacity: 1;
        }
        .cluster-swiper .swiper-pagination-bullet-active {
          background: #059669;
        }
        .cluster-swiper .swiper-button-prev,
        .cluster-swiper .swiper-button-next {
          color: #059669;
          top: 42%;
        }
        .cluster-swiper .swiper-button-prev::after,
        .cluster-swiper .swiper-button-next::after {
          font-size: 1rem;
          font-weight: 900;
        }
      `}</style>

      <div className="bg-white text-slate-900 antialiased">
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-extrabold tracking-tight">
              WithRide
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/calculator"
                className="rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors hidden sm:inline-flex"
              >
                비용 계산하기
              </Link>
              <Link
                href="/commute"
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                경로 등록하기
              </Link>
            </div>
          </div>
        </nav>

        {/* 1. Hero Section */}
        <section className="pt-32 pb-24 px-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-16 md:grid-cols-2 md:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  베타 서비스 운영 중
                </p>
                <h1 className="mt-6 text-4xl font-extrabold tracking-tight leading-snug md:text-5xl lg:text-6xl">
                  오늘도,<br />출퇴근이<br />걱정되나요?
                </h1>
                <p className="mt-6 text-base leading-relaxed text-slate-500 md:text-lg">
                  매일 기약없이 광역버스 줄을 서는,<br />매일 교통혼잡에 시달리는
                  운전을 하는,<br />매일 지옥철에 끼이는,<br />
                  바로 당신의 이야기
                </p>
                <p className="mt-4 text-sm font-semibold text-slate-700">
                  불안 없는 출퇴근, 예측 가능한 이동.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/commute"
                    className="inline-flex flex-col items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3.5 font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    <span className="text-xs">앱·회원가입 없이</span>
                    <span className="text-base">30초 만에 내 경로 신청하기</span>
                  </Link>
                </div>
                {count !== null && (
                  <p className="mt-4 text-sm text-slate-400">
                    현재{" "}
                    <span className="font-semibold text-slate-700">{count}</span>
                    명이 경로를 등록했어요
                  </p>
                )}
              </div>

              {/* Hero Card Carousel */}
              <div className="flex justify-center md:justify-end">
                <div className="w-full max-w-xs">
                  <div className="swiper cluster-swiper">
                    <div className="swiper-wrapper">
                      {/* Slide 1: 송도 → 테헤란로 */}
                      <div className="swiper-slide">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-100">
                          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            실시간 인기 클러스터
                          </div>
                          <h3 className="mt-3 text-base font-bold">
                            🏠 송도 ↔ 🏢 테헤란로
                          </h3>
                          <div className="mt-4 space-y-2.5">
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="text-xs text-slate-500">현재 대기 인원</span>
                              <span className="text-sm font-bold">17명</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                              <span className="text-xs text-slate-500">매칭 차량</span>
                              <span className="text-sm font-bold text-emerald-700">3대</span>
                            </div>
                          </div>
                          <Link
                            href="/commute"
                            className="mt-4 flex w-full items-center justify-center rounded-2xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                          >
                            송도 ↔ 테헤란로 경로 등록하기
                          </Link>
                        </div>
                      </div>

                      {/* Slide 2: 양주옥정 → 테헤란로 */}
                      <div className="swiper-slide">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-100">
                          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            실시간 인기 클러스터
                          </div>
                          <h3 className="mt-3 text-base font-bold">
                            🏠 양주옥정 ↔ 🏢 테헤란로
                          </h3>
                          <div className="mt-4 space-y-2.5">
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="text-xs text-slate-500">현재 대기 인원</span>
                              <span className="text-sm font-bold">11명</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                              <span className="text-xs text-slate-500">매칭 차량</span>
                              <span className="text-sm font-bold text-emerald-700">2대</span>
                            </div>
                          </div>
                          <Link
                            href="/commute"
                            className="mt-4 flex w-full items-center justify-center rounded-2xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                          >
                            양주옥정 ↔ 테헤란로 경로 등록하기
                          </Link>
                        </div>
                      </div>

                      {/* Slide 3: 위례 → 종로 */}
                      <div className="swiper-slide">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-100">
                          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            실시간 인기 클러스터
                          </div>
                          <h3 className="mt-3 text-base font-bold">
                            🏠 위례 ↔ 🏢 종로
                          </h3>
                          <div className="mt-4 space-y-2.5">
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="text-xs text-slate-500">현재 대기 인원</span>
                              <span className="text-sm font-bold">9명</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                              <span className="text-xs text-slate-500">매칭 차량</span>
                              <span className="text-sm font-bold text-emerald-700">2대</span>
                            </div>
                          </div>
                          <Link
                            href="/commute"
                            className="mt-4 flex w-full items-center justify-center rounded-2xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                          >
                            위례 ↔ 종로 경로 등록하기
                          </Link>
                        </div>
                      </div>
                    </div>
                    {/* Pagination dots */}
                    <div className="swiper-pagination"></div>
                    {/* Navigation arrows */}
                    <div className="swiper-button-prev"></div>
                    <div className="swiper-button-next"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Problem Section */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-extrabold tracking-tight leading-snug md:text-3xl lg:text-4xl">
              출퇴근이 힘든 이유는 다르지만,<br />불안의 구조는 같습니다.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                  🚌
                </div>
                <h3 className="mt-4 text-base font-bold">탈 수 있을지 모르는 줄</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  광역버스를 기다리며 매일 줄을 서고<br />오늘 탈 수 있을지
                  걱정합니다.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                  🚗
                </div>
                <h3 className="mt-4 text-base font-bold">매일 시달리는 정체</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  브레이크 계속 밟느라<br />오른쪽 다리는 항상 피곤합니다.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                  🚇
                </div>
                <h3 className="mt-4 text-base font-bold">피할 수 없는 혼잡</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  지옥철 속에서<br />매일 같은 피로가 반복됩니다.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-3xl bg-emerald-600 p-4 text-center">
              <p className="text-base font-semibold text-white md:text-lg">
                WithRide는 이 불확실성을 예측 가능한 이동으로 바꿉니다.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Value Section */}
        <section id="value" className="py-24 px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl">
              기다림 없는 이동을 설계합니다.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white">
                  1
                </div>
                <h3 className="mt-5 font-bold">경로 기반 매칭</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  같은 방향으로 이동하는 사람들을 모아 효율적인 이동을 만듭니다.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white">
                  2
                </div>
                <h3 className="mt-5 font-bold">예상 탑승 인원 표시</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  내 앞에 몇 명이 있는지 미리 확인할 수 있습니다.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white">
                  3
                </div>
                <h3 className="mt-5 font-bold">출발 시간 예측</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  언제 출발할지 알 수 있어 막연한 기다림이 사라집니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Proof Section */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                <div className="text-2xl">🔁</div>
                <p className="mt-3 text-sm font-semibold leading-snug">
                  환승 없이<br />한 번에
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                <div className="text-2xl">💺</div>
                <p className="mt-3 text-sm font-semibold leading-snug">
                  자리 걱정<br />없이
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                <div className="text-2xl">🚶</div>
                <p className="mt-3 text-sm font-semibold leading-snug">
                  뛰지 않아도<br />되는 이동
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                <div className="text-2xl">⏱️</div>
                <p className="mt-3 text-sm font-semibold leading-snug">
                  대기 시간을<br />줄이는 구조
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Comfort Section */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight leading-snug md:text-3xl lg:text-4xl">
                  그래서 출퇴근이<br />더 편안해집니다.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-500">
                  예측 가능한 이동은 단순한 편의가 아닙니다.<br />
                  매일의 스트레스가 줄어드는 경험입니다.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">✓</span>
                  <p className="text-sm text-slate-700">줄을 보며 초조해하지 않아도 됩니다</p>
                </div>
                <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">✓</span>
                  <p className="text-sm text-slate-700">늦을까 걱정하지 않아도 됩니다</p>
                </div>
                <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">✓</span>
                  <p className="text-sm text-slate-700">이동 시간이 더 안정적으로 바뀝니다</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Social Proof Section */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              이미 이런 경로에서 시작되고 있습니다
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  활성 클러스터
                </div>
                <h3 className="mt-3 text-lg font-bold">송도 → 삼성역</h3>
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">등록 사용자</span>
                    <span className="font-semibold">42명</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">평균 대기시간 감소</span>
                    <span className="font-semibold text-emerald-600">11분</span>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  활성 클러스터
                </div>
                <h3 className="mt-3 text-lg font-bold">양주 → 강남</h3>
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">등록 사용자</span>
                    <span className="font-semibold">27명</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">평균 이동시간 감소</span>
                    <span className="font-semibold text-emerald-600">18분</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Final CTA */}
        <section className="py-32 px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
              오늘도 줄 설 건가요?
            </h2>
            <p className="mt-4 text-slate-500">
              더 예측 가능한 출퇴근이 기다리고 있습니다.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/commute"
                className="inline-flex flex-col items-center justify-center rounded-2xl bg-emerald-600 px-8 py-4 font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                <span className="text-xs">앱·회원가입 없이</span>
                <span className="text-base">30초 만에 내 경로 신청하기</span>
              </Link>
              <Link
                href="/calculator"
                className="inline-flex flex-col items-center justify-center rounded-2xl border border-emerald-600 px-8 py-4 font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <span className="text-xs">무료 계산기</span>
                <span className="text-base">출퇴근 비용 계산하기</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Blog Banner */}
        <section className="py-12 px-6 bg-slate-50 border-t border-slate-100">
          <div className="mx-auto max-w-3xl">
            <a
              href={blogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  🔬
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">네이버 블로그</p>
                  <p className="text-sm font-bold text-slate-800">출퇴근 연구소 | withride</p>
                  <p className="text-xs text-slate-500 mt-0.5">출퇴근 꿀팁 · 이동 인사이트 연재 중</p>
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-emerald-500 transition-colors text-lg">→</span>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-100">
          <div className="mx-auto max-w-3xl px-6 py-8 text-xs text-slate-400">
            © WithRide (베타 테스트 운영 중)
          </div>
        </footer>
      </div>
    </>
  );
}
