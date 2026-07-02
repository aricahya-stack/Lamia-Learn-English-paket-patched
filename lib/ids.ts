export function slugifyCode(value: string, fallback = "ITEM") {
  const slug = value
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || fallback;
}

export function generatePackageCode(name: string) {
  return `PKG-${slugifyCode(name, "LAMIA")}`;
}

export function generateMaterialCode(skill: string, level = "BEG") {
  const skillCode = skill.toUpperCase().slice(0, 2);
  const levelCode = level.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "BEG";
  const serial = Math.floor(Date.now() % 1000000).toString().padStart(6, "0");
  return `ENG-${skillCode}-${levelCode}-${serial}`;
}

export function generateQuizCode(skill: string) {
  const skillCode = skill.toUpperCase().slice(0, 2);
  const serial = Math.floor(Date.now() % 1000000).toString().padStart(6, "0");
  return `QZ-${skillCode}-${serial}`;
}
