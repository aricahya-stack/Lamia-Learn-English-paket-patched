import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const formData = await request.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "materials").replace(/[^a-zA-Z0-9/_-]/g, "-");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN belum diatur di environment." }, { status: 500 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const blob = await put(`${folder}/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: true
  });

  return NextResponse.json(blob);
}
