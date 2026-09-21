import type { ReactNode } from "react";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "only light",
};

export default function WidgetLayout({ children }: { children: ReactNode }) {
  return children;
}
