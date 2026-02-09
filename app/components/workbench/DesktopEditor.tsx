// app/components/workbench/DesktopEditor.tsx
import React, { useState, useEffect } from 'react';
import { classNames } from '~/utils/classNames';

interface DesktopEditorProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  language?: string; // e.g., 'javascript', 'typescript', 'rust', 'csharp'
  readOnly?: boolean;
  className?: string;
}

export const DesktopEditor: React.FC<DesktopEditorProps> = ({
  code,
  onCodeChange,
  language = 'javascript',
  readOnly = false,
  className,
}) => {
  const [currentCode, setCurrentCode] = useState(code);

  useEffect(() => {
    setCurrentCode(code);
  }, [code]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentCode(event.target.value);
    onCodeChange(event.target.value);
  };

  // In a real application, this would integrate with a proper code editor like CodeMirror or Monaco.
  // For now, a simple textarea will serve as a placeholder.
  return (
    <div className={classNames('w-full h-full flex flex-col', className)}>
      <div className="flex-none bg-gray-700 text-white text-xs px-3 py-1 rounded-t-lg">
        {language.toUpperCase()} Editor {readOnly && '(Read-Only)'}
      </div>
      <textarea
        className="flex-grow p-2 font-mono text-sm bg-gray-800 text-gray-200 border border-gray-700 rounded-b-lg resize-none focus:outline-none focus:border-blue-500"
        value={currentCode}
        onChange={handleChange}
        readOnly={readOnly}
        spellCheck="false"
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  );
};
