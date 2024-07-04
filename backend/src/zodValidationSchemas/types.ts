import { z } from "zod";

const signUpSchema = z
  .object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
  })
  .strict();

// The strict() method ensures that no other field is present in the object apart from the mentioned ones
