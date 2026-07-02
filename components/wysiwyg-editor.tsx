"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, Italic, List, ListOrdered, Quote, Redo, Underline, Undo } from "lucide-react";

export function WysiwygEditor({ name, initialHtml = "", placeholder = "Tulis materi di sini..." }: { name: string; initialHtml?: string; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(initialHtml);

  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    setHtml(editorRef.current?.innerHTML ?? "");
  }

  return (
    <div className="wysiwyg-shell">
      <div className="wysiwyg-toolbar" aria-label="Toolbar editor materi">
        <button type="button" className="editor-tool" onClick={() => exec("bold")} title="Bold"><Bold size={16} /></button>
        <button type="button" className="editor-tool" onClick={() => exec("italic")} title="Italic"><Italic size={16} /></button>
        <button type="button" className="editor-tool" onClick={() => exec("underline")} title="Underline"><Underline size={16} /></button>
        <button type="button" className="editor-tool" onClick={() => exec("formatBlock", "h2")} title="Heading"><Heading2 size={16} /></button>
        <button type="button" className="editor-tool" onClick={() => exec("insertUnorderedList")} title="Bullet"><List size={16} /></button>
        <button type="button" className="editor-tool" onClick={() => exec("insertOrderedList")} title="Numbering"><ListOrdered size={16} /></button>
        <button type="button" className="editor-tool" onClick={() => exec("formatBlock", "blockquote")} title="Quote"><Quote size={16} /></button>
        <button type="button" className="editor-tool" onClick={() => exec("undo")} title="Undo"><Undo size={16} /></button>
        <button type="button" className="editor-tool" onClick={() => exec("redo")} title="Redo"><Redo size={16} /></button>
      </div>
      <div
        ref={editorRef}
        className="wysiwyg-content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => setHtml(editorRef.current?.innerHTML ?? "")}
        dangerouslySetInnerHTML={{ __html: initialHtml || "<p></p>" }}
      />
      <textarea name={name} value={html} readOnly hidden />
    </div>
  );
}
