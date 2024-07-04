import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// You need to define the Hono router like this to enable the usage of ENV variables within the app
const blog = new Hono<{
  Bindings: {
    DATABASE_URL: string;
  };
}>();

blog.get("/:id", (c) => {
  // Initializing the Prisma Client
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const id = c.req.param("id");
  return c.text(`GET ${id} in Blog`);
});

blog.get("/bulk", (c) => {
  return c.text("BULK in Blog");
});

export default blog;
