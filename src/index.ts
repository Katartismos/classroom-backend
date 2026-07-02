import express from "express";
import cors from "cors";
import subjectsRouter from "./routes/subjects";

const app = express();
const PORT = 8000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "PUT", "POST", "DELETE"],
    credentials: true,
  }),
);

app.use("/api/subjects", subjectsRouter);

// Root GET route
app.get("/", (req, res) => {
  res.send("Welcome to the Classroom API!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
