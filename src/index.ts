import AgentAPI from "apminsight";
AgentAPI.config();

import express from "express";
import cors from "cors";

import subjectsRouter from "./routes/subjects.js";
import classesRouter from "./routes/classes.js";
import usersRouter from "./routes/users.js";
import securityMiddleware from "./middleware/security.js";

import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL)
  throw new Error("FRONTEND_URL is not defined in environment variables");

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "PUT", "POST", "DELETE"],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use(securityMiddleware);

app.use("/api/subjects", subjectsRouter);
app.use("/api/classes", classesRouter);
app.use("/api/users", usersRouter);

// Root GET route
app.get("/", (req, res) => {
  res.send("Welcome to the Classroom API!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
