"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  TextQuote,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ToolbarButtonProps {
  editor: Editor;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({
  editor,
  onClick,
  active = false,
  disabled = false,
  title,
  label,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition-all ${active
        ? "border-(--color-brand-primary) bg-(--color-brand-primary) text-white shadow-sm"
        : "border-transparent bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
        } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-gray-50/80 p-1">
      {children}
    </div>
  );
}

function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50/80 px-3 py-3">
      <ToolbarGroup>
        <ToolbarButton
          editor={editor}
          title="Bold"
          label="Bold"
          active={editor.isActive("bold")}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarButton>

        <ToolbarButton
          editor={editor}
          title="Italic"
          label="Italic"
          active={editor.isActive("italic")}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarButton>

        <ToolbarButton
          editor={editor}
          title="Strikethrough"
          label="Strikethrough"
          active={editor.isActive("strike")}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          editor={editor}
          title="Heading 1"
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 size={16} />
        </ToolbarButton>

        <ToolbarButton
          editor={editor}
          title="Heading 2"
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={16} />
        </ToolbarButton>

        <ToolbarButton
          editor={editor}
          title="Heading 3"
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 size={16} />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          editor={editor}
          title="Bullet List"
          label="Bullet List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarButton>

        <ToolbarButton
          editor={editor}
          title="Ordered List"
          label="Ordered List"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarButton>

        <ToolbarButton
          editor={editor}
          title="Blockquote"
          label="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <TextQuote size={16} />
        </ToolbarButton>
      </ToolbarGroup>
    </div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write a clear product description, tasting notes, ingredients, or brewing guidance…",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-gray-400 before:pointer-events-none before:absolute before:top-4 before:left-4 before:text-sm",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "tiptap prose prose-sm sm:prose-base max-w-none min-h-[220px] px-4 py-4 focus:outline-none text-gray-800 relative",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-(--color-brand-primary) focus-within:ring-4 focus-within:ring-(--color-brand-primary)/10">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Rich text editor
          </p>
          <p className="text-xs text-gray-500">
            Use headings, lists, and emphasis to structure product content.
          </p>
        </div>

        <div className="hidden text-xs text-gray-400 sm:block">
          Formatting toolbar
        </div>
      </div>

      <MenuBar editor={editor} />

      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-2 text-xs text-gray-500">
        Tip: Keep descriptions concise and scannable for admins and storefront content.
      </div>
    </div>
  );
}