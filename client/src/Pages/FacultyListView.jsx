// FacultyListView.jsx - Updated to fetch from backend with JWT support
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import Navbar from "../Components/UniversalNavbar";
import { getAllFaculty } from '../api'; // Import the API function

const downloadCSV = (facultyList) => {
  const headers = ['Faculty Name', 'Employee ID', 'Email ID', 'Role'];
  const rows = facultyList.map(f => [
    f.name || 'N/A', 
    f.employeeId || 'N/A', 
    f.emailId || 'N/A', 
    f.role || 'N/A'
  ]);
  let csvContent = 'data:text/csv;charset=utf-8,' + 
    headers.join(',') + '\n' + 
    rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "faculty_list.csv");
  document.body.appendChild(link);
  link.click();
};

const FacultyListView = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FIXED: JWT token decoder function
  const decodeJWT = (token) => {
    try {
      if (!token || typeof token !== 'string') return null;
      
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Decode the payload (second part)
      const payload = parts[1];
      
      // Add padding if necessary
      const padding = '='.repeat((4 - payload.length % 4) % 4);
      const paddedPayload = payload + padding;
      
      // Decode base64
      const decodedBytes = atob(paddedPayload);
      
      // Parse JSON
      return JSON.parse(decodedBytes);
    } catch (error) {
      console.log('Failed to decode JWT:', error);
      return null;
    }
  };

  // FIXED: Better user data retrieval function that handles JWT tokens
  const getCurrentUser = () => {
    try {
      // Try multiple possible keys where user data might be stored
      const possibleKeys = ['token', 'jwt', 'authToken', 'accessToken', 'faculty', 'user', 'admin', 'currentUser'];
      
      for (const key of possibleKeys) {
        const userData = localStorage.getItem(key);
        if (userData) {
          try {
            // First try to parse as JSON (for regular objects)
            const parsed = JSON.parse(userData);
            console.log(`Found user data in localStorage key '${key}':`, parsed);
            
            // Check if this object has the required fields
            if (parsed && (parsed.role || parsed.id || parsed.employeeId)) {
              return parsed;
            }
          } catch (parseError) {
            // If JSON.parse fails, try to decode as JWT
            console.log(`Failed to parse as JSON from key '${key}', trying JWT decode...`);
            const decoded = decodeJWT(userData);
            if (decoded && (decoded.role || decoded.id || decoded.employeeId)) {
              console.log(`Successfully decoded JWT from key '${key}':`, decoded);
              return decoded;
            }
          }
        }
      }
      
      // If no valid user data found, return empty object
      console.log('No valid user data found in localStorage');
      return {};
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return {};
    }
  };

  // FIXED: Updated to fetch from backend with JWT support
  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('=== FETCHING FACULTY LIST FROM BACKEND ===');
        
        // FIXED: Use the improved user retrieval function
        const currentUser = getCurrentUser();
        console.log('Current user:', currentUser);
        
        // FIXED: More flexible admin check
        const isAdmin = currentUser.role === 'admin' || 
                       currentUser.role === 'Admin' || 
                       currentUser.employeeId?.includes('ADMIN') ||
                       currentUser.emailId === 'admin@vit.ac.in';
        
        console.log('Is admin check:', {
          role: currentUser.role,
          employeeId: currentUser.employeeId,
          emailId: currentUser.emailId,
          isAdmin: isAdmin
        });
        
        if (!isAdmin) {
          throw new Error('Admin access required. Please login as admin.');
        }
        
        const response = await getAllFaculty();
        console.log('Faculty API response:', response);
        
        // Handle different response structures
        let facultyData = [];
        if (response?.data?.success && response.data.data) {
          facultyData = response.data.data;
        } else if (response?.data?.faculties) {
          facultyData = response.data.faculties;
        } else if (response?.data && Array.isArray(response.data)) {
          facultyData = response.data;
        } else if (response?.success && response.data) {
          facultyData = response.data;
        }
        
        console.log('Processed faculty data:', facultyData);
        setFacultyList(facultyData);
        
      } catch (err) {
        console.error('Error fetching faculty list:', err);
        setError(err.message || 'Failed to fetch faculty list');
        
        // Fallback to dummy data for development
        const dummyData = [
          { 
            name: 'Dr. Sandeep', 
            employeeId: 'EMP001', 
            emailId: 'sandeep@vit.ac.in',
            role: 'faculty',
            panelTeams: ['T1', 'T3'], 
            guideTeams: ['T4'] 
          },
          { 
            name: 'Prof. Kavitha', 
            employeeId: 'EMP002', 
            emailId: 'kavitha@vit.ac.in',
            role: 'faculty',
            panelTeams: ['T2'], 
            guideTeams: ['T5', 'T6'] 
          }
        ];
        setFacultyList(dummyData);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, []);

  // Mock notifications - you can replace this with actual API call
  const notifications = [
    { id: 1, teacher: 'Dr. Sandeep', reason: 'Edit panel mark for T1' },
    { id: 2, teacher: 'Prof. Kavitha', reason: 'Correction in final grade for T5' }
  ];

  const filteredList = facultyList.filter(f => 
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    f.emailId?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleDetails = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className='min-h-screen bg-gray-50 overflow-x-hidden'>
          <div className="p-20 pl-28">
            <div className='shadow-md rounded-lg bg-white p-10'>
              <div className="flex items-center justify-center h-64">
                <div className="text-xl text-gray-600">Loading faculty list...</div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className='min-h-screen bg-gray-50 overflow-x-hidden'>
        <div className="p-20 pl-28">
          <div className='shadow-md rounded-lg bg-white p-10'>
            <div className="">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold mb-4 font-roboto text-3xl">
                  Faculty List ({facultyList.length})
                </h3>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Search by name, ID, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border px-3 py-2 rounded shadow w-64"
                  />
                  <button
                    onClick={() => downloadCSV(filteredList)}
                    className="bg-blue-600 hover:bg-blue-700 hover:transition hover:ease-in-out hover:delay-150 hover:scale-110 text-white px-4 py-2 rounded"
                    disabled={filteredList.length === 0}
                  >
                    Download CSV
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <strong>Error:</strong> {error}
                  <div className="text-sm mt-1">Showing dummy data for development purposes.</div>
                </div>
              )}

              {/* Faculty count and search results */}
              <div className="mb-4 text-sm text-gray-600">
                {search && (
                  <span>Showing {filteredList.length} of {facultyList.length} faculty members</span>
                )}
              </div>

              {/* // Debug info for troubleshooting
              // <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
              //   <strong>Debug Info:</strong>
              //   <div>Current User: {JSON.stringify(getCurrentUser())}</div>
              //   <div>LocalStorage Keys: {Object.keys(localStorage).join(', ')}</div>
              // </div> */}

              {filteredList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {search ? 'No faculty members found matching your search.' : 'No faculty members found.'}
                </div>
              ) : (
                <table className="w-full border text-left mb-6">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border">Name</th>
                      <th className="p-3 border">Employee ID</th>
                      <th className="p-3 border">Email ID</th>
                      <th className="p-3 border">Role</th>
                      <th className="p-3 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((f, i) => (
                      <React.Fragment key={f._id || i}>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 border font-medium">{f.name || 'N/A'}</td>
                          <td className="p-3 border">{f.employeeId || 'N/A'}</td>
                          <td className="p-3 border">{f.emailId || 'N/A'}</td>
                          <td className="p-3 border">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              f.role === 'admin' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {f.role || 'faculty'}
                            </span>
                          </td>
                          <td className="p-3 border">
                            <button
                              onClick={() => toggleDetails(i)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded hover:transition hover:ease-in-out hover:delay-150 hover:scale-110"
                            >
                              {expandedIndex === i ? 'Hide' : 'View Details'}
                            </button>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {expandedIndex === i && (
                            <motion.tr
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="bg-gray-50"
                            >
                              <td colSpan="5" className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-semibold text-gray-700 mb-2">Faculty Information:</p>
                                    <ul className="space-y-1 text-sm">
                                      <li><strong>ID:</strong> {f._id || 'N/A'}</li>
                                      <li><strong>Created:</strong> {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'N/A'}</li>
                                      <li><strong>Updated:</strong> {f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : 'N/A'}</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-700 mb-2">Project Assignments:</p>
                                    {f.panelTeams || f.guideTeams ? (
                                      <>
                                        {f.panelTeams && f.panelTeams.length > 0 && (
                                          <>
                                            <p className="font-medium text-sm">Panel Teams:</p>
                                            <ul className="list-disc ml-6 mb-2 text-sm">
                                              {f.panelTeams.map((team, j) => <li key={j}>{team}</li>)}
                                            </ul>
                                          </>
                                        )}
                                        {f.guideTeams && f.guideTeams.length > 0 && (
                                          <>
                                            <p className="font-medium text-sm">Guide Teams:</p>
                                            <ul className="list-disc ml-6 text-sm">
                                              {f.guideTeams.map((team, j) => <li key={j}>{team}</li>)}
                                            </ul>
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-sm text-gray-500">No project assignments available</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FacultyListView;
