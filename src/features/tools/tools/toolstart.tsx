import type { ToolDefinition, ToolViewProps } from "../tool.types";

const TOOLS = ["Chat", "Editor", "Suche", "Analyse"];

function View({ size }: ToolViewProps) {
  // „Leiste“: alle Tools nebeneinander; „Raster“: 2 × 2.
  const cols = size.id === "leiste" ? "grid-cols-4" : "grid-cols-2";
  return (
    <div className={`grid h-full ${cols} content-start gap-2 text-sm`}>
      {TOOLS.map((t) => (
        <button
          key={t}
          type="button"
          className="truncate rounded-md border border-border bg-surface px-2 py-2 text-left hover:border-border-strong hover:bg-surface-raised"
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/** Beispiel für ein Tool mit nur zwei Größen und unterschiedlicher Form. */
export const toolstartTool: ToolDefinition = {
  id: "toolstart",
  titel: "Tool-Start",
  beschreibung: "Schnellstart für häufig genutzte Tools.",
  sizes: [
    { id: "leiste", label: "Leiste", w: 32, h: 8 },
    { id: "raster", label: "Raster", w: 16, h: 16 },
  ],
  standardSize: "raster",
  View,
};
