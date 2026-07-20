import { and, desc, eq, ilike, sql } from "drizzle-orm";
import express from "express";
import { classes, subjects, user } from "../db/schema/index.js";
import { db } from "../db/index.js";

const router = express.Router();

// Get all classes with optional search, subject filter, teacher filter, and pagination
router.get("/", async (req, res) => {
  try {
    const { search, subject, teacher, page = 1, limit = 10 } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    if (!Number.isFinite(parsedPage) || !Number.isFinite(parsedLimit)) {
      return res.status(400).json({ error: "Invalid page or limit." });
    }
    const currentPage = Math.max(1, parsedPage);
    const limitPerPage = Math.min(100, Math.max(1, parsedLimit));

    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    // Search by class name
    if (search) {
      filterConditions.push(ilike(classes.name, `%${search}%`));
    }

    // Filter by subject name
    if (subject) {
      const subjectPattern = `%${String(subject).replace(/[%_]/g, "\\$&")}%`;
      filterConditions.push(ilike(subjects.name, subjectPattern));
    }

    // Filter by teacher name
    if (teacher) {
      const teacherPattern = `%${String(teacher).replace(/[%_]/g, "\\$&")}%`;
      filterConditions.push(ilike(user.name, teacherPattern));
    }

    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    // Get count of filtered classes
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    // Get the actual list of classes
    const classesList = await db
      .select({
        id: classes.id,
        name: classes.name,
        description: classes.description,
        inviteCode: classes.inviteCode,
        bannerUrl: classes.bannerUrl,
        bannerCldPubId: classes.bannerCldPubId,
        capacity: classes.capacity,
        status: classes.status,
        schedules: classes.schedules,
        createdAt: classes.createdAt,
        updatedAt: classes.updatedAt,
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
          description: subjects.description,
        },
        teacher: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        },
      })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(whereClause)
      .orderBy(desc(classes.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: classesList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error(`Get /classes error: ${error}`);
    res.status(500).json({ error: "Failed to get classes." });
  }
});

// Create a class
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      subjectId,
      teacherId,
      capacity,
      status,
      bannerUrl,
      bannerCldPubId,
      schedules,
    } = req.body;

    if (
      !name ||
      !subjectId ||
      !teacherId ||
      !capacity ||
      !status ||
      !bannerUrl ||
      !bannerCldPubId
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Generate random invite code (6 characters alphanumeric uppercase)
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const [newClass] = await db
      .insert(classes)
      .values({
        name,
        description,
        subjectId,
        teacherId,
        capacity,
        status,
        bannerUrl,
        bannerCldPubId,
        inviteCode,
        schedules: schedules || [],
      })
      .returning({ id: classes.id });

    if (!newClass) throw Error;

    res.status(201).json({ data: newClass });
  } catch (error) {
    console.error(`Post /classes error: ${error}`);
    res.status(500).json({ error: "Failed to create class." });
  }
});

export default router;
