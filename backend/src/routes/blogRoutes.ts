import { Hono } from "hono";

const blog = new Hono();

blog.get("/", (c) => {
  return c.text("GET in Blog");
});

blog.get("/bulk", (c) => {
  return c.text("BULK in Blog");
});

export default blog;
