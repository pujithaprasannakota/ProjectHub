import { Router } from "express";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

router.get("/", async (req, res) => {
  const projects = await Project.find({ owner: req.userId }).sort({ createdAt: -1 });
  res.json(projects);
});

router.post("/", async (req, res) => {
  try {
    const { title, description, dueDate, members } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Project title is required." });
    const project = await Project.create({
      title, description, dueDate: dueDate || undefined,
      members: Array.isArray(members) ? members : [], owner: req.userId
    });
    res.status(201).json(project);
  } catch {
    res.status(500).json({ message: "Could not create project." });
  }
});

router.put("/:id", async (req, res) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    { title: req.body.title, description: req.body.description, status: req.body.status, dueDate: req.body.dueDate },
    { new: true, runValidators: true }
  );
  if (!project) return res.status(404).json({ message: "Project not found." });
  res.json(project);
});

router.delete("/:id", async (req, res) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!project) return res.status(404).json({ message: "Project not found." });
  await Task.deleteMany({ project: project._id, owner: req.userId });
  res.json({ message: "Project and its tasks deleted." });
});

export default router;
