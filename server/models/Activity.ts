import mongoose from 'mongoose';

export interface IActivity {
  text: string;
  project?: mongoose.Types.ObjectId | string;
  task?: mongoose.Types.ObjectId | string;
  user: mongoose.Types.ObjectId | string;
  createdAt?: Date;
}

const ActivitySchema = new mongoose.Schema<IActivity>({
  text: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export const ActivityModel = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
