import mongoose from "mongoose";
import Faculty from "../models/facultySchema.js";
import bcrypt from "bcryptjs";
import SystemConfig from "../models/systemConfigSchema.js";
import Student from "../models/studentSchema.js";
import Request from "../models/requestSchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";

export async function createFaculty(req, res) {
  const { name, emailId, password, employeeId } = req.body;

  // Only allow college emails
  if (!emailId.endsWith("@vitstudent.ac.in")) {
    return res.status(400).json({ 
      success: false,
      message: "Only college emails allowed!" 
    });
  }

  // Password validation
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    });
  }

  // Check if email is already registered
  const existingFaculty = await Faculty.findOne({ emailId });
  if (existingFaculty) {
    return res.status(400).json({ 
      success: false,
      message: "Faculty already registered!" 
    });
  }

  // Hash password before saving
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create faculty
  const newFaculty = new Faculty({
    name,
    emailId,
    password: hashedPassword,
    employeeId,
    role: "faculty",
  });

  await newFaculty.save();

  return res.status(201).json({
    success: true,
    message: "Faculty created successfully!",
  });
}

export async function getAllFaculty(req, res) {
  const allFaculty = await Faculty.find({});

  if (allFaculty.length === 0) {
    console.log("no faculty found");
    return res.status(404).json({ 
      success: false,
      message: "No Faculty found" 
    });
  }

  return res.status(200).json({ 
    success: true,
    data: allFaculty 
  });
}

export async function getAllGuideWithProjects(req, res) {
  const faculties = await Faculty.find({ role: "faculty" });

  const result = await Promise.all(
    faculties.map(async (faculty) => {
      const guidedProjects = await Project.find({ guideFaculty: faculty._id })
        .populate("students", "regNo name")
        .lean();
      return {
        faculty: {
          _id: faculty._id,
          employeeId: faculty.employeeId,
          name: faculty.name,
          emailId: faculty.emailId,
        },
        guidedProjects,
      };
    })
  );

  res.status(200).json({ success: true, data: result });
}

export async function getAllPanelsWithProjects(req, res) {
  const panels = await Panel.find()
    .populate("faculty1", "employeeId name emailId")
    .populate("faculty2", "employeeId name emailId")
    .lean();

  const result = await Promise.all(
    panels.map(async (panel) => {
      const projects = await Project.find({ panel: panel._id })
        .populate("students", "regNo name")
        .lean();

      return {
        panelId: panel._id,
        faculty1: panel.faculty1,
        faculty2: panel.faculty2,
        projects,
      };
    })
  );

  res.status(200).json({ success: true, data: result });
}

export async function createAdmin(req, res) {
  const { name, emailId, password, employeeId } = req.body;

  if (!emailId.endsWith("@vit.ac.in")) {
    return res.status(400).json({ 
      success: false,
      message: "Only college emails allowed!" 
    });
  }

  // Password validation
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    });
  }

  const existingFaculty = await Faculty.findOne({ emailId });
  if (existingFaculty) {
    return res.status(400).json({ 
      success: false,
      message: "Admin already registered!" 
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newFaculty = new Faculty({
    name,
    emailId,
    password: hashedPassword,
    employeeId,
    role: "admin",
  });

  await newFaculty.save();

  return res.status(201).json({
    success: true,
    message: "Admin created successfully!",
  });
}

export async function getDefaultDeadline(req, res) {
  const config = await SystemConfig.findOne();
  if (!config) {
    return res.status(404).json({ 
      success: false,
      message: "No default deadlines set yet." 
    });
  }
  res.status(200).json({ success: true, data: config });
}

export async function setDefaultDeadline(req, res) {
  const { defaultDeadline } = req.body;

  let config = await SystemConfig.findOne();
  if (!config) {
    config = new SystemConfig(defaultDeadline);
  } else {
    Object.assign(config, defaultDeadline);
  }

  await config.save();

  return res.status(200).json({
    success: true,
    message: "Default Deadlines set successfully",
  });
}

export async function updateRequestStatus(req, res) {
  const { requestId, status, newDeadline } = req.body;
  
  console.log('=== UPDATING REQUEST STATUS ===');
  console.log('Request ID:', requestId);
  console.log('Status:', status);
  console.log('New Deadline:', newDeadline);

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value. Must be 'approved' or 'rejected'.",
    });
  }

  if (status === "approved") {
    if (!newDeadline) {
      return res.status(400).json({ 
        success: false,
        message: "newDeadline is required for approved requests." 
      });
    }
    if (isNaN(new Date(newDeadline).getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid date format for newDeadline." 
      });
    }
  }

  const request = await Request.findById(requestId)
    .populate("student")
    .populate("faculty");

  if (!request) {
    return res.status(404).json({ 
      success: false,
      message: "Request not found!" 
    });
  }

  const student = request.student;
  if (!student) {
    return res.status(404).json({
      success: false,
      message: "No student mapped to the request.",
    });
  }

  const reviewType = request.reviewType;
  console.log('Review Type:', reviewType);
  console.log('Student RegNo:', student.regNo);

  if (status === "approved") {
    request.status = "approved";
    request.resolvedAt = new Date();

    // Unlock the review for the student
    if (student[reviewType]) {
      student[reviewType].locked = false;
    }

    // **KEY FIX: Update the nested deadline structure**
    if (student.deadline && student.deadline[reviewType]) {
      student.deadline[reviewType].to = new Date(newDeadline);
      console.log(`✅ Updated ${reviewType} deadline to ${newDeadline} for student ${student.regNo}`);
    } else {
      // Initialize deadline if it doesn't exist
      const systemConfig = await SystemConfig.findOne();
      if (systemConfig) {
        if (!student.deadline) {
          student.deadline = {};
        }
        student.deadline[reviewType] = {
          from: new Date(),
          to: new Date(newDeadline)
        };
      }
    }
    
    await student.save();

  } else {
    request.status = "rejected";
    request.resolvedAt = new Date();
  }

  await request.save();

  return res.status(200).json({
    success: true,
    message: `Request ${status} successfully.`,
    data: request,
  });
}



export async function getAllRequests(req, res) {
  const { facultyType } = req.params;

  if (!["panel", "guide"].includes(facultyType)) {
    return res.status(400).json({ 
      success: false,
      message: "facultyType should either be 'guide' or 'panel'" 
    });
  }

  const requests = await Request.find({ facultyType })
    .populate("faculty", "name empId")
    .populate("student", "name regNo");

  if (!requests.length) {
    return res.status(404).json({
      success: false,
      message: `No requests found for the ${facultyType}`,
    });
  }

  // Grouping by faculty
  const grouped = {};

  requests.forEach((req) => {
    const faculty = req.faculty[0];
    const facultyId = faculty._id.toString();

    if (!grouped[facultyId]) {
      grouped[facultyId] = {
        _id: facultyId,
        name: faculty.name,
        empId: faculty.empId,
        students: [],
      };
    }

    grouped[facultyId].students.push({
      _id: req._id,
      name: req.student.name,
      regNo: req.student.regNo,
      projectType: req.reviewType,
      comments: req.reason,
      approved:
        req.status === "approved"
          ? true
          : req.status === "rejected"
          ? false
          : null,
    });
  });

  const result = Object.values(grouped);

  return res.status(200).json({
    success: true,
    message: "Operation successful",
    data: result,
  });
}

export async function createPanelManually(req, res) {
  const { faculty1Id, faculty2Id } = req.body;

  if (!faculty1Id || !faculty2Id || faculty1Id === faculty2Id) {
    return res.status(400).json({ 
      success: false,
      message: "Two distinct faculty IDs are required." 
    });
  }

  const panel = new Panel({ faculty1: faculty1Id, faculty2: faculty2Id });
  await panel.save();

  return res.status(201).json({ 
    success: true,
    message: "Panel created successfully", 
    data: panel 
  });
}

export async function deletePanel(req, res) {
  const { panelId } = req.params;

  const deletedPanel = await Panel.findByIdAndDelete(panelId);

  if (!deletedPanel) {
    return res.status(404).json({ 
      success: false,
      message: "No panel found for the provided ID" 
    });
  }

  await Project.updateMany({ panel: panelId }, { $set: { panel: null } });

  return res.status(200).json({
    success: true,
    message: "Panel deleted successfully and removed from associated projects",
    data: deletedPanel,
  });
}

export async function getAllPanels(req, res) {
  const panel = await Panel.find().populate("faculty1").populate("faculty2");
  
  if (!panel || panel.length === 0) {
    return res.status(404).json({ 
      success: false,
      message: "No panels found" 
    });
  }

  return res.status(200).json({
    success: true,
    message: "Operation Successful",
    data: panel,
  });
}

export async function assignExistingPanelToProject(req, res) {
  const { panelId, projectId } = req.body;

  // Handle panel removal
  if (!panelId || panelId === "null") {
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { panel: null },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Panel removed from project successfully",
      data: updatedProject,
    });
  }

  // Assigning a panel
  const panel = await Panel.findById(panelId);
  if (!panel) {
    return res.status(404).json({ 
      success: false,
      message: "Panel not found." 
    });
  }

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { panel: panel._id },
    { new: true }
  ).populate("panel");

  return res.status(200).json({
    success: true,
    message: "Panel assigned successfully",
    data: updatedProject,
  });
}

export async function autoAssignPanelsToProjects(req, res) {
  const unassignedProjects = await Project.find({ panel: null }).populate("guideFaculty");
  const panels = await Panel.find().populate(["faculty1", "faculty2"]);

  if (unassignedProjects.length === 0) {
    return res.status(200).json({ 
      success: true,
      message: "All projects already have panels." 
    });
  }

  if (panels.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: "No panels available." 
    });
  }

  // Build a panel usage map: panelId => project count
  const panelProjectCounts = {};
  for (const panel of panels) {
    const count = await Project.countDocuments({ panel: panel._id });
    panelProjectCounts[panel._id.toString()] = count;
  }

  for (const project of unassignedProjects) {
    const guideId = project.guideFaculty._id.toString();

    // Filter out panels where the guide is one of the members
    const eligiblePanels = panels.filter((panel) => {
      return (
        panel.faculty1._id.toString() !== guideId &&
        panel.faculty2._id.toString() !== guideId
      );
    });

    if (eligiblePanels.length === 0) {
      console.warn(`No eligible panel found for project: ${project.name}`);
      continue;
    }

    // Select the eligible panel with the least number of assigned projects
    const [leastUsedPanelId] = eligiblePanels
      .map((panel) => ({
        panelId: panel._id.toString(),
        count: panelProjectCounts[panel._id.toString()] || 0,
      }))
      .sort((a, b) => a.count - b.count)
      .map((entry) => entry.panelId);

    // Assign panel to project
    project.panel = leastUsedPanelId;
    await project.save();

    // Update count
    panelProjectCounts[leastUsedPanelId]++;
  }

  return res.status(200).json({
    success: true,
    message: "Panels assigned automatically to unassigned projects.",
  });
}

export async function assignPanelToProject(req, res) {
  const { panelFacultyIds, projectId } = req.body;

  if (!Array.isArray(panelFacultyIds) || panelFacultyIds.length !== 2) {
    return res.status(400).json({ 
      success: false,
      message: "Exactly 2 panel faculty IDs required." 
    });
  }

  // Check that both faculty exist and are not the same
  if (panelFacultyIds[0] === panelFacultyIds[1]) {
    return res.status(400).json({
      success: false,
      message: "Panel faculty members must be distinct.",
    });
  }

  const [faculty1, faculty2] = await Promise.all([
    Faculty.findById(panelFacultyIds[0]),
    Faculty.findById(panelFacultyIds[1]),
  ]);
  
  if (!faculty1 || !faculty2) {
    return res.status(404).json({
      success: false,
      message: "One or both faculty not found.",
    });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ 
      success: false,
      message: "Project not found." 
    });
  }

  // Prevent guide faculty from being on the panel
  if (
    project.guideFaculty.toString() === panelFacultyIds[0] ||
    project.guideFaculty.toString() === panelFacultyIds[1]
  ) {
    return res.status(400).json({
      success: false,
      message: "Guide faculty cannot be a panel member for their own project.",
    });
  }

  // Create a new panel
  const panel = new Panel({
    faculty1: panelFacultyIds[0],
    faculty2: panelFacultyIds[1],
  });
  await panel.save();

  // Assign panel to project
  project.panel = panel._id;
  await project.save();

  const populatedProject = await Project.findById(projectId).populate({
    path: "panel",
    populate: [{ path: "faculty1" }, { path: "faculty2" }],
  });

  return res.status(200).json({
    success: true,
    message: "Panel assigned successfully",
    data: populatedProject,
  });
}

export async function autoCreatePanels(req, res) {
  // Check if panels already exist
  const existingPanelsCount = await Panel.countDocuments();

  // Parse force parameter properly
  const force = req.body.force === true || req.body.force === "true";

  // If panels exist and force flag is not set, return without creating
  if (existingPanelsCount > 0 && !force) {
    return res.status(400).json({
      success: false,
      message: "Panels already exist. Use force=true parameter to recreate panels.",
      existingPanels: existingPanelsCount,
    });
  }

  // If force flag is set, delete existing panels before creating new ones
  if (existingPanelsCount > 0 && force) {
    // Find all projects that reference panels
    const projectsWithPanels = await Project.find({
      panel: { $exists: true, $ne: null },
    });

    // Remove panel references from projects
    for (const project of projectsWithPanels) {
      project.panel = null;
      await project.save();
    }

    // Delete all existing panels
    await Panel.deleteMany({});
    console.log(`Deleted ${existingPanelsCount} existing panels due to force=${force}`);
  }

  const faculties = await Faculty.find({ role: "faculty" });

  if (faculties.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Not enough faculty members to create panels.",
    });
  }

  const createdPanels = [];

  // Create pairs normally
  const pairsCount = Math.floor(faculties.length / 2);

  for (let i = 0; i < pairsCount; i++) {
    const faculty1 = faculties[i * 2];
    const faculty2 = faculties[i * 2 + 1];

    const panel = new Panel({
      faculty1: faculty1._id,
      faculty2: faculty2._id,
    });

    await panel.save();
    createdPanels.push(panel);
  }

  // If we have an odd number of faculty, create an extra panel
  if (faculties.length % 2 !== 0) {
    const lastFaculty = faculties[faculties.length - 1];
    const firstFaculty = faculties[0];

    const panel = new Panel({
      faculty1: lastFaculty._id,
      faculty2: firstFaculty._id,
    });

    await panel.save();
    createdPanels.push(panel);
  }

  return res.status(200).json({
    success: true,
    message: existingPanelsCount > 0
      ? "Existing panels replaced successfully."
      : "Panels created successfully.",
    panelsCreated: createdPanels.length,
  });
}

export async function getAllFacultyWithProjects(req, res) {
  const allFaculty = await Faculty.find();
  const facultyWithProjects = [];

  for (const faculty of allFaculty) {
    const facultyId = faculty._id;

    const guidedProjects = await Project.find({ guideFaculty: facultyId })
      .populate("students", "name regNo")
      .populate("panel");

    // Find all panels where this faculty is faculty1 or faculty2
    const panelsWithFaculty = await Panel.find({
      $or: [{ faculty1: facultyId }, { faculty2: facultyId }],
    });

    const panelIds = panelsWithFaculty.map((panel) => panel._id);

    const panelProjects = await Project.find({ panel: { $in: panelIds } })
      .populate("students", "name regNo")
      .populate("panel");

    facultyWithProjects.push({
      faculty: {
        name: faculty.name,
        employeeId: faculty.employeeId,
        emailId: faculty.emailId,
      },
      guide: guidedProjects,
      panel: panelProjects,
    });
  }

  return res.status(200).json({ 
    success: true, 
    data: facultyWithProjects 
  });
}
