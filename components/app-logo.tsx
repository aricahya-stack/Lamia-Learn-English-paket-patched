import { BookOpenCheck } from "lucide-react";

export function AppLogo() {
  return (
    <div className="app-logo" aria-label="Lamia Learn English">
      <span><BookOpenCheck size={25} /></span>
      <div>
        <strong>Lamia Learn English</strong>
        <small>Kids English Platform</small>
      </div>
    </div>
  );
}
