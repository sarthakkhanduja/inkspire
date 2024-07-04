import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";

// You need to define the Hono router like this to enable the usage of ENV variables within the app
const user = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

// Function to hash the password with a manual salt
async function hashPassword(
  password: string,
  salt: Uint8Array
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

user.post("/signup", async (c) => {
  // Extracting the body of the request
  const requestBody = await c.req.json();

  // Initializing the Prisma Client
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const { email, name, password } = requestBody;

    // Since we now have all the credentials, let's check if a user by this email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    // Based on whether the existing user is present in the DB, we either sign the people up, or throw an error
    if (!existingUser) {
      // Generating a random salt to hash the password
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltHex = Array.from(salt)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Hashing the password
      const hashedPassword = await hashPassword(password, salt);
      // Since there's no existing user with this email, sign this user up
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      console.log(newUser);

      //Creating a JWT for the new user
      const token = await sign({ id: newUser.id }, c.env.JWT_SECRET);

      return c.json({
        message: "User has been signed up",
        email: email,
        jwt: token,
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

user.post("/signin", async (c) => {
  // Extracting the body of the request
  const requestBody = await c.req.json();

  // Initializing the Prisma Client
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const { email, password } = requestBody;
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      c.status(403);
      return c.json({
        message: "User doesn't exist in the DB",
      });
    }

    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
    c.status(200);
    return c.json({
      message: "Signed in",
      jwt: jwt,
    });
  } catch (e) {
    c.status(400);
    return c.json({
      message: "Some error occurred",
      error: e,
    });
  }
});

export default user;
