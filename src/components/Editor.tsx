"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

interface EditorProps {
  data: string;
  onChange: (data: string) => void;
  disabled?: boolean;
}

export default function Editor({ data, onChange, disabled }: EditorProps) {
  return (
    <div className="ck-custom-editor">
      <CKEditor
        editor={ClassicEditor}
        data={data}
        disabled={disabled}
        config={{
          placeholder: "Expliquez l'objectif du projet...",
          toolbar: [
            'heading', '|',
            'bold', 'italic', 'link',
            'bulletedList', 'numberedList', '|',
            'undo', 'redo'
          ],
        }}
        onChange={(_, editor) => {
          const content = editor.getData();
          onChange(content);
        }}
      />
      <style jsx global>{`
        .ck-editor__editable_inline {
          min-height: 200px;
        }
      `}</style>
    </div>
  );
}
