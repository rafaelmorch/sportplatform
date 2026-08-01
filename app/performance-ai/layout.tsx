import type { ReactNode } from "react";

import PerformanceAiSubscriptionGate from "@/components/performance-ai/PerformanceAiSubscriptionGate";

type PerformanceAiLayoutProps = {
  children: ReactNode;
};

export default function PerformanceAiLayout({
  children,
}: PerformanceAiLayoutProps) {
  return (
    <PerformanceAiSubscriptionGate>
      {children}
    </PerformanceAiSubscriptionGate>
  );
}
