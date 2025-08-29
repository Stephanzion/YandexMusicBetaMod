import { Editor } from "@monaco-editor/react";
import { useTheme } from "@ui/contexts/ThemeContext";

export function CodeEditor(props: any) {
  const { theme } = useTheme();

  return (
    <Editor
      height="400px"
      theme={theme === "dark" ? "vs-dark" : "vs"}
      defaultLanguage="text"
      defaultValue="{}"
      options={{
        wordWrap: "on",
        stickyScroll: {
          enabled: false,
        },
        minimap: {
          enabled: false,
        },
        scrollbar: {
          useShadows: false,
        },
      }}
      className="border-border overflow-hidden rounded-sm"
      {...props}
    />
  );
}

export default CodeEditor;
