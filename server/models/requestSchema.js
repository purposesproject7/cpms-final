import mongoose from "mongoose";

const requestSchema = mongoose.Schema({
  faculty: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
  ],
  facultyType: {
    type: String,
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  reviewType: {
    type: String,
    
    enum: ["draftReview", "review0", "review1", "review2", "review3"],
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
});


const Request = mongoose.model("Request", requestSchema);
export default Request;
