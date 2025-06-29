import express from "express";
import {
  getFacultyDetails,
  getDefaultDeadline,
} from "../controllers/facultyController.js";
import jwtAuthMiddleware from "../middlewares/juwAuthMiddleware.js";

const facultyRouter = express.Router();

facultyRouter.get("/getFacultyDetails/:employeeId", jwtAuthMiddleware, getFacultyDetails);

facultyRouter.get("/getDefaultDeadline", jwtAuthMiddleware, getDefaultDeadline);


export default facultyRouter