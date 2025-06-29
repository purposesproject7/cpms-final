import mongoose from "mongoose";
import Project from "../models/projectSchema.js";
import Student from "../models/studentSchema.js"; // Ensure this path is correct
import Faculty from "../models/facultySchema.js";
import SystemConfig from "../models/systemConfigSchema.js";
  // Import Panel model at the top of your file
    import Panel from "../models/panelSchema.js";
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
 *   students: [ { regNo, name, emailId, draftReview, review0, review1, review2, review3, pptApproved, attendance, deadline }, ... ],
 *   guideFacultyEmpId: "guide faculty employee id"
 * }
 */

export async function createProject(req, res, next) {
  try {
    const {
      name,
      students: studentDetails, // array of student objects with details.
      guideFacultyEmpId,
    } = req.body;

    // Fetch system config once to get default deadlines
    const systemConfig = await SystemConfig.findOne({});
    if (!systemConfig) {
      return res.status(500).json({
        message: "Error creating project",
        error: "System configuration with default deadlines not found.",
      });
    }

    const {
      draftReview,
      review0,
      review1,
      review2,
      review3,
      pptApproved,
      attendance,
    } = systemConfig;

    const defaultDeadlines = {
      draftReview,
      review0,
      review1,
      review2,
      review3,
      pptApproved,
      attendance,
    };

    // Lookup or create each student based on regNo
    const studentIds = await Promise.all(
      studentDetails.map(async (studentObj) => {
        const {
          regNo,
          name: studentName,
          emailId,
          draftReview,
          review0,
          review1,
          review2,
          review3,
          pptApproved,
          attendance,
          deadline,
        } = studentObj;

        let student = await Student.findOne({ regNo });

        if (!student) {
          student = new Student({
            regNo,
            name: studentName,
            emailId,
            draftReview: draftReview || {
              component1: null,
              component2: null,
              component3: null,
              locked: false,
            },
            review0: review0 || {
              component1: null,
              locked: false,
            },
            review1: review1 || {
              component1: null,
              component2: null,
              component3: null,
              locked: false,
            },
            review2: review2 || {
              component1: null,
              component2: null,
              component3: null,
              locked: false,
            },
            review3: review3 || {
              component1: null,
              component2: null,
              component3: null,
              locked: false,
            },
            pptApproved: pptApproved || {
              approved: false,
              locked: false,
            },
            attendance: attendance || {
              value: false,
              locked: false,
            },
            deadline: deadline || JSON.parse(JSON.stringify(defaultDeadlines)),
          });

          await student.save();
        }

        return student._id;
      })
    );

    // Lookup guide faculty
    const guideFacultyDoc = await Faculty.findOne({
      employeeId: guideFacultyEmpId,
    });
    if (!guideFacultyDoc) {
      throw new Error(
        `Guide faculty with employee id ${guideFacultyEmpId} not found`
      );
    }

    const guideFaculty = guideFacultyDoc._id;

    const newProject = new Project({
      name,
      students: studentIds,
      guideFaculty,
      panel: null,
    });

    await newProject.save();

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating project: ", error);
    return res
      .status(500)
      .json({ message: "Error creating project", error: error.message });
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
 */export async function getAllGuideProjects(req, res) {
  try {
    const userId = req.user.id; // Get the authenticated user's ID
    
    // Added by theju - Add debug logging
    console.log('getAllGuideProjects called for user:', userId);
    
    // Find projects where the user is the guide
    const projects = await Project.find({ 
      guideFaculty: userId 
    }).populate('students guideFaculty');
    
    // Added by theju - Debug each project's PPT status
    projects.forEach(project => {
      console.log(`Project ${project.name} PPT status:`, project.pptApproved);
    });
    
    return res.status(200).json({
      success: true,
      data: projects,
      message: "Guide projects fetched successfully"
    });
  } catch (error) {
    console.error('Error in getAllGuideProjects:', error);
    return res.status(500).json({
      success: false,
      message: "Error fetching guide projects",
      error: error.message
    });
  }
}


/**
 * Get all projects where the logged-in faculty is a panel member.
 * Relies on req.user.id (set by authMiddleware).
 */
export async function getAllPanelProjects(req, res, next) {
  try {
    console.log('=== getAllPanelProjects CALLED ===');
    console.log('req.user:', req.user);
    console.log('facultyId:', req.user?.id);
    
    const facultyId = req.user.id;
    
    if (!facultyId) {
      console.log('ERROR: No faculty ID found in request');
      return res.status(400).json({
        success: false,
        message: "Faculty ID not found in request"
      });
    }
    
    console.log('Looking for panels with faculty:', facultyId);
    
  
    
    const panels = await Panel.find({
      $or: [
        { faculty1: facultyId },
        { faculty2: facultyId }
      ]
    });
    
    console.log('Found panels:', panels.length);
    console.log('Panel details:', panels);
    
    if (panels.length === 0) {
      console.log('No panels found for this faculty');
      return res.status(200).json({
        success: true,
        data: [],
        message: "No panels found for this faculty."
      });
    }
    
    const panelIds = panels.map(panel => panel._id);
    console.log('Panel IDs to search for:', panelIds);
    
    const panelProjects = await Project.find({ 
      panel: { $in: panelIds }
    })
      .populate("students")
      .populate("guideFaculty")
      .populate({
        path: "panel",
        populate: [
          { path: "faculty1", model: "Faculty" },
          { path: "faculty2", model: "Faculty" }
        ]
      });

    console.log('Panel projects found:', panelProjects.length);
    console.log('Projects:', panelProjects);

    return res.status(200).json({
      success: true,
      data: panelProjects,
      message: "Panel projects fetched successfully"
    });
  } catch (error) {
    console.error("=== ERROR in getAllPanelProjects ===");
    console.error("Error details:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error fetching panel projects", 
      error: error.message 
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
export async function updateProjectDetails(req, res, next) {
  try {
    const { projectId, studentUpdates, pptApproved } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Added by theju - Remove project-level PPT update since it doesn't exist in schema
    // if (pptApproved) {
    //   project.pptApproved = pptApproved;
    //   await project.save();
    // }

    const updateResults = [];

    for (const studentData of studentUpdates) {
      const {
        studentId,
        draftReview,
        review0,
        review1,
        review2,
        review3,
        pptApproved,
        attendance,
        comments,
      } = studentData;

      if (!studentId) {
        updateResults.push({ status: "Missing studentId", studentId: null });
        continue;
      }

      const updatePayload = {};

      if (draftReview) updatePayload.draftReview = draftReview;
      if (review0) updatePayload.review0 = review0;
      if (review1) updatePayload.review1 = review1;
      if (review2) updatePayload.review2 = review2;
      if (review3) updatePayload.review3 = review3;
      if (pptApproved) updatePayload.pptApproved = pptApproved;
      if (attendance) updatePayload.attendance = attendance;
      if (comments) updatePayload.comments = comments;

      console.log('Updating student:', studentId, JSON.stringify(updatePayload));

      const updatedStudent = await Student.findByIdAndUpdate(
        studentId,
        { $set: updatePayload },
        { new: true }
      );

      if (updatedStudent) {
        updateResults.push({ studentId, status: "Updated successfully" });
      } else {
        updateResults.push({ studentId, status: "Student not found" });
      }
    }

    // Added by theju - If team-level PPT approval is needed, update all students
    if (pptApproved) {
      console.log('Updating team-level PPT approval for all students:', pptApproved);
      
      // Update all students in the project with the same PPT approval
      for (const studentData of studentUpdates) {
        if (studentData.studentId) {
          await Student.findByIdAndUpdate(
            studentData.studentId,
            { $set: { pptApproved: pptApproved } },
            { new: true }
          );
          console.log(`Updated PPT approval for student ${studentData.studentId}:`, pptApproved);
        }
      }
    }

    console.log('Project update complete:', projectId, updateResults);

    return res.status(200).json({
      message: "All student marks updated successfully",
      updates: updateResults,
      data: {
        success: true,
        message: "Project updated successfully"
      }
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