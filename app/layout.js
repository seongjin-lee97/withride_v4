import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "WithRide — 불안 없는 출퇴근",
  description: "불안 없는 출퇴근, 예측 가능한 이동. WithRide가 출퇴근의 불확실성을 줄입니다.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
