import { redirect } from "next/navigation";
import { clearAuthSession } from "@/lib/auth";

export async function POST() {
  await clearAuthSession();
  redirect("/login");
}
