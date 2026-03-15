// 에너지공단 자동차 표시연비 API 프록시
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const model = searchParams.get("model") ?? "";

  const url = new URL("https://apis.data.go.kr/B553530/CAREFF/CAREFF_LIST");
  url.searchParams.set("serviceKey", process.env.ENERGY_API_KEY);
  url.searchParams.set("numOfRows", "10");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("apiType", "json");
  if (model) url.searchParams.set("q2", model);

  const res = await fetch(url.toString());
  if (!res.ok) {
    return Response.json({ error: "에너지공단 API 오류" }, { status: res.status });
  }

  const data = await res.json();
  const items = data.response?.body?.items?.item ?? [];

  const FUEL_MAP = {
    "휘발유": "gasoline",
    "경유": "diesel",
    "LPG": "lpg",
    "전기": "electric",
    "하이브리드": "gasoline",
    "플러그인하이브리드": "gasoline",
  };

  return Response.json(
    items.map((i) => ({
      maker: i.COMP_NM,
      model: i.MODEL_NM,
      fuel: i.FUEL_NM,
      fuelKey: FUEL_MAP[i.FUEL_NM] ?? "gasoline",
      efficiency: parseFloat(i.DISPLAY_EFF) || 0,
      year: i.YEAR,
    }))
  );
}
