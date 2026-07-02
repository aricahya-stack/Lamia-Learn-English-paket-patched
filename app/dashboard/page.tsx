import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardRouterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "SUPER_ADMIN") redirect("/dashboard/admin");
  if (user.role === "TEACHER") redirect("/dashboard/teacher");
  redirect("/dashboard/student");
}
