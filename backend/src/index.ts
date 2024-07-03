import { Hono } from "hono";
import userRoutes from "./routes/userRoutes";
import blogRoutes from "./routes/blogRoutes";

const app = new Hono().basePath("/api/v1");

app.route("/user", userRoutes);
app.route("/blog", blogRoutes);

export default app;
