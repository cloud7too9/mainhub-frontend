import type { ToolDefinition, ToolViewProps } from "../tool.types";
import { Row, SectionTitle } from "../ui";

const NOTES = [
  { text: "Idee: Layer per Wischgeste wechseln", time: "vor 5 Min." },
  { text: "Docker-Widget braucht Backend", time: "gestern" },
  { text: "Größen pro Tool festlegen", time: "Mo." },
];

function View({ size }: ToolViewProps) {
  if (size.id === "klein") {
    return (
      <div className="flex h-full items-center rounded-md border border-border bg-surface px-3 text-sm text-text-muted">
        Notiz schreiben …
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col gap-2 text-sm">
      <p className="text-text-muted">Kurze Gedanken, sofort festhalten.</p>
      <div className="min-h-[3rem] flex-1 rounded-md border border-border bg-surface px-3 py-2 text-text-muted">
        Noch keine Notizen. Klicke hier, um eine anzulegen.
      </div>
      {size.id === "gross" && (
        <div className="flex flex-col gap-1">
          <SectionTitle>Letzte Notizen</SectionTitle>
          <ul className="flex flex-col gap-1">
            {NOTES.map((n) => (
              <Row key={n.text} left={n.text} right={n.time} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const schnellnotizTool: ToolDefinition = {
  id: "schnellnotiz",
  titel: "Schnellnotiz",
  beschreibung: "Gedanken sofort festhalten.",
  sizes: [
    { id: "klein", label: "Klein", w: 16, h: 8 },
    { id: "mittel", label: "Mittel", w: 24, h: 16 },
    { id: "gross", label: "Groß", w: 32, h: 24 },
  ],
  standardSize: "mittel",
  View,
};
