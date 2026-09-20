/**
 * Lightweight rich text editor (contentEditable + toolbar).
 * Emits raw HTML; callers sanitize before persisting (see shared/sanitize).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';

function ToolbarButton({
  title,
  onAction,
  children,
}: {
  title: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="rte-btn"
      title={title}
      // Keep the selection inside the editor when clicking the toolbar.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onAction}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
    // Seed once per mount; the page remounts the editor per tab via key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const addLink = () => {
    const url = window.prompt('Link URL (https://…)');
    if (url && /^https?:\/\//i.test(url.trim())) exec('createLink', url.trim());
  };

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">
        <ToolbarButton title="Bold" onAction={() => exec('bold')}>
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton title="Italic" onAction={() => exec('italic')}>
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton title="Underline" onAction={() => exec('underline')}>
          <Underline size={15} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" onAction={() => exec('strikeThrough')}>
          <Strikethrough size={15} />
        </ToolbarButton>
        <span className="rte-sep" />
        <ToolbarButton title="Heading 1" onAction={() => exec('formatBlock', 'H2')}>
          <Heading1 size={15} />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" onAction={() => exec('formatBlock', 'H3')}>
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton title="Paragraph" onAction={() => exec('formatBlock', 'P')}>
          <Pilcrow size={15} />
        </ToolbarButton>
        <span className="rte-sep" />
        <ToolbarButton title="Bullet list" onAction={() => exec('insertUnorderedList')}>
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onAction={() => exec('insertOrderedList')}>
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton title="Insert link" onAction={addLink}>
          <Link2 size={15} />
        </ToolbarButton>
        <span className="rte-sep" />
        <ToolbarButton title="Clear formatting" onAction={() => exec('removeFormat')}>
          <RemoveFormatting size={15} />
        </ToolbarButton>
        <ToolbarButton title="Undo" onAction={() => exec('undo')}>
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton title="Redo" onAction={() => exec('redo')}>
          <Redo2 size={15} />
        </ToolbarButton>
      </div>
      <div
        ref={editorRef}
        className="rte-content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder ?? 'Write the policy content…'}
        onInput={() => editorRef.current && onChange(editorRef.current.innerHTML)}
      />
    </div>
  );
}
