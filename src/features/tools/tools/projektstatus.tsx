import type { ToolDefinition, ToolViewProps } from "../tool.types";
import { Progress, Row, SectionTitle, StatBox } from "../ui";

const MILESTONES = [
  { label: "Layout-System", state: "fertig" },
  { label: "Widget-Größen", state: "in Arbeit" },
  { label: "Datenquellen", state: "geplant" },
];

function View({ size }: ToolViewProps) {
  if (size.id === "klein") {
    return (
      <div className="flex h-full flex-col justify-center text-sm">
        <Progress value={63} label="MainHub · 7 offen" />
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col gap-3 text-sm">
      <div>
        <SectionTitle>Aktiv</SectionTitle>
        <div className="mt-0.5 text-base font-medium">MainHub Workspace</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Offen" value="7" />
        <StatBox label="Erledigt" value="12" />
      </div>
      <Progress value={63} />
      {size.id === "gross" && (
        <div className="flex flex-col gap-1">
          <SectionTitle>Meilensteine</SectionTitle>
          <ul className="flex flex-col gap-1">
            {MILESTONES.map((m) => (
              <Row key={m.label} left={m.label} right={m.state} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const projektstatusTool: ToolDefinition = {
  id: "projektstatus",
  titel: "Projektstatus",
  beschreibung: "Fortschritt des aktiven Projekts.",
  sizes: [
    { id: "klein", label: "Klein", w: 16, h: 8 },
    { id: "mittel", label: "Mittel", w: 32, h: 16 },
    { id: "gross", label: "Groß", w: 32, h: 24 },
  ],
  standardSize: "mittel",
  View,
};
