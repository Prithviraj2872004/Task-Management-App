import mongoose from 'mongoose';

export interface IProject {
  title: string;
  description: string;
  admin: mongoose.Types.ObjectId | string;
  members: (mongoose.Types.ObjectId | string)[];
  createdAt?: Date;
}

const ProjectSchema = new mongoose.Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

export const ProjectModel = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
