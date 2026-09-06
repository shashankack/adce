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
});

export type AdceConfig = z.infer<typeof configSchema>;
