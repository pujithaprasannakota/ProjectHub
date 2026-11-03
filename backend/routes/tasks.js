import { Router } from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

router.get("/", async (req, res) => {
  const filter = { owner: req.userId };
  if (req.query.projectId && mongoose.isValidObjectId(req.query.projectId))
    filter.project = req.query.projectId;
  const tasks = await Task.find(filter).populate("project", "title").sort({ createdAt: -1 });
  res.json(tasks);
});

router.post("/", async (req, res) => {
  try {
    const { title, description, project, priority, dueDate } = req.body;
    if (!title?.trim() || !project) return res.status(400).json({ message: "Task title and project are required." });
    const parent = await Project.findOne({ _id: project, owner: req.userId });
    if (!parent) return res.status(404).json({ message: "Project not found." });
    const task = await Task.create({
      title, description, project, priority, dueDate: dueDate || undefined, owner: req.userId
    });
    res.status(201).json(await task.populate("project", "title"));
  } catch {
    res.status(500).json({ message: "Could not create task." });
  }
});

router.patch("/:id", async (req, res) => {
  const allowed = ["title", "description", "status", "priority", "dueDate"];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId }, updates,
    { new: true, runValidators: true }
  ).populate("project", "title");
  if (!task) return res.status(404).json({ message: "Task not found." });
  res.json(task);
});

router.delete("/:id", async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!task) return res.status(404).json({ message: "Task not found." });
  res.json({ message: "Task deleted." });
});

export default router;
