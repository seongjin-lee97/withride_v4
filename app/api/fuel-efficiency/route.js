// 에너지공단 자동차 표시연비 API 프록시
// 제조사 + 모델명으로 공인연비 조회
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const maker = searchParams.get("maker") ?? "";
  const model = searchParams.get("model") ?? "";

  const url = new URL("https://apis.data.go.kr/B553530/CAREFF/getCarEffInfo");
  url.searchParams.set("serviceKey", process.env.ENERGY_API_KEY);
  url.searchParams.set("numOfRows", "10");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("type", "json");
  if (maker) url.searchParams.set("maker", maker);
  if (model) url.searchParams.set("model", model);

  const res = await fetch(url.toString());
  if (!res.ok) {
    return Response.json({ error: "에너지공단 API 오류" }, { status: res.status });
  }

  const data = await res.json();
  const items = data.response?.body?.items?.item ?? [];

  return Response.json(
    items.map((i) => ({
      maker: i.maker,
      model: i.model,
      fuel: i.fuel,
      combined_efficiency: parseFloat(i.comBin ?? i.fuelEffComb ?? 0), // 복합연비
      city_efficiency: parseFloat(i.cityBin ?? i.fuelEffCity ?? 0),
      highway_efficiency: parseFloat(i.highBin ?? i.fuelEffHighway ?? 0),
    }))
  );
}
