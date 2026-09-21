import type { ReactNode } from "react";

export default function WidgetLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <meta httpEquiv="refresh" content="1800" />
      {children}
    </>
  );
}
