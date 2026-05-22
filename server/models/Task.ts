import mongoose from 'mongoose';

export interface ITask {
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'inprogress' | 'done';
  assignedTo?: mongoose.Types.ObjectId | string;
  project: mongoose.Types.ObjectId | string;
  createdBy: mongoose.Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TaskSchema = new mongoose.Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['todo', 'inprogress', 'done'], default: 'todo' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const TaskModel = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
