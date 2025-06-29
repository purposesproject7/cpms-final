import express from "express";
import { checkRequestStatus, requestAdmin } from "../controllers/studentController.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import jwtAuthMiddleware from "../middlewares/juwAuthMiddleware.js";

const studentRouter = express.Router();

// request to unlock the students grade
studentRouter.post("/:facultyType/requestAdmin", jwtAuthMiddleware, requestAdmin);
studentRouter.get("/:facultyType/checkRequestStatus", checkRequestStatus);


export default studentRouter;
