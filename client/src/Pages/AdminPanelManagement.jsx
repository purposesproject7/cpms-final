import React, { useEffect, useState } from 'react';
import {
  getAllFaculty,
  getAllPanels,
  getAllPanelProjects,
  createPanelManual,
  deletePanel,
  assignPanelToProject,
  autoAssignPanelsToProjects,
  autoCreatePanelManual,
} from "../api";
import TeamPopup from '../Components/TeamPopup';
import ConfirmPopup from '../Components/ConfirmDialog';
import Navbar from '../Components/UniversalNavbar';
import { ChevronRight, ChevronDown } from 'lucide-react';  

const AdminPanelManagement = () => {
  // Initialize all arrays to empty arrays to prevent undefined errors
  const [facultyList, setFacultyList] = useState([]);
  const [teams, setTeams] = useState([]);
  const [panels, setPanels] = useState([]);
  const [assignedPanels, setAssignedPanels] = useState([]);
  const [selectedPair, setSelectedPair] = useState({ f1: '', f2: '' });
  const [modalTeam, setModalTeam] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState({ type: '', panelIndex: null, teamId: null });
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facultyRes, panelRes, panelProjectsRes] = await Promise.all([
        getAllFaculty(),
        getAllPanels(),
        getAllPanelProjects(),
      ]);

      // Safely set faculty list with fallback
      setFacultyList(facultyRes?.data?.faculties || []);

      // Safely format panels with fallback
      const panelsFormatted = (panelRes?.data?.data || []).map((p) => ({
        facultyIds: [p.faculty1?._id, p.faculty2?._id].filter(Boolean),
        facultyNames: [p.faculty1?.name, p.faculty2?.name].filter(Boolean),
        panelId: p._id,
      }));
      setPanels(panelsFormatted);

      // Safely format assignments with fallback
      const assignments = (panelProjectsRes?.data?.data || []).map((p) => {
        const teams = (p.projects || []).map((project) => ({
          id: project._id,
          name: project.name,
          domain: project.domain || "N/A",
          members: (project.students || []).map((s) => s.name || s.regNo),
          assignedPanelId: p.panelId,
          full: project,
        }));

        return {
          facultyIds: [p.faculty1?._id, p.faculty2?._id].filter(Boolean),
          facultyNames: [p.faculty1?.name, p.faculty2?.name].filter(Boolean),
          panelId: p.panelId,
          teams,
        };
      });

      setAssignedPanels(assignments);

      // Flatten all teams from assignments to build the full team list
      const allTeams = assignments.flatMap((a) => a.teams || []);
      setTeams(allTeams);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      alert("Error fetching data. Open console to see details.");
      // Set empty arrays on error to prevent undefined errors
      setFacultyList([]);
      setPanels([]);
      setAssignedPanels([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPanel = async () => {
    const { f1, f2 } = selectedPair;
    if (!f1 || !f2 || f1 === f2) return alert('Select two different faculty members');
    
    // Use safe array access
    const exists = (panels || []).find(p => 
      (p.facultyIds || []).includes(f1) && (p.facultyIds || []).includes(f2)
    );
    if (exists) return alert('Panel already exists');

    try {
      await createPanelManual({ faculty1Id: f1, faculty2Id: f2 });
      setSelectedPair({ f1: '', f2: '' });
      fetchData();
    } catch (err) {
      alert("Panel creation failed.");
    }
  };

  const handleAutoAssign = async () => {
    try {
      await autoAssignPanelsToProjects();
      await fetchData();
      alert('Auto-assignment completed!');
    } catch (err) {
      console.error("Auto assignment failed:", err);
      alert("Auto assignment failed.");
    }
  };

  const handleAutoCreatePanel = async () => {
    try {
      await autoCreatePanelManual();
      await fetchData();
      alert("Auto Panel Creation completed!");
    } catch (err) {
      console.error("Auto Panel Creation failed:", err);
      alert("Auto Panel Creation failed.");
    }
  };

  const handleManualAssign = async (panelIndex, projectId) => {
    try {
      const panel = (assignedPanels || [])[panelIndex];
      if (!panel) return;
      
      await assignPanelToProject({ panelId: panel.panelId, projectId });
      fetchData();
    } catch (err) {
      alert("Assignment failed.");
    }
  };

  const handleConfirmRemove = async () => {
    const { type, panelIndex, teamId } = confirmRemove;
    const panel = (assignedPanels || [])[panelIndex];

    if (!panel) return;

    try {
      if (type === 'panel') {
        await deletePanel(panel.panelId);
      } else if (type === 'team') {
        await assignPanelToProject({ panelId: null, projectId: teamId });
      }
      fetchData();
    } catch (err) {
      alert("Delete failed.");
    }

    setConfirmRemove({ type: '', panelIndex: null, teamId: null });
  };

  // Safe filtering with fallbacks
  const usedFacultyIds = (panels || []).flatMap(p => p.facultyIds || []);
  const availableFaculty = (facultyList || []).filter(f => !usedFacultyIds.includes(f._id));
  const assignedTeamIds = new Set((assignedPanels || []).flatMap(p => (p.teams || []).map(t => t.id)));
  const unassignedTeams = (teams || []).filter(t => !assignedTeamIds.has(t.id));
  
  const filterMatches = (str) => {
    if (!str || typeof str !== 'string') return false;
    return str.toLowerCase().includes(searchQuery.toLowerCase());
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <div className="p-20 pl-28">
          <div className="shadow-md rounded-lg bg-white p-10">
            <h2 className="font-semibold mb-4 font-roboto text-3xl">
              Panel Management
            </h2>
            <input
              type="text"
              placeholder="Search teams, faculty, domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border px-3 py-2 rounded w-full mb-4"
            />

            <div className="mb-4 flex flex-wrap gap-4 items-center">
              <select
                value={selectedPair.f1}
                onChange={(e) =>
                  setSelectedPair({ ...selectedPair, f1: e.target.value })
                }
                className="border p-2 rounded"
              >
                <option value="">Select Faculty 1</option>
                {availableFaculty.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedPair.f2}
                onChange={(e) =>
                  setSelectedPair({ ...selectedPair, f2: e.target.value })
                }
                className="border p-2 rounded"
              >
                <option value="">Select Faculty 2</option>
                {availableFaculty.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddPanel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Add Panel
              </button>
              <button
                onClick={handleAutoCreatePanel}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Auto Create Panel
              </button>
              <button
                onClick={handleAutoAssign}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Auto Assign
              </button>
            </div>

            {(assignedPanels || []).map((panel, idx) => {
              const shouldShow =
                !searchQuery ||
                (panel.facultyNames || []).some((name) => filterMatches(name)) ||
                (panel.teams || []).some(
                  (team) =>
                    filterMatches(team.name) || filterMatches(team.domain)
                );

              if (!shouldShow) return null;

              return (
                <div
                  key={panel.panelId}
                  className="border rounded p-4 mb-4 cursor-pointer bg-gray-100 hover:bg-gray-200 transition"
                >
                  <div className="flex justify-between items-center">
                    <div
                      onClick={() =>
                        setExpandedPanel(expandedPanel === idx ? null : idx)
                      }
                      className="flex items-center gap-2 font-bold text-lg cursor-pointer"
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6">
                        {expandedPanel === idx ? (
                          <ChevronDown className="text-gray-700" />
                        ) : (
                          <ChevronRight className="text-gray-700" />
                        )}
                      </span>
                      Panel {idx + 1}: {(panel.facultyNames || []).join(" & ")}
                    </div>
                    <button
                      onClick={() =>
                        setConfirmRemove({ type: "panel", panelIndex: idx })
                      }
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Remove Panel
                    </button>
                  </div>

                  {expandedPanel === idx && (
                    <>
                      <div className="grid grid-cols-1 gap-3 mt-3">
                        {(panel.teams || []).map((team) => (
                          <div
                            key={team.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow border"
                          >
                            <div>
                              <h4
                                onClick={() => setModalTeam(team.full)}
                                className="font-semibold text-blue-700 cursor-pointer hover:underline"
                              >
                                {team.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                ID: {team.id} • Domain:{" "}
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                  {team.domain}
                                </span>
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setConfirmRemove({
                                  type: "team",
                                  panelIndex: idx,
                                  teamId: team.id,
                                })
                              }
                              className="text-red-600 text-sm hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      {unassignedTeams.length > 0 && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-1">
                            Assign Team:
                          </label>
                          <select
                            onChange={(e) =>
                              handleManualAssign(idx, e.target.value)
                            }
                            className="border p-1 rounded"
                          >
                            <option value="">Select Team</option>
                            {unassignedTeams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            <TeamPopup team={modalTeam} onClose={() => setModalTeam(null)} />
            <ConfirmPopup
              isOpen={!!confirmRemove.type}
              onClose={() =>
                setConfirmRemove({ type: "", panelIndex: null, teamId: null })
              }
              onConfirm={handleConfirmRemove}
              type={confirmRemove.type}
            />

            {showDebug && (
              <div className="mt-10 p-4 border border-gray-300 rounded bg-gray-50">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">
                  🛠 Debug Info
                </h3>

                <details open className="mb-3">
                  <summary className="cursor-pointer font-medium text-blue-700">
                    📋 All Panels (Raw)
                  </summary>
                  <pre className="text-sm bg-white p-2 mt-1 rounded overflow-x-auto">
                    {JSON.stringify(panels, null, 2)}
                  </pre>
                </details>

                <details className="mb-3">
                  <summary className="cursor-pointer font-medium text-green-700">
                    📦 Panel Assignments
                  </summary>
                  <pre className="text-sm bg-white p-2 mt-1 rounded overflow-x-auto">
                    {JSON.stringify(assignedPanels, null, 2)}
                  </pre>
                </details>

                <details className="mb-3">
                  <summary className="cursor-pointer font-medium text-purple-700">
                    🔍 Unassigned Teams
                  </summary>
                  <pre className="text-sm bg-white p-2 mt-1 rounded overflow-x-auto">
                    {JSON.stringify(unassignedTeams, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanelManagement;
