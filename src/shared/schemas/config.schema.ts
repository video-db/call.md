import { z } from 'zod';

export const WidgetPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const AppConfigSchema = z.object({
  accessToken: z.string().optional(),
  userName: z.string().optional(),
  apiKey: z.string().optional(),
  widgetPosition: WidgetPositionSchema.optional(),
});

export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;

export const RuntimeConfigSchema = z.object({
  apiUrl: z.string().optional(),
  apiPort: z.number().default(51731),
});

export const ServerConfigOutputSchema = z.object({
  apiPort: z.number(),
  backendBaseUrl: z.string().optional(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;
export type ServerConfigOutput = z.infer<typeof ServerConfigOutputSchema>;
