import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["Todo", "In Progress", "Completed"], default: "Todo" },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dueDate: { type: Date }
}, { timestamps: true });

export default mongoose.model("Task", taskSchema);
