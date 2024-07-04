import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify, decode } from "hono/jwt";

// You need to define the Hono router like this to enable the usage of ENV variables within the app
const blog = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

// Middleware for Authentication
blog.use("/*", async (c, next) => {
  const header = c.req.header("Authorization") || "";
  const token = header.split(" ")[1];
  // console.log("Token: ", token);
  const response = await verify(token, c.env.JWT_SECRET);
  // console.log("\nResponse: ", response);

  if (!response) {
    c.status(403);
    return c.json({
      message: "Authentication failed",
    });
  } else {
    c.set("userId", response.id as unknown as string);
    await next();
  }
});

// Route handler to create a new blog
blog.post("/", async (c) => {
  const authorId = c.get("userId");

  // Extracting the body of the request
  const requestBody = await c.req.json();

  // Initializing the Prisma Client
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const newBlog = await prisma.post.create({
    data: {
      title: requestBody.title,
      content: requestBody.content,
      authorId: authorId,
    },
  });

  return c.json({
    message: "Blog created",
    id: newBlog.id,
  });
});

// Route handler to update a blog
blog.put("/", async (c) => {
  // Extracting the body of the request
  const requestBody = await c.req.json();

  // Initializing the Prisma Client
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const updatedBlog = await prisma.post.update({
    where: {
      id: requestBody.id,
    },
    data: {
      title: requestBody.title,
      content: requestBody.content,
      published: requestBody.published,
    },
  });

  return c.json({
    message: "Blog updated",
    id: updatedBlog.id,
  });
});

// Route handler to get all blogs
blog.get("/bulk", async (c) => {
  // Initializing the Prisma Client
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blogs = await prisma.post.findMany();
    console.log(blogs);

    c.status(200);
    // @ts-ignore
    return c.json({
      blogs,
    });
  } catch (e) {
    return c.json({
      message: "Error occurred",
      error: e,
    });
  }
});

// Route handler to find a given blog with it's ID
blog.get("/:id", async (c) => {
  // Initializing the Prisma Client
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const id = c.req.param("id");

  try {
    const blog = await prisma.post.findUnique({
      where: {
        id: id,
      },
    });

    c.status(200);
    return c.json({
      blog,
    });
  } catch (e) {
    return c.json({
      message: "Error occurred",
      error: e,
    });
  }
});

export default blog;
