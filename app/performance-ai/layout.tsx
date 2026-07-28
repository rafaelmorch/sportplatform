import type { ReactNode } from "react";
import PerformanceAiFloatingMenu from "@/components/performance-ai/PerformanceAiFloatingMenu";

type PerformanceAiLayoutProps = {
  children: ReactNode;
};

export default function PerformanceAiLayout({
  children,
}: PerformanceAiLayoutProps) {
  return (
    <>
      {children}
      <PerformanceAiFloatingMenu />
    </>
  );
}
