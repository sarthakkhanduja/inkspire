import { Hono } from "hono";

const user = new Hono();

user.post("/signup", (c) => {
  return c.text("User SignUp!");
});

user.post("/signin", (c) => {
  return c.text("User SignIn!");
});

export default user;
