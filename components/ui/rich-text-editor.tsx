"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState } from "react";
import { uploadImage } from "@/app/actions/upload";

const rteStyles = `
  .rte-bar { display:flex; flex-wrap:wrap; gap:4px; padding:7px; border:1px solid var(--border-2); border-bottom:0; border-radius:var(--r-sm) var(--r-sm) 0 0; background:var(--surface-2); }
  .rte-btn { min-width:34px; height:32px; padding:0 8px; display:grid; place-items:center; border-radius:7px; border:0; background:transparent; color:var(--muted); cursor:pointer; font:700 13px/1 var(--font-body); }
  .rte-btn:hover { background:var(--surface-3); color:var(--fg); }
  .rte-btn.on { background:var(--accent-soft); color:var(--accent-ink); }
  .rte-btn svg { width:17px; height:17px; }
  .rte-sep { width:1px; background:var(--border); margin:4px 2px; }
  .rte-area { border:1px solid var(--border-2); border-radius:0 0 var(--r-sm) var(--r-sm); background:var(--surface); padding:12px 14px; min-height:200px; }
  .rte-area .ProseMirror { outline:none; min-height:176px; color:var(--fg); font:15px/1.6 var(--font-body); }
  .rte-area .ProseMirror:focus { outline:none; }
  .rte-area .ProseMirror p { margin:0 0 10px; }
  .rte-area .ProseMirror h2 { font-size:1.25rem; margin:14px 0 8px; }
  .rte-area .ProseMirror h3 { font-size:1.08rem; margin:12px 0 6px; }
  .rte-area .ProseMirror ul, .rte-area .ProseMirror ol { padding-left:22px; margin:0 0 10px; display:flex; flex-direction:column; gap:4px; }
  .rte-area .ProseMirror ul { list-style:disc; }
  .rte-area .ProseMirror ol { list-style:decimal; }
  .rte-area .ProseMirror img { max-width:100%; border-radius:var(--r-sm); margin:6px 0; }
  .rte-area .ProseMirror a { color:var(--accent-2); text-decoration:underline; }
  .rte-area .ProseMirror code { font-family:var(--font-mono); background:var(--surface-2); padding:1px 5px; border-radius:4px; font-size:.9em; }
  .rte-area .ProseMirror p.is-editor-empty:first-child::before { content:attr(data-placeholder); color:var(--faint); float:left; height:0; pointer-events:none; }
`;

function Btn({
  on,
  onClick,
  title,
  children,
}: {
  on?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`rte-btn${on ? " on" : ""}`}
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis materi…",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const editor = useEditor({
    immediatelyRender: false, // Next.js App Router (avoid SSR hydration mismatch)
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "rte-input" } },
  });

  if (!editor) {
    return (
      <>
        <style>{rteStyles}</style>
        <div className="rte-area" />
      </>
    );
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadImage(fd);
    setBusy(false);
    if (res.url) editor.chain().focus().setImage({ src: res.url }).run();
    else alert(res.error ?? "Gagal mengunggah gambar");
  }

  function addLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL tautan:", prev ?? "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div>
      <style>{rteStyles}</style>
      <div className="rte-bar">
        <Btn on={editor.isActive("bold")} title="Tebal" onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </Btn>
        <Btn on={editor.isActive("italic")} title="Miring" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span style={{ fontStyle: "italic" }}>I</span>
        </Btn>
        <Btn on={editor.isActive("code")} title="Kode/rumus" onClick={() => editor.chain().focus().toggleCode().run()}>
          <span style={{ fontFamily: "var(--font-mono)" }}>{"<>"}</span>
        </Btn>
        <span className="rte-sep" />
        <Btn on={editor.isActive("heading", { level: 2 })} title="Judul H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Btn>
        <Btn on={editor.isActive("heading", { level: 3 })} title="Judul H3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </Btn>
        <span className="rte-sep" />
        <Btn on={editor.isActive("bulletList")} title="Daftar berbutir" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
        </Btn>
        <Btn on={editor.isActive("orderedList")} title="Daftar bernomor" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4l2-3H4" /></svg>
        </Btn>
        <span className="rte-sep" />
        <Btn on={editor.isActive("link")} title="Tautan" onClick={addLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
        </Btn>
        <Btn title="Sisipkan gambar" onClick={() => fileRef.current?.click()}>
          {busy ? (
            <span style={{ fontSize: 11 }}>…</span>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
          )}
        </Btn>
      </div>
      <div className="rte-area">
        <EditorContent editor={editor} />
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
    </div>
  );
}
