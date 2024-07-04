import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// You need to define the Hono router like this to enable the usage of ENV variables within the app
const user = new Hono<{
  Bindings: {
    DATABASE_URL: string;
  };
}>();

user.post("/signup", async (c) => {
  // Initializing the Prisma Client
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  // Extracting the body of the request
  const requestBody = await c.req.json();

  try {
    const email = requestBody.email;
    const name = requestBody.name;
    const password = requestBody.password;
    // Here, we're trying to encode the password without letting it enter the backend for extra security
    // const encodedPassword = new TextEncoder().encode(requestBody.password);
    // const hashedPassword = await crypto.subtle.digest(
    //   {
    //     name: "SHA-256",
    //   },
    //   encodedPassword
    // );

    // Since we now have all the credentials
    // Let's check if a user by this email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    // Based on whether the existing user is present in the DB, we either sign the people up, or throw an error
    if (!existingUser) {
      // Since there's no existing user with this email, sign this user up
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          password,
        },
      });

      console.log(newUser);
      return c.json({
        message: "User has been signed up",
        email: email,
      });
    } else {
      console.log(existingUser);
      return c.json({
        message: "User already exists",
        email: email,
      });
    }
  } catch (e) {
    return c.json({
      message: e,
    });
  }
});

user.post("/signin", (c) => {
  return c.text("User SignIn!");
});

export default user;
