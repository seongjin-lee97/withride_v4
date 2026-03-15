// 카카오 주소 → 좌표 변환 프록시
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return Response.json({ error: "query 필요" }, { status: 400 });
  }

  const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "1");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
  });

  if (!res.ok) {
    return Response.json({ error: "지오코딩 오류" }, { status: res.status });
  }

  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) {
    return Response.json({ error: "주소를 찾을 수 없습니다" }, { status: 404 });
  }

  return Response.json({ x: doc.x, y: doc.y, address: doc.address_name });
}
