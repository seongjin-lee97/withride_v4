// 카카오 Directions API 프록시
// 경로 거리 + 톨비 반환
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");       // "lng,lat"
  const destination = searchParams.get("destination"); // "lng,lat"
  const hipass = searchParams.get("hipass") === "true";

  if (!origin || !destination) {
    return Response.json({ error: "origin, destination 필요" }, { status: 400 });
  }

  const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("summary", "true");
  if (hipass) url.searchParams.set("road_info", "true");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
  });

  if (!res.ok) {
    return Response.json({ error: "카카오 API 오류" }, { status: res.status });
  }

  const data = await res.json();
  const section = data.routes?.[0]?.summary;
  if (!section) {
    return Response.json({ error: "경로를 찾을 수 없습니다" }, { status: 404 });
  }

  return Response.json({
    distance: section.distance,   // 미터
    duration: section.duration,   // 초
    toll_fee: section.fare?.toll ?? 0, // 원
    taxi_fee: section.fare?.taxi ?? 0,
  });
}
