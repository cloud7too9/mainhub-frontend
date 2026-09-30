import type { ToolDefinition, ToolViewProps } from "../tool.types";
import { SectionTitle } from "../ui";

const TASKS = [
  { id: 1, text: "Layout-System finalisieren", done: false },
  { id: 2, text: "Widget-Größen einführen", done: false },
  { id: 3, text: "Datenquellen anbinden", done: false },
  { id: 4, text: "Review-Feedback einarbeiten", done: true },
  { id: 5, text: "Docker-Setup testen", done: true },
];

function Task({ text, done }: { text: string; done: boolean }) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5">
      <span
        className={
          "inline-block h-3 w-3 shrink-0 rounded-sm border " +
          (done ? "border-accent bg-accent" : "border-border-strong")
        }
      />
      <span className={["truncate", done ? "text-text-muted line-through" : "text-text"].join(" ")}>
        {text}
      </span>
    </li>
  );
}

function View({ size }: ToolViewProps) {
  const open = TASKS.filter((t) => !t.done);
  const done = TASKS.filter((t) => t.done);

  if (size.id === "klein") {
    return (
      <div className="flex h-full items-center gap-3 text-sm">
        <div className="text-2xl font-semibold">{open.length}</div>
        <div className="min-w-0">
          <div className="text-xs text-text-muted">offen · als Nächstes</div>
          <div className="truncate">{open[0]?.text ?? "Nichts zu tun"}</div>
        </div>
      </div>
    );
  }

  if (size.id === "mittel") {
    return (
      <ul className="flex flex-col gap-1.5 text-sm">
        {[...open.slice(0, 2), done[0]].filter(Boolean).map((t) => (
          <Task key={t.id} text={t.text} done={t.done} />
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="rounded-md border border-border bg-surface px-2 py-1.5 text-text-muted">
        Neue Aufgabe …
      </div>
      <SectionTitle>Offen · {open.length}</SectionTitle>
      <ul className="flex flex-col gap-1.5">
        {open.map((t) => (
          <Task key={t.id} text={t.text} done={false} />
        ))}
      </ul>
      <SectionTitle>Erledigt · {done.length}</SectionTitle>
      <ul className="flex flex-col gap-1.5">
        {done.map((t) => (
          <Task key={t.id} text={t.text} done />
        ))}
      </ul>
    </div>
  );
}

export const aufgabenTool: ToolDefinition = {
  id: "aufgaben",
  titel: "Aufgaben",
  beschreibung: "Offene und erledigte Aufgaben.",
  sizes: [
    { id: "klein", label: "Klein", w: 16, h: 8 },
    { id: "mittel", label: "Mittel", w: 24, h: 16 },
    { id: "gross", label: "Groß", w: 32, h: 24 },
  ],
  standardSize: "mittel",
  View,
};
