import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["Active", "Completed"], default: "Active" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: String, trim: true }],
  dueDate: { type: Date }
}, { timestamps: true });

export default mongoose.model("Project", projectSchema);
