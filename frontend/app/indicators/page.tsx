import type { Metadata } from "next";
import IndicatorsClient from "./IndicatorsClient";
import { FundingRateBanner } from "@/components/FundingRateBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Indicators Workbench",
  description: "U2Algo indicators workbench on live crypto OHLCV (computed in backend).",
  alternates: {
    canonical: "/indicators",
    languages: {
      en: "/indicators?lang=en",
      tr: "/indicators?lang=tr",
      th: "/indicators?lang=th",
      ar: "/indicators?lang=ar",
      ru: "/indicators?lang=ru",
      zh: "/indicators?lang=zh",
      "x-default": "/indicators",
    },
  },
};

export default function IndicatorsPage() {
  return (
    <IndicatorsClient>
      <FundingRateBanner />
    </IndicatorsClient>
  );
}
