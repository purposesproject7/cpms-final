import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Request from "../models/requestSchema.js";


// these endpoints are for the facutly pages
//updated by theju pls check ram
export async function requestAdmin(req, res, next) {
  try {
    const {facultyType} = req.params;
    const { employeeId, faculty, regNo, reviewType, reason } = req.body;

    console.log('Request admin called:', { facultyType, body: req.body });

    // Validate facultyType
    if (!["guide", "panel"].includes(facultyType)) {
      return res.status(400).json({ message: "Invalid faculty type" });
    } 

    let facultyIds = [];

    if (facultyType === "guide") {
      // For guide, use the current logged-in faculty
      facultyIds = [req.user.id];
      
      const facultyDoc = await Faculty.findById(req.user.id);
      if (!facultyDoc) {
        console.error('Faculty not found for user ID:', req.user.id);
        return res.status(404).json({ message: "Faculty not found in database!" });
      }
      console.log('Found guide faculty:', facultyDoc.name, facultyDoc.employeeId);
    } else if (facultyType === "panel") {
      // For panel, use the current logged-in faculty (panel member)
      facultyIds = [req.user.id];
      
      const facultyDoc = await Faculty.findById(req.user.id);
      if (!facultyDoc) {
        console.error('Panel faculty not found for user ID:', req.user.id);
        return res.status(404).json({ message: "Panel faculty not found in database!" });
      }
      console.log('Found panel faculty:', facultyDoc.name, facultyDoc.employeeId);
    }

    // Find student
    const student = await Student.findOne({ regNo });
    if (!student) {
      return res.status(404).json({ message: "Student not found!" });
    }

    // Validate review types
    const allowedReviewTypes = {
      guide: ["review0", "draftReview", "review1"],
      panel: ["review2", "review3"]
    };

    if (!allowedReviewTypes[facultyType].includes(reviewType)) {
      return res.status(401).json({ 
        message: `${facultyType} faculty cannot request access to ${reviewType}. Allowed types: ${allowedReviewTypes[facultyType].join(', ')}` 
      });
    }

    const request = new Request({
      faculty: facultyIds,
      facultyType,
      student: student._id,
      reviewType,
      reason,
      status: "pending",
      createdAt: Date.now(),
    });

    await request.save();
    console.log('Request saved successfully');
    return res.status(201).json({ message: "Request successfully posted" });
  } catch (error) {
    console.error('Error in requestAdmin:', error);
    return res.status(500).json({ message: error.message });
  }
}





export async function checkRequestStatus(req, res) {
  try {
    const { facultyType } = req.params;
    const { regNo, reviewType } = req.query;

    if (!["guide", "panel"].includes(facultyType)) {
      return res.status(400).json({ message: "Invalid faculty type" });
    }

    const student = await Student.findOne({ regNo });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find latest matching request
    const request = await Request.findOne({
      student: student._id,
      facultyType,
      reviewType,
    }).sort({ createdAt: -1 }); // latest request

    if (!request) {
      return res.json({ status: "none" });
    }

    return res.json({ status: request.status || "pending" });
  } catch (error) {
    return res.status(500).json({ message: error.stack });
  }
}
