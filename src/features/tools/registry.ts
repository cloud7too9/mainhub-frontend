import type { ToolDefinition, ToolSize } from "./tool.types";
import { schnellnotizTool } from "./tools/schnellnotiz";
import { aufgabenTool } from "./tools/aufgaben";
import { projektstatusTool } from "./tools/projektstatus";
import { toolstartTool } from "./tools/toolstart";
import { dateienTool } from "./tools/dateien";
import { letzteInhalteTool } from "./tools/letzteInhalte";

/**
 * Alle verfügbaren Tools. Ein neues Tool wird hier eingetragen; alles
 * Weitere (Titel, Inhalte, angebotene Größen) bestimmt das Tool selbst.
 */
export const TOOLS: readonly ToolDefinition[] = [
  schnellnotizTool,
  aufgabenTool,
  projektstatusTool,
  toolstartTool,
  dateienTool,
  letzteInhalteTool,
];

const BY_ID = new Map(TOOLS.map((t) => [t.id, t]));

export function getTool(id: string): ToolDefinition | undefined {
  return BY_ID.get(id);
}

export function getToolSize(tool: ToolDefinition, sizeId: string): ToolSize | undefined {
  return tool.sizes.find((s) => s.id === sizeId);
}

export function getStandardSize(tool: ToolDefinition): ToolSize {
  return getToolSize(tool, tool.standardSize) ?? tool.sizes[0];
}
