import { redirect } from "next/navigation";
import { authenticateUser, setAuthSession } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let user;
  try {
    user = await authenticateUser(email, password);
  } catch (error) {
    console.error("Login error", error);
    redirect("/login?error=server");
  }

  if (!user) redirect("/login?error=invalid");
  await setAuthSession(user);
  redirect("/dashboard");
}
