import type { Metadata } from "next";
import IndicatorsClient from "./IndicatorsClient";
import { FundingRateBanner } from "@/components/FundingRateBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Indicators Workbench",
  description: "U2Algo indicators workbench on live crypto OHLCV (computed in backend).",
  alternates: { canonical: "/indicators" },
};

export default function IndicatorsPage() {
  return (
    <IndicatorsClient>
      <FundingRateBanner />
    </IndicatorsClient>
  );
}
