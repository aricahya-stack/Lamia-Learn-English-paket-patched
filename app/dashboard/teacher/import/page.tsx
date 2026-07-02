import { AppShell } from "@/components/app-shell";
import { ImportUploader } from "@/components/import-uploader";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireRole(["TEACHER", "SUPER_ADMIN"]);
  return (
    <AppShell title="Import Materi Excel" subtitle="Upload template Excel berisi materi, sub materi, tujuan pembelajaran, dan bank soal.">
      <ImportUploader />
    </AppShell>
  );
}
