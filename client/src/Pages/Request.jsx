import React, { useEffect, useState } from "react";
import Navbar from "../Components/UniversalNavbar";
import { FaCheck, FaTimes } from "react-icons/fa";
import { ChevronRight, ChevronDown } from "lucide-react";
import { fetchRequests, updateRequestStatus } from "../api";

const RequestPage = () => {
  const [facultyType, setFacultyType] = useState("panel");
  const [requests, setRequests] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingRequestId, setApprovingRequestId] = useState(null);
  const [selectedDeadline, setSelectedDeadline] = useState("");

  const fetchRequestsByType = async (type) => {
    setLoading(true);
    setError("");
    try {
      const { data, error: apiError } = await fetchRequests(type);
      if (apiError) {
        setError(apiError);
        setRequests([]);
      } else {
        const filteredData = data
          .map((faculty) => ({
            ...faculty,
            students: faculty.students
              .filter((student) => student.approved === null)
              .map((student) => ({
                ...student,
                requestId: student._id,
              })),
          }))
          .filter((faculty) => faculty.students.length > 0);

        setRequests(filteredData);
        setExpanded({});
      }
    } catch (err) {
      console.error("Unexpected error in fetchRequestsByType:", err);
      setError("Unexpected error occurred while fetching requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestsByType(facultyType);
  }, [facultyType]);

  const toggleExpand = (facultyId) => {
    setExpanded((prev) => ({ ...prev, [facultyId]: !prev[facultyId] }));
  };

  const removeRequestFromState = (processedRequestId) => {
    setRequests(
      (prevRequests) =>
        prevRequests
          .map((faculty) => ({
            ...faculty,
            students: faculty.students.filter(
              (student) => student.requestId !== processedRequestId
            ),
          }))
          .filter((faculty) => faculty.students.length > 0)
    );
  };

  const handleOpenApprovalModal = (requestId) => {
    setApprovingRequestId(requestId);
    const today = new Date();
    today.setDate(today.getDate() + 7);
    setSelectedDeadline(today.toISOString().split("T")[0]);
  };

  const handleCloseApprovalModal = () => {
    setApprovingRequestId(null);
    setSelectedDeadline("");
  };

  const handleSubmitApproval = async () => {
    if (!approvingRequestId || !selectedDeadline) return;

    const payload = {
      requestId: approvingRequestId,
      status: "approved",
      newDeadline: new Date(selectedDeadline).toISOString(),
    };

    console.log('=== SUBMITTING APPROVAL ===');
    console.log('Payload:', payload);
    console.log('Faculty Type:', facultyType);

    try {
      const response = await updateRequestStatus(facultyType, payload);
      console.log('=== APPROVAL RESPONSE ===');
      console.log('Response:', response);
      
      if (response.success) {
        removeRequestFromState(approvingRequestId);
        alert(response.message || "Request approved successfully");
        handleCloseApprovalModal();
      } else {
        setError(response.message || "Failed to approve request status");
      }
    } catch (err) {
      console.error("Error approving request:", err);
      setError("Failed to approve request. Please try again.");
    }
  };

  const handleReject = async (requestId) => {
    const payload = {
      requestId: requestId,
      status: "rejected",
    };

    try {
      const response = await updateRequestStatus(facultyType, payload);
      if (response.success) {
        removeRequestFromState(requestId);
        alert(response.message || "Request rejected successfully");
      } else {
        setError(response.message || "Failed to reject request status");
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError("Failed to reject request. Please try again.");
    }
  };

  return (
    <>
      <Navbar showLeftMenu={true} />
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <div className="pl-40 pt-20 w-[calc(100%-10rem)]">
          <div className="p-6 md:p-10">
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="font-semibold font-roboto text-2xl md:text-3xl">
                  Pending Requests
                </h1>
                <div className="space-x-2 sm:space-x-4">
                  <button
                    onClick={() => setFacultyType("panel")}
                    className={`px-4 py-2 rounded font-medium text-sm sm:text-base ${
                      facultyType === "panel"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Panel
                  </button>
                  <button
                    onClick={() => setFacultyType("guide")}
                    className={`px-4 py-2 rounded font-medium text-sm sm:text-base ${
                      facultyType === "guide"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Guide
                  </button>
                </div>
              </div>

              {loading ? (
                <p className="text-gray-600 text-center py-10">Loading...</p>
              ) : error ? (
                <p className="text-red-500 text-center py-10 bg-red-50 p-4 rounded">
                  {error}
                </p>
              ) : requests.length === 0 ? (
                <p className="text-gray-600 text-center py-10">
                  No pending {facultyType} requests found.
                </p>
              ) : (
                <div className="space-y-6">
                  {requests.map((faculty) => (
                    <div key={faculty._id} className="border rounded-lg shadow-sm">
                      <div
                        className="cursor-pointer flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 transition"
                        onClick={() => toggleExpand(faculty._id)}
                      >
                        <div className="flex items-center">
                          <span className="mr-2">
                            {expanded[faculty._id] ? (
                              <ChevronDown size={20} />
                            ) : (
                              <ChevronRight size={20} />
                            )}
                          </span>
                          <h2 className="font-semibold text-lg">
                            {faculty.name}{" "}
                            {faculty.empId && `- ${faculty.empId}`}
                          </h2>
                        </div>
                        <span className="ml-3 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {faculty.students.length} pending
                        </span>
                      </div>

                      {expanded[faculty._id] && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full table-auto border-collapse text-sm">
                            <thead className="bg-gray-200 text-gray-700">
                              <tr>
                                <th className="p-3 border border-gray-300 text-left">
                                  Student Name
                                </th>
                                <th className="p-3 border border-gray-300">
                                  Reg No.
                                </th>
                                <th className="p-3 border border-gray-300">
                                  Review Type
                                </th>
                                <th className="p-3 border border-gray-300 text-left">
                                  Comments
                                </th>
                                <th className="p-3 border border-gray-300">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {faculty.students.map((student) => (
                                <tr
                                  key={student.requestId}
                                  className="bg-white hover:bg-gray-50 transition"
                                >
                                  <td className="p-3 border border-gray-300 text-left">
                                    {student.name}
                                  </td>
                                  <td className="p-3 border border-gray-300">
                                    {student.regNo}
                                  </td>
                                  <td className="p-3 border border-gray-300">
                                    {student.projectType}
                                  </td>
                                  <td className="p-3 border border-gray-300 text-left">
                                    {student.comments}
                                  </td>
                                  <td className="p-3 border border-gray-300">
                                    <div className="flex justify-center items-center gap-2">
                                      {approvingRequestId === student.requestId ? (
                                        <div className="flex flex-col items-center gap-2 p-2 border rounded-md bg-gray-50">
                                          <p className="text-xs text-gray-700">
                                            Set new deadline:
                                          </p>
                                          <input
                                            type="date"
                                            value={selectedDeadline}
                                            onChange={(e) =>
                                              setSelectedDeadline(e.target.value)
                                            }
                                            className="p-1 border rounded text-xs"
                                            min={
                                              new Date()
                                                .toISOString()
                                                .split("T")[0]
                                            }
                                          />
                                          <div className="flex gap-1">
                                            <button
                                              onClick={handleSubmitApproval}
                                              className="p-1.5 rounded text-white bg-green-500 hover:bg-green-600 text-xs"
                                            >
                                              Confirm
                                            </button>
                                            <button
                                              onClick={handleCloseApprovalModal}
                                              className="p-1.5 rounded text-gray-700 bg-gray-200 hover:bg-gray-300 text-xs"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleOpenApprovalModal(
                                                student.requestId
                                              )
                                            }
                                            className="p-2 rounded text-white bg-green-500 hover:bg-green-600"
                                            title="Approve"
                                          >
                                            <FaCheck size={14} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleReject(student.requestId)
                                            }
                                            className="p-2 rounded text-white bg-red-500 hover:bg-red-600"
                                            title="Reject"
                                          >
                                            <FaTimes size={14} />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestPage;
