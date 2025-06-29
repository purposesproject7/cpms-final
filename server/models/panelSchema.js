import mongoose from "mongoose";

const panelSchema = new mongoose.Schema({
  faculty1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true,
  },
  faculty2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true,
  },
});

const Panel = mongoose.model("Panel", panelSchema);
export default Panel;
