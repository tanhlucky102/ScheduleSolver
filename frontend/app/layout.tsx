import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = { title: "ScheduleSolver", description: "Điều phối và xếp thời khóa biểu khoa" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
