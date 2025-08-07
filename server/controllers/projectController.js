import mongoose from "mongoose";
import Project from "../models/projectSchema.js";
import Student from "../models/studentSchema.js"; // Ensure this path is correct
import Faculty from "../models/facultySchema.js";
// Import Panel model at the top of your file
import Panel from "../models/panelSchema.js";
import MarkingSchema from "../models/markingSchema.js";
/**
 * Create a new project.
 * Expected req.body:
 * {
 *   name: "Project Name", // Unique identifier for the project
 *   students: [ { regNo, name, emailId, draftReview, review0, review1, review2, review3, pptApproved, attendance }, ... ],
 *   guideFacultyEmpId: "guide faculty employee id"
 * }
 */
/**
 * Create a new project.
 * Expected req.body:
 * {
 *   name: "Project Name", // Unique identifier for the project
 *   students: [ { regNo, name, emailId, draftReview, review0, review1, review2, review3, review3, pptApproved, deadline }, ... ],
 *   guideFacultyEmpId: "guide faculty employee id"
 * }
 */

export async function createProject(req, res, next) {
  try {
    const { name, students: studentDetails, guideFacultyEmpId } = req.body;

    // Validate studentDetails is non-empty
    if (!Array.isArray(studentDetails) || studentDetails.length === 0) {
      return res.status(400).json({
        message:
          "Student details are required and should be a non-empty array.",
      });
    }

    // Assuming all students belong to the same school and department, get from the first student or pass explicitly
    const { school, department } = studentDetails[0];
    if (!school || !department) {
      return res.status(400).json({
        message: "School and department must be provided for the students.",
      });
    }

    // Fetch MarkingSchema for the school and department
    const markingSchema = await MarkingSchema.findOne({ school, department });
    if (!markingSchema) {
      return res.status(500).json({
        message: "Error creating project",
        error: `Marking schema not found for school: ${school}, department: ${department}`,
      });
    }

    // Extract the review keys from markingSchema.reviews
    const reviewKeys = markingSchema.reviews.map((review) => review.reviewName);

    // Build default deadlines map from markingSchema (if you store deadlines here)
    // Since your markingSchema does not have deadlines in the posted schema,
    // you may need to either add deadlines to MarkingSchema or handle it differently.
    // Here, we'll assume deadlines will be set later or separately.
    const defaultDeadlines = {}; // Empty or handle as per your design

    const studentIds = await Promise.all(
      studentDetails.map(async (studentObj) => {
        const {
          regNo,
          name: studentName,
          emailId,
          reviews = {},
          pptApproved,
          deadline,
          school: studSchool,
          department: studDept,
        } = studentObj;

        // Validate school and department per student matches overall
        if (studSchool !== school || studDept !== department) {
          throw new Error(
            `Student ${regNo} has mismatched school or department. All students should belong to same school and department.`
          );
        }

        const existingStudent = await Student.findOne({ regNo });
        if (existingStudent) {
          // Note: Returning inside Promise.all won't stop execution. Instead, throw error or handle differently.
          throw new Error(`Student already exists with regNo ${regNo}`);
        }

        const reviewsMap = new Map();

        // Use reviewKeys from MarkingSchema to build review structure
        for (const reviewKey of reviewKeys) {
          // Find the review definition from markingSchema (to get components if needed)
          const reviewDef = markingSchema.reviews.find(
            (rev) => rev.reviewName === reviewKey
          );

          const inputReview = reviews?.[reviewKey] || {};

          // Initialize marks based on components or empty
          let marks = {};

          if (reviewDef && Array.isArray(reviewDef.components)) {
            for (const comp of reviewDef.components) {
              marks[comp.name] = inputReview.marks?.[comp.name] || 0;
            }
          } else {
            // fallback: copy marks if any
            marks = inputReview.marks || {};
          }

          const attendance = inputReview.attendance || {
            value: false,
            locked: false,
          };
          const locked = inputReview.locked || false;
          const comments = inputReview.comments || "";

          reviewsMap.set(reviewKey, {
            marks,
            comments,
            attendance,
            locked,
          });
        }

        // Use provided deadline or default empty (modify if deadlines exist in markingSchema)
        const studentDeadline = deadline || defaultDeadlines;

        const student = new Student({
          regNo,
          name: studentName,
          emailId,
          reviews: reviewsMap,
          pptApproved: pptApproved || { approved: false, locked: false },
          deadline: studentDeadline,
          school,
          department,
        });

        await student.save();
        return student._id;
      })
    );

    const guideFacultyDoc = await Faculty.findOne({
      employeeId: guideFacultyEmpId,
    });
    if (!guideFacultyDoc) {
      throw new Error(
        `Guide faculty with employee id ${guideFacultyEmpId} not found`
      );
    }

    const newProject = new Project({
      name,
      students: studentIds,
      guideFaculty: guideFacultyDoc._id,
      panel: null,
      school,
      department,
    });

    await newProject.save();

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    // If error is thrown inside Promise.all, it will be caught here
    return res.status(500).json({
      message: "Error creating project",
      error: error.message,
    });
  }
}

export async function deleteProject(req, res) {
  try {
    const { projectId } = req.params;

    const deletedProject = await Project.findByIdAndDelete(projectId);

    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting project", error: error.message });
  }
}

/**
 * Get all projects where the logged-in faculty is the guide.
 * Relies on req.user.id (set by authMiddleware).
 */
export async function getAllGuideProjects(req, res) {
  try {
    const userId = req.user.id; // Get the authenticated user's ID

    // Added by theju - Add debug logging
    console.log("getAllGuideProjects called for user:", userId);

    // Find projects where the user is the guide
    const projects = await Project.find({
      guideFaculty: userId,
    }).populate("students guideFaculty");

    // Added by theju - Debug each project's PPT status
    projects.forEach((project) => {
      console.log(`Project ${project.name} PPT status:`, project.pptApproved);
    });

    return res.status(200).json({
      success: true,
      data: projects,
      message: "Guide projects fetched successfully",
    });
  } catch (error) {
    console.error("Error in getAllGuideProjects:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching guide projects",
      error: error.message,
    });
  }
}

/**
 * Get all projects where the logged-in faculty is a panel member.
 * Relies on req.user.id (set by authMiddleware).
 */
export async function getAllPanelProjects(req, res, next) {
  try {
    console.log("=== getAllPanelProjects CALLED ===");
    console.log("req.user:", req.user);
    console.log("facultyId:", req.user?.id);

    const facultyId = req.user.id;

    if (!facultyId) {
      console.log("ERROR: No faculty ID found in request");
      return res.status(400).json({
        success: false,
        message: "Faculty ID not found in request",
      });
    }

    console.log("Looking for panels with faculty:", facultyId);

    const panels = await Panel.find({
      $or: [{ faculty1: facultyId }, { faculty2: facultyId }],
    });

    console.log("Found panels:", panels.length);
    console.log("Panel details:", panels);

    if (panels.length === 0) {
      console.log("No panels found for this faculty");
      return res.status(200).json({
        success: true,
        data: [],
        message: "No panels found for this faculty.",
      });
    }

    const panelIds = panels.map((panel) => panel._id);
    console.log("Panel IDs to search for:", panelIds);

    const panelProjects = await Project.find({
      panel: { $in: panelIds },
    })
      .populate("students")
      .populate("guideFaculty")
      .populate({
        path: "panel",
        populate: [
          { path: "faculty1", model: "Faculty" },
          { path: "faculty2", model: "Faculty" },
        ],
      });

    console.log("Panel projects found:", panelProjects.length);
    console.log("Projects:", panelProjects);

    return res.status(200).json({
      success: true,
      data: panelProjects,
      message: "Panel projects fetched successfully",
    });
  } catch (error) {
    console.error("=== ERROR in getAllPanelProjects ===");
    console.error("Error details:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching panel projects",
      error: error.message,
    });
  }
}

/**
 * Update the details of a project.
 * Expected req.params: { name: "Project Name" }
 * Expected req.body: { ...updateData } (fields to update)
 */
// In this i have chosen to update the whole project even if there is only change for 1 student, this is bcos,
// we dont have an update button for individual btn in the fronend just one for the whole project...
// if this seems inefficient we can change it have individual endpoints for different updates...
// Update your updateProjectDetails function to handle comments:

export async function updateProjectDetails(req, res, next) {
  try {
    const { projectId, studentUpdates, pptApproved } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const updateResults = [];

    for (const studentData of studentUpdates) {
      const {
        studentId,
        reviews = {},
        pptApproved: individualPPT,
      } = studentData;

      if (!studentId) {
        updateResults.push({ status: "Missing studentId", studentId: null });
        continue;
      }

      const student = await Student.findById(studentId);
      if (!student) {
        updateResults.push({ studentId, status: "Student not found" });
        continue;
      }

      // Update each review key dynamically
      for (const reviewKey in reviews) {
        const inputReview = reviews[reviewKey];
        const current = student.reviews.get(reviewKey) || {};

        student.reviews.set(reviewKey, {
          marks: inputReview.marks || current.marks || {},
          comments: (inputReview.comments ?? current.comments) || "",
          attendance: inputReview.attendance ||
            current.attendance || { value: false, locked: false },
          locked: (inputReview.locked ?? current.locked) || false,
        });
      }

      if (individualPPT) {
        student.pptApproved = individualPPT;
      }

      await student.save();
      updateResults.push({ studentId, status: "Updated successfully" });
    }

    // Apply team-wide PPT update
    if (pptApproved) {
      await Promise.all(
        studentUpdates.map(async (stu) => {
          if (stu.studentId) {
            await Student.findByIdAndUpdate(stu.studentId, {
              $set: { pptApproved: pptApproved },
            });
          }
        })
      );
    }

    return res.status(200).json({
      message: "All student marks updated successfully",
      updates: updateResults,
      data: {
        success: true,
        message: "Project updated successfully",
      },
    });
  } catch (error) {
    console.error("Error updating student marks:", error);
    return res.status(500).json({
      message: "Server error while updating marks",
      error: error.message,
    });
  }
}

/**
 * Get the details of a specific project by its name.
 * Expected req.params: { name: "Project Name" }
 */
// i dont think we'll use this endpoint... cos only we'll disp all the projects
// based on the faculty and we dont reroute to a new page... still...
export async function getProjectDetails(req, res, next) {
  try {
    const { projectId } = req.params;

    // Get the project based on the unique name
    const requiredProject = await Project.findOne({ _id: projectId })
      .populate("students")
      .populate("guideFaculty")
      .populate("panelFaculty");

    if (!requiredProject) {
      return res.status(404).send({
        message: "No project found with this name.",
        team: requiredProject,
      });
    }

    return res.status(200).send({ results: requiredProject });
  } catch (error) {
    console.error("Error fetching project details: ", error);
    return res.status(500).json({
      message: "Error fetching project details",
      error: error.message,
    });
  }
}
