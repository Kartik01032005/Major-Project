import { Schema, model } from "mongoose";

const RequestDismissalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  requestId: { type: Schema.Types.ObjectId, ref: "EmergencyRequest", required: true },
  view: { type: String, enum: ["my", "donate"], required: true },
}, { timestamps: true });

RequestDismissalSchema.index({ userId: 1, view: 1, requestId: 1 }, { unique: true });

const RequestDismissal = model("RequestDismissal", RequestDismissalSchema);
export default RequestDismissal;
