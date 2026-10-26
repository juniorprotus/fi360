import mongoose, { Schema, Types } from "mongoose";

export interface IAuthSession {
  jti: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  revokedAt?: Date;
}

const AuthSessionSchema = new Schema<IAuthSession>(
  {
    jti: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { versionKey: false }
);

AuthSessionSchema.index({ jti: 1 }, { unique: true, name: "auth_session_jti_unique" });
AuthSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "auth_session_expiry_ttl" }
);

export const AuthSession: mongoose.Model<IAuthSession> = mongoose.models.AuthSession
  ? mongoose.model<IAuthSession>("AuthSession")
  : mongoose.model<IAuthSession>("AuthSession", AuthSessionSchema);
