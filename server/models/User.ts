import mongoose from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'member';
  avatar?: string;
  createdAt?: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
