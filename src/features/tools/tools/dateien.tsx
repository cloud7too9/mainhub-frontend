import type { ToolDefinition, ToolViewProps } from "../tool.types";
import { Row } from "../ui";

const FILES = [
  { name: "plan.md", type: "Markdown", size: "4,2 KB", date: "heute" },
  { name: "notes.txt", type: "Text", size: "980 B", date: "heute" },
  { name: "architecture.pdf", type: "PDF", size: "1,1 MB", date: "gestern" },
  { name: "roadmap.md", type: "Markdown", size: "3,8 KB", date: "gestern" },
  { name: "logo.svg", type: "Bild", size: "12 KB", date: "Mo." },
  { name: "compose.yaml", type: "YAML", size: "1,3 KB", date: "Mo." },
];

function View({ size }: ToolViewProps) {
  if (size.id === "klein") {
    return (
      <div className="flex h-full flex-col justify-center gap-0.5 text-sm">
        <div className="text-xs text-text-muted">{FILES.length} Dateien · zuletzt</div>
        <div className="truncate font-medium">{FILES[0].name}</div>
      </div>
    );
  }
  if (size.id === "mittel") {
    return (
      <ul className="flex flex-col gap-1 text-sm">
        {FILES.slice(0, 3).map((f) => (
          <Row key={f.name} left={f.name} right={f.size} />
        ))}
      </ul>
    );
  }
  return (
    <table className="w-full border-separate border-spacing-y-1 text-sm">
      <thead className="text-left text-xs text-text-muted">
        <tr>
          <th className="px-2 font-normal">Name</th>
          <th className="px-2 font-normal">Typ</th>
          <th className="px-2 text-right font-normal">Größe</th>
          <th className="px-2 text-right font-normal">Geändert</th>
        </tr>
      </thead>
      <tbody>
        {FILES.map((f) => (
          <tr key={f.name} className="bg-surface">
            <td className="truncate rounded-l-md px-2 py-1.5">{f.name}</td>
            <td className="px-2 py-1.5 text-text-muted">{f.type}</td>
            <td className="px-2 py-1.5 text-right text-xs text-text-muted">{f.size}</td>
            <td className="rounded-r-md px-2 py-1.5 text-right text-xs text-text-muted">{f.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const dateienTool: ToolDefinition = {
  id: "dateien",
  titel: "Dateien",
  beschreibung: "Zuletzt verwendete Dateien.",
  sizes: [
    { id: "klein", label: "Klein", w: 16, h: 8 },
    { id: "mittel", label: "Mittel", w: 32, h: 16 },
    { id: "gross", label: "Groß", w: 32, h: 24 },
  ],
  standardSize: "mittel",
  View,
};
