import type { ToolDefinition, ToolViewProps } from "../tool.types";
import { Row, SectionTitle } from "../ui";

const RECENT = [
  { label: "Notiz – Roadmap", time: "vor 2 Min.", day: "Heute" },
  { label: "Aufgabe – Grid finalisieren", time: "vor 15 Min.", day: "Heute" },
  { label: "Datei – plan.md", time: "vor 1 Std.", day: "Heute" },
  { label: "Layer – Arbeit", time: "18:40", day: "Gestern" },
  { label: "Notiz – Docker", time: "16:05", day: "Gestern" },
  { label: "Datei – architecture.pdf", time: "09:12", day: "Gestern" },
];

function View({ size }: ToolViewProps) {
  if (size.id === "klein") {
    const r = RECENT[0];
    return (
      <div className="flex h-full flex-col justify-center gap-0.5 text-sm">
        <div className="text-xs text-text-muted">Zuletzt · {r.time}</div>
        <div className="truncate font-medium">{r.label}</div>
      </div>
    );
  }
  if (size.id === "mittel") {
    return (
      <ul className="flex flex-col gap-1 text-sm">
        {RECENT.slice(0, 3).map((r) => (
          <Row key={r.label} left={r.label} right={r.time} />
        ))}
      </ul>
    );
  }
  const days = [...new Set(RECENT.map((r) => r.day))];
  return (
    <div className="flex flex-col gap-2 text-sm">
      {days.map((day) => (
        <div key={day} className="flex flex-col gap-1">
          <SectionTitle>{day}</SectionTitle>
          <ul className="flex flex-col gap-1">
            {RECENT.filter((r) => r.day === day).map((r) => (
              <Row key={r.label} left={r.label} right={r.time} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export const letzteInhalteTool: ToolDefinition = {
  id: "letzteInhalte",
  titel: "Letzte Inhalte",
  beschreibung: "Was du zuletzt bearbeitet hast.",
  sizes: [
    { id: "klein", label: "Klein", w: 16, h: 8 },
    { id: "mittel", label: "Mittel", w: 32, h: 16 },
    { id: "gross", label: "Groß", w: 48, h: 24 },
  ],
  standardSize: "mittel",
  View,
};
