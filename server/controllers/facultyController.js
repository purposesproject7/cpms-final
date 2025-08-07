import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import MarkingSchema from "../models/markingSchema.js";

// Get details of a faculty by employee ID
export async function getFacultyDetails(req, res) {
  try {
    const { employeeId } = req.params;

    const faculty = await Faculty.findOne({ employeeId });
    if (!faculty) {
      return res
        .status(404)
        .json({ message: "No faculty found with the provided ID" });
    }

    return res.status(200).json({
      success: true,
      message: "Operation successful",
      data: faculty,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Replaces getDefaultDeadline (returns the marking schema for a department)
export async function getMarkingSchema(req, res) {
  try {
    const { school, department } = req.query;

    if (!school || !department) {
      return res
        .status(400)
        .json({ message: "School and Department are required" });
    }

    const schema = await MarkingSchema.findOne({ school, department });
    if (!schema) {
      return res
        .status(404)
        .json({
          message: "No marking schema found for this school and department.",
        });
    }

    return res.status(200).json({
      success: true,
      data: schema,
    });
  } catch (error) {
    console.error("Error in getMarkingSchema:", error);
    return res.status(500).json({ message: error.message });
  }
}

//  Get all guide and panel projects for a faculty
export async function getFacultyProjects(req, res) {
  try {
    const { employeeId } = req.params;

    const faculty = await Faculty.findOne({ employeeId });
    if (!faculty) {
      return res
        .status(404)
        .json({ message: "No faculty found with the provided employeeId." });
    }

    // Projects where this faculty is the guide
    const guideProjects = await Project.find({ guideFaculty: faculty._id })
      .populate("students", "name regNo emailId")
      .populate("guideFaculty", "name employeeId")
      .lean();

    // Panels where this faculty is a member
    const panels = await Panel.find({
      $or: [{ faculty1: faculty._id }, { faculty2: faculty._id }],
    }).select("_id");

    const panelIds = panels.map((panel) => panel._id);

    // Projects evaluated by these panels
    const panelProjects = await Project.find({ panel: { $in: panelIds } })
      .populate("students", "name regNo emailId")
      .populate("guideFaculty", "name employeeId")
      .populate("panel")
      .lean();

    // Format response
    const formatProjects = (projects) =>
      projects.map((project) => ({
        _id: project._id,
        name: project.name,
        students: (project.students || []).map((student) => ({
          _id: student._id,
          name: student.name || "N/A",
          regNo: student.regNo || "N/A",
          emailId: student.emailId || "N/A",
        })),
        guideFaculty: project.guideFaculty
          ? {
              name: project.guideFaculty.name,
              employeeId: project.guideFaculty.employeeId,
            }
          : null,
        panel: project.panel || null,
      }));

    return res.status(200).json({
      success: true,
      message: "Faculty project data fetched successfully",
      data: {
        guideProjects: formatProjects(guideProjects),
        panelProjects: formatProjects(panelProjects),
      },
    });
  } catch (error) {
    console.error("Error in getFacultyProjects:", error);
    res.status(500).json({ message: error.message });
  }
}
