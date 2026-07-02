import * as XLSX from "xlsx";
import { z } from "zod";

const materialSchema = z.object({
  temp_material_id: z.string().min(1),
  package: z.string().min(1, "Kolom Paket wajib diisi."),
  material_code: z.string().optional(),
  title: z.string().min(1),
  skill: z.enum(["READING", "LISTENING", "GRAMMAR"]),
  level: z.string().min(1),
  theme: z.string().min(1),
  description: z.string().optional(),
  instruction: z.string().optional(),
  content_text: z.string().optional(),
  content_html: z.string().optional(),
  image_file_or_url: z.string().optional(),
  audio_file_or_url: z.string().optional(),
  default_voice_type: z.string().optional(),
  default_language: z.string().optional(),
  default_speech_rate: z.coerce.number().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
});

const questionSchema = z.object({
  temp_material_id: z.string().min(1),
  quiz_title: z.string().min(1),
  question_no: z.coerce.number().int().positive(),
  question_type: z.enum([
    "MULTIPLE_CHOICE",
    "MATCHING",
    "SHORT_ANSWER",
    "TRUE_FALSE",
    "FILL_BLANK",
    "WORD_ARRANGEMENT",
    "SENTENCE_ARRANGEMENT",
    "LISTEN_AND_CHOOSE",
    "LISTEN_AND_TYPE",
    "PICTURE_CHOICE",
    "AUDIO_MATCHING",
    "ODD_ONE_OUT",
    "LABEL_PICTURE",
    "PRONUNCIATION_CHECK",
    "LISTEN_AND_REPEAT",
    "READ_ALOUD",
    "SPEAKING_PROMPT"
  ]),
  question_text: z.string().optional(),
  question_html: z.string().optional(),
  question_image_file_or_url: z.string().optional(),
  question_audio_file_or_url: z.string().optional(),
  correct_answer: z.string().optional(),
  target_text: z.string().optional(),
  sample_text: z.string().optional(),
  pronunciation_mode: z.preprocess((value: unknown) => value === "" ? undefined : value, z.enum(["WORD", "PHRASE", "SENTENCE", "PARAGRAPH"]).optional()),
  min_score: z.coerce.number().int().min(0).max(100).optional(),
  allow_retry: z.union([z.boolean(), z.string()]).optional(),
  max_attempts: z.coerce.number().int().min(0).optional(),
  use_browser_tts: z.union([z.boolean(), z.string()]).optional(),
  save_recording: z.union([z.boolean(), z.string()]).optional(),
  score: z.coerce.number().int().positive().default(10),
  explanation: z.string().optional()
});

export type ImportValidationIssue = {
  sheet: string;
  row: number;
  level: "ERROR" | "WARNING";
  message: string;
};

export type ParsedImport = {
  valid: boolean;
  summary: {
    materials: number;
    subMaterials: number;
    objectives: number;
    questions: number;
    options: number;
    matchingPairs: number;
  };
  issues: ImportValidationIssue[];
  data: Record<string, unknown[]>;
};

function rows(workbook: XLSX.WorkBook, sheetName: string) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

function clean(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key).trim(), typeof value === "string" ? value.trim() : value]));
}

function addZodIssues(issues: ImportValidationIssue[], sheet: string, row: number, error: z.ZodError) {
  for (const issue of error.issues) {
    issues.push({ sheet, row, level: "ERROR", message: `${issue.path.join(".")}: ${issue.message}` });
  }
}

export function parseImportWorkbook(buffer: Buffer): ParsedImport {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const issues: ImportValidationIssue[] = [];

  const rawMaterials = rows(workbook, "Materials").map(clean);
  const rawSubMaterials = rows(workbook, "SubMaterials").map(clean);
  const rawObjectives = rows(workbook, "Objectives").map(clean);
  const rawQuestions = rows(workbook, "Questions").map(clean);
  const rawOptions = rows(workbook, "Options").map(clean);
  const rawMatchingPairs = rows(workbook, "MatchingPairs").map(clean);

  const materialIds = new Set<string>();
  rawMaterials.forEach((row, index) => {
    const parsed = materialSchema.safeParse(row);
    if (!parsed.success) {
      addZodIssues(issues, "Materials", index + 2, parsed.error);
      return;
    }
    if (materialIds.has(parsed.data.temp_material_id)) {
      issues.push({ sheet: "Materials", row: index + 2, level: "ERROR", message: "temp_material_id duplikat." });
    }
    materialIds.add(parsed.data.temp_material_id);
  });

  rawQuestions.forEach((row, index) => {
    const parsed = questionSchema.safeParse(row);
    if (!parsed.success) {
      addZodIssues(issues, "Questions", index + 2, parsed.error);
      return;
    }
    if (!materialIds.has(parsed.data.temp_material_id)) {
      issues.push({ sheet: "Questions", row: index + 2, level: "ERROR", message: "temp_material_id tidak ditemukan di sheet Materials." });
    }
    if (["MULTIPLE_CHOICE", "LISTEN_AND_CHOOSE", "PICTURE_CHOICE", "ODD_ONE_OUT", "TRUE_FALSE", "FILL_BLANK"].includes(parsed.data.question_type) && !parsed.data.correct_answer) {
      issues.push({ sheet: "Questions", row: index + 2, level: "ERROR", message: "correct_answer wajib untuk tipe soal pilihan/isian otomatis." });
    }
    if (["PRONUNCIATION_CHECK", "LISTEN_AND_REPEAT", "READ_ALOUD", "SPEAKING_PROMPT"].includes(parsed.data.question_type) && !parsed.data.target_text) {
      issues.push({ sheet: "Questions", row: index + 2, level: "ERROR", message: "target_text wajib untuk tipe soal speaking." });
    }
    if (["PRONUNCIATION_CHECK", "LISTEN_AND_REPEAT", "READ_ALOUD", "SPEAKING_PROMPT"].includes(parsed.data.question_type) && !parsed.data.min_score) {
      issues.push({ sheet: "Questions", row: index + 2, level: "WARNING", message: "min_score kosong; sistem akan memakai default 70." });
    }
  });

  for (const [index, row] of rawSubMaterials.entries()) {
    if (!materialIds.has(String(row.temp_material_id))) {
      issues.push({ sheet: "SubMaterials", row: index + 2, level: "ERROR", message: "temp_material_id tidak ditemukan di sheet Materials." });
    }
  }

  for (const [index, row] of rawObjectives.entries()) {
    if (!materialIds.has(String(row.temp_material_id))) {
      issues.push({ sheet: "Objectives", row: index + 2, level: "ERROR", message: "temp_material_id tidak ditemukan di sheet Materials." });
    }
  }

  const questionKeys = new Set(rawQuestions.map((row) => `${row.temp_material_id}::${row.question_no}`));
  for (const [index, row] of rawOptions.entries()) {
    const key = `${row.temp_material_id}::${row.question_no}`;
    if (!questionKeys.has(key)) {
      issues.push({ sheet: "Options", row: index + 2, level: "ERROR", message: "question_no tidak ditemukan pada sheet Questions." });
    }
  }

  for (const [index, row] of rawMatchingPairs.entries()) {
    const key = `${row.temp_material_id}::${row.question_no}`;
    if (!questionKeys.has(key)) {
      issues.push({ sheet: "MatchingPairs", row: index + 2, level: "ERROR", message: "question_no tidak ditemukan pada sheet Questions." });
    }
  }

  return {
    valid: !issues.some((issue) => issue.level === "ERROR"),
    summary: {
      materials: rawMaterials.length,
      subMaterials: rawSubMaterials.length,
      objectives: rawObjectives.length,
      questions: rawQuestions.length,
      options: rawOptions.length,
      matchingPairs: rawMatchingPairs.length
    },
    issues,
    data: {
      materials: rawMaterials,
      subMaterials: rawSubMaterials,
      objectives: rawObjectives,
      questions: rawQuestions,
      options: rawOptions,
      matchingPairs: rawMatchingPairs
    }
  };
}
