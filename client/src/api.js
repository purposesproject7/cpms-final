import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
, // Make sure this matches your backend port
});

// Add authorization token to all requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const adminLogin = (data) => API.post("/auth/login", data);

// Admin endpoints
export const getAllPanelProjects = () => API.get("/admin/getAllPanelProjects");
export const getAllGuideProjects = () => API.get("/admin/getAllGuideProjects");
// Add this to your api.js file

export const getAllProjects = async () => {
  try {
    const response = await axios.get('/api/admin/getAllProjects');
    return response.data;
  } catch (error) {
    console.error('Error fetching all projects:', error);
    throw error;
  }
};


// Faculty endpoint
export const getAllFaculty = () => API.get("/admin/getAllFaculty");
export const getGuideTeams = () => API.get("/project/guide");
export const getPanelTeams = () => API.get("/project/panel");

export const getAllPanels = () => API.get("/admin/getAllPanels");
export const createPanelManual = (data) => API.post("/admin/createPanel", data);

// Auto create panels from the faculty list
export const autoCreatePanelManual = () =>
  API.post("/admin/autoCreatePanels", { force: true });

export const deletePanel = (panelId) =>
  API.delete(`/admin/${panelId}/deletePanel`);

export const assignPanelToProject = (data) =>
  API.post("/admin/assignPanel", data);

// FIX: Added missing slash
export const autoAssignPanelsToProjects = () =>
  API.post("/admin/autoAssignPanel");

// FIX: Added missing slash
export const getAllRequests = () => API.get("/admin/getAllRequests");

// Get all requests for guide or panel
export const fetchRequests = async (type) => {
  try {
    const res = await API.get(`/admin/${type}/getAllRequests`);
    const all = res.data.data || [];
    const unresolved = all.filter((req) => !req.resolvedAt);
    return { data: unresolved };
  } catch (err) {
    return { error: err.response?.data?.message || "Something went wrong" };
  }
};

export const updateRequestStatus = async (facultyType, data) => {
  try {
    const response = await API.post(
      `/admin/${facultyType}/updateRequest`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error updating request status:", error);
    return {
      success: false,
      message: error.response?.data?.message || "An unexpected error occurred",
    };
  }
};

export const setDefaultDeadline = (defaultDeadline) =>
  API.post("/admin/setDefaultDeadline", { defaultDeadline });

export const getDefaultDeadline = () => API.get("/faculty/getDefaultDeadline");

// Request functions
export async function createReviewRequest(facultyType, requestData) {
  try {
    const res = await API.post(`/student/${facultyType}/requestAdmin`, requestData);
    return { success: true, message: res.data.message };
  } catch (error) {
    console.error("❌ Error creating review request:", error);
    return { success: false, message: error.response?.data?.message || 'Error creating request' };
  }
}

export async function checkRequestStatus(facultyType, regNo, reviewType) {
  try {
    const res = await API.get(`/student/${facultyType}/checkRequestStatus`, {
      params: { regNo, reviewType }
    });
    return res.data;
  } catch (error) {
    console.error("Error checking request status:", error);
    return { status: "none" };
  }
}

export async function checkAllRequestStatuses(teamsList) {
  const statuses = {};
  
  for (const team of teamsList) {
    for (const student of team.students) {
      const isPanel = team.panel !== undefined;
      const facultyType = isPanel ? 'panel' : 'guide';
      const reviewTypes = isPanel ? ['review2', 'review3'] : ['review0', 'draftReview', 'review1'];
      
      console.log(`Checking ${facultyType} request statuses for team ${team.title}`);
      
      for (const reviewType of reviewTypes) {
        try {
          const status = await checkRequestStatus(facultyType, student.regNo, reviewType);
          
          if (status && status.status && status.status !== 'none') {
            const key = `${student.regNo}_${reviewType}`;
            statuses[key] = status;
            console.log(`Found ${facultyType} request status for ${student.regNo} ${reviewType}:`, status);
          }
        } catch (error) {
          console.error(`Error checking ${facultyType} request status:`, error);
        }
      }
    }
  }
  
  return statuses;
}

export const submitReview = (projectId, reviewType, reviewData) =>
  API.put(`/project/${projectId}`, {
    reviewType,
    ...reviewData,
  });

// Project endpoints
export const createProject = (projectData) => 
  API.post("/project/create", projectData);

export const deleteProject = (projectId) =>
  API.delete(`/project/${projectId}`);

export const getGuideProjects = () => 
  API.get("/project/guide");

export const getPanelProjects = () =>
  API.get("/project/panel");

export const updateProject = (updatePayload) =>
  API.put("/project/update", updatePayload);

export const getProjectDetails = (projectId) =>
  API.get(`/project/${projectId}`);

// FIX: OTP endpoints - Use API instance instead of raw axios
export const sendOTP = async (emailId) => {
  try {
    const response = await API.post("/otp/send-otp", {
      emailId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Verify OTP and reset password
export const verifyOTPAndResetPassword = async (emailId, otp, newPassword, confirmPassword) => {
  try {
    const response = await API.post("/otp/verify-otp-reset", {
      emailId,
      otp,
      newPassword,
      confirmPassword
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Resend OTP
export const resendOTP = async (emailId) => {
  try {
    const response = await API.post("/otp/resend-otp", {
      emailId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createFaculty = async (facultyData) => {
  
    const response = await API.post("/admin/createFaculty", facultyData);
    return response.data;
  
};

export const createAdmin = async (adminData) => {

    const response = await API.post("/admin/createAdmin", adminData);
    return response.data;
  
};

export default API;
