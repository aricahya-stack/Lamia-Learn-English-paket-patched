import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter."),
  email: z.string().trim().email("Format email tidak valid.").transform((value: string) => value.toLowerCase()),
  password: z.string().min(8, "Password minimal 8 karakter."),
  role: z.enum(["SUPER_ADMIN", "TEACHER", "STUDENT"])
});

export async function POST(request: Request) {
  await requireRole(["SUPER_ADMIN"]);

  const json = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message || "Data user tidak valid." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ ok: false, message: "Email sudah terdaftar." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  return NextResponse.json({ ok: true, user });
}
