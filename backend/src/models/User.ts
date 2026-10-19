import {Schema, model, Types} from 'mongoose';
import {Role} from '../types';

export interface IUser {
    _id: Types.ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
}

const userSchema = new Schema<IUser>(
    {
        name:{type: String, required:true, trim: true},
        email:{type: String, required: true, unique: true, lowercase: true, trim: true},
        passwordHash:{type: String, required: true},
        role:{type: String, enum: ['brand', 'creator'], required: true}
    },
    {
        timestamps:true
    }
);

export const User = model<IUser>('User', userSchema);