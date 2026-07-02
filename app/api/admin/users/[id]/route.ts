import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
  password: z.string().min(8).optional().or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "TEACHER", "STUDENT"]).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole(["SUPER_ADMIN"]);
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Data user tidak valid." }, { status: 400 });

  if (parsed.data.email) {
    const duplicate = await prisma.user.findFirst({ where: { email: parsed.data.email, NOT: { id } }, select: { id: true } });
    if (duplicate) return NextResponse.json({ ok: false, message: "Email sudah dipakai user lain." }, { status: 409 });
  }

  const passwordHash = parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : undefined;
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
      ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
      ...(passwordHash ? { passwordHash } : {})
    },
    select: { id: true, name: true, email: true, role: true }
  });

  return NextResponse.json({ ok: true, user });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await requireRole(["SUPER_ADMIN"]);
  const { id } = await params;
  if (current.id === id) return NextResponse.json({ ok: false, message: "Akun yang sedang login tidak boleh dihapus." }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
