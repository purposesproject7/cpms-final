import mongoose from "mongoose";

const deadlineSchema = new mongoose.Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema({
  regNo: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  emailId: {
    type: String,
    required: true,
    unique: true,
  },
  draftReview: {
    component1: { type: Number },
    component2: { type: Number },
    component3: { type: Number },
    locked: { type: Boolean, default: false },
  },
  review0: {
    component1: { type: Number },
    locked: { type: Boolean, default: false },
  },
  review1: {
    component1: { type: Number },
    component2: { type: Number },
    component3: { type: Number },
    locked: { type: Boolean, default: false },
  },
  review2: {
    component1: { type: Number },
    component2: { type: Number },
    component3: { type: Number },
    locked: { type: Boolean, default: false },
  },
  review3: {
    component1: { type: Number },
    component2: { type: Number },
    component3: { type: Number },
    locked: { type: Boolean, default: false },
  },
  pptApproved: {
    approved: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
  },
  attendance: {
    value: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
  },
  deadline: new mongoose.Schema({
    draftReview: { type: deadlineSchema, required: true },
    review0: { type: deadlineSchema, required: true },
    review1: { type: deadlineSchema, required: true },
    review2: { type: deadlineSchema, required: true },
    review3: { type: deadlineSchema, required: true },
    pptApproved: { type: deadlineSchema, required: true },
    attendance: { type: deadlineSchema, required: true },
  }),
});

const Student = mongoose.model("Student", studentSchema);
export default Student;
