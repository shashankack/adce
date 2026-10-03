import z from "zod";

export const configSchema = z.object({
  version: z.literal(1),
  ignore: z.array(z.string()).default([]),
  scan: z
    .object({
      followSymlinks: z.boolean().default(false),
    })
    .default({
      followSymlinks: false,
    }),
  /**
   * Opt-in analytics sync to the ML server.
   * When enabled (+ ADCE_ML_URL), the CLI auto-pushes after context / analyze /
   * conflict feedback. Manual: `adce analytics push`. Default off.
   */
  analytics: z
    .object({
      enabled: z.boolean().default(false),
    })
    .default({
      enabled: false,
    }),
});

export type AdceConfig = z.infer<typeof configSchema>;
