// FacultyListView.jsx - View Details as Expandable Row with Notification Bell
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import Navbar from "../Components/UniversalNavbar"

const downloadCSV = (facultyList) => {
  const headers = ['Faculty Name', 'Employee ID'];
  const rows = facultyList.map(f => [f.name, f.empId]);
  let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');
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

  useEffect(() => {

      
  /*
  fetch('/api/faculty/list') 
    .then(res => res.json())
    .then(data => setFacultyList(data))
    .catch(err => console.error("Failed to fetch faculty list", err));
  */
    const dummyData = [
      { name: 'Dr. Sandeep', empId: 'EMP001', panelTeams: ['T1', 'T3'], guideTeams: ['T4'] },
      { name: 'Prof. Kavitha', empId: 'EMP002', panelTeams: ['T2'], guideTeams: ['T5', 'T6'] }
    ];
    setFacultyList(dummyData);
  }, []);
  // Replace notifications array with:
 /*
  fetch('/api/notifications') 
    .then(res => res.json())
    .then(data => setNotifications(data));
 */

  const notifications = [
    { id: 1, teacher: 'Dr. Sandeep', reason: 'Edit panel mark for T1' },
    { id: 2, teacher: 'Prof. Kavitha', reason: 'Correction in final grade for T5' }
  ];

  const filteredList = facultyList.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const toggleDetails = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <>
    <Navbar />
    <div className='min-h-screen bg-gray-50 overflow-x-hidden' >
    <div className="p-20 pl-28">
    <div className=' shadow-md rounded-lg bg-white p-10 ' >
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold mb-4 font-roboto text-3xl">Faculty List</h3>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded shadow"
          />
          <button
            onClick={() => downloadCSV(filteredList)}
            className="bg-blue-600 hover:bg-blue-700 hover:transition hover:ease-in-out hover:delay-150 hover:scale-110 text-white px-4 py-2 rounded"
          >
            Download CSV
          </button>
          {/* <button
            onClick={() => setShowNotif(!showNotif)}
            className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button> */}
        </div>
      </div>

      {/* <AnimatePresence>
        {showNotif && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-20 bg-white border rounded shadow-lg w-96 z-10 p-4"
          >
            <h4 className="text-lg font-semibold mb-2">Pending Requests</h4>
            {notifications.map(n => (
              <div key={n.id} className="border-b py-2">
                <p><strong>{n.teacher}</strong> — {n.reason}</p>
                <div className="flex gap-2 mt-2">
                  <button className="bg-green-600 hover:bg-green-400 text-white px-2 py-1 rounded text-sm">Approve</button>
                  <button className="bg-red-600 hover:bg-red-400 text-white px-2 py-1 rounded text-sm">Deny</button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence> */}

      <table className="w-full border text-left mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Employee ID</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredList.map((f, i) => (
            <React.Fragment key={i}>
              <tr>
                <td className="p-2 border">{f.name}</td>
                <td className="p-2 border">{f.empId}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => toggleDetails(i)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded hover:transition hover:ease-in-out hover:delay-150 hover:scale-110 "
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
                    <td colSpan="3" className="p-4">
                      <p className="font-semibold">Panel Teams:</p>
                      <ul className="list-disc ml-6 mb-2">
                        {f.panelTeams.map((team, j) => <li key={j}>{team}</li>)}
                      </ul>
                      <p className="font-semibold">Guide Teams:</p>
                      <ul className="list-disc ml-6">
                        {f.guideTeams.map((team, j) => <li key={j}>{team}</li>)}
                      </ul>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
    </div>
    </div>
    </div>
    </>
  );
};

export default FacultyListView;