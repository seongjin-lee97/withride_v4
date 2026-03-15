// 오피넷 API 프록시
// 전국 평균 유가 반환 (휘발유/경유/LPG)
export async function GET() {
  const url = new URL("https://www.opinet.co.kr/api/avgAllPrice.do");
  url.searchParams.set("out", "json");
  url.searchParams.set("certkey", process.env.OPINET_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    return Response.json({ error: "오피넷 API 오류" }, { status: res.status });
  }

  const data = await res.json();
  const items = data.RESULT?.OIL ?? [];

  // 유종코드: B027=휘발유, D047=경유, K015=LPG
  const map = { B027: "gasoline", D047: "diesel", K015: "lpg" };
  const prices = {};
  for (const item of items) {
    const key = map[item.PRODCD];
    if (key) prices[key] = parseFloat(item.PRICE);
  }

  return Response.json(prices);
}
