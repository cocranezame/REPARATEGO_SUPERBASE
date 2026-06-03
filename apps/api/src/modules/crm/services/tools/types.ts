import type { ICrmRepository } from "../../domain/ports/crm.repository.js";
import type { MetaSenderService } from "../../infra/services/meta-sender.js";

export type ToolContext = {
  repo: ICrmRepository;
  tenantId: string;
  conversacionId: string;
  leadId: string;
  waCuentaId: string;
  celular: string;
  metaSender: MetaSenderService;
};

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string | undefined;
};

export type ToolDef = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[] | undefined;
  };
  execute: (input: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
};
