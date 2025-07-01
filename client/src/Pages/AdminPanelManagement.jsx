import React, { useEffect, useState } from 'react';
import {
  getAllFaculty,
  getAllPanels,
  getAllPanelProjects,
  getAllGuideProjects,
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
  const [facultyList, setFacultyList] = useState([]);
  const [panels, setPanels] = useState([]);
  const [assignedPanels, setAssignedPanels] = useState([]);
  const [selectedPair, setSelectedPair] = useState({ f1: '', f2: '' });
  const [modalTeam, setModalTeam] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState({ type: '', panelIndex: null, teamId: null });
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unassignedTeams, setUnassignedTeams] = useState([]);

  // JWT decode logic omitted for brevity, use your existing getCurrentUser

  const fetchData = async () => {
    try {
      setLoading(true);

      const [facultyRes, panelRes, panelProjectsRes, guideProjectsRes] = await Promise.all([
        getAllFaculty(),
        getAllPanels(),
        getAllPanelProjects(),
        getAllGuideProjects(),
      ]);

      // Faculty
      let facultyData = [];
      if (facultyRes?.data?.success && facultyRes.data.data) {
        facultyData = facultyRes.data.data;
      } else if (facultyRes?.data?.faculties) {
        facultyData = facultyRes.data.faculties;
      } else if (facultyRes?.data && Array.isArray(facultyRes.data)) {
        facultyData = facultyRes.data;
      } else if (facultyRes?.success && facultyRes.data) {
        facultyData = facultyRes.data;
      }
      setFacultyList(facultyData);

      // Panels
      let panelData = [];
      if (panelRes?.data?.success && panelRes.data.data) {
        panelData = panelRes.data.data;
      } else if (panelRes?.data && Array.isArray(panelRes.data)) {
        panelData = panelRes.data;
      } else if (panelRes?.success && panelRes.data) {
        panelData = panelRes.data;
      }
      const panelsFormatted = (panelData || []).map((p) => ({
        facultyIds: [p.faculty1?._id, p.faculty2?._id].filter(Boolean),
        facultyNames: [p.faculty1?.name, p.faculty2?.name].filter(Boolean),
        panelId: p._id,
      }));
      setPanels(panelsFormatted);

      // Assigned panels and teams
      let panelProjectData = [];
      if (panelProjectsRes?.data?.success && panelProjectsRes.data.data) {
        panelProjectData = panelProjectsRes.data.data;
      } else if (panelProjectsRes?.data && Array.isArray(panelProjectsRes.data)) {
        panelProjectData = panelProjectsRes.data;
      } else if (panelProjectsRes?.success && panelProjectsRes.data) {
        panelProjectData = panelProjectsRes.data;
      }
      const assignments = (panelProjectData || []).map((p) => {
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

      // Unassigned teams for manual assignment
      // Get all projects from guides, flatten, deduplicate, then filter out assigned ones
      let guideProjectData = [];
      if (guideProjectsRes?.data?.success && guideProjectsRes.data.data) {
        guideProjectData = guideProjectsRes.data.data;
      } else if (guideProjectsRes?.data && Array.isArray(guideProjectsRes.data)) {
        guideProjectData = guideProjectsRes.data;
      } else if (guideProjectsRes?.success && guideProjectsRes.data) {
        guideProjectData = guideProjectsRes.data;
      }
      const allProjectsFromGuides = (guideProjectData || []).flatMap(guide => guide.projects || []);
      const assignedTeamIds = new Set(assignments.flatMap(p => (p.teams || []).map(t => t.id)));
      const uniqueProjects = allProjectsFromGuides.filter((project, index, self) =>
        index === self.findIndex(p => p._id === project._id)
      );
      const unassigned = uniqueProjects.filter(project => !assignedTeamIds.has(project._id));
      setUnassignedTeams(unassigned);

    } catch (err) {
      setFacultyList([]);
      setPanels([]);
      setAssignedPanels([]);
      setUnassignedTeams([]);
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
    const exists = (panels || []).find(p =>
      (p.facultyIds || []).includes(f1) && (p.facultyIds || []).includes(f2)
    );
    if (exists) return alert('Panel already exists');
    try {
      await createPanelManual({ faculty1Id: f1, faculty2Id: f2 });
      setSelectedPair({ f1: '', f2: '' });
      await fetchData();
      alert('Panel created successfully!');
    } catch {
      alert("Panel creation failed.");
    }
  };

  const handleAutoAssign = async () => {
    try {
      await autoAssignPanelsToProjects();
      await fetchData();
      alert('Auto-assignment completed!');
    } catch {
      alert("Auto assignment failed.");
    }
  };

  const handleAutoCreatePanel = async () => {
    try {
      await autoCreatePanelManual();
      await fetchData();
      alert("Auto Panel Creation completed!");
    } catch {
      alert("Auto Panel Creation failed.");
    }
  };

  const handleManualAssign = async (panelIndex, projectId) => {
    try {
      const panel = (assignedPanels || [])[panelIndex];
      if (!panel) return;
      await assignPanelToProject({ panelId: panel.panelId, projectId });
      await fetchData();
      alert('Team assigned successfully!');
    } catch {
      alert("Assignment failed.");
    }
  };

  const handleConfirmRemove = async () => {
    const { type, panelIndex, teamId } = confirmRemove;
    try {
      if (type === 'panel') {
        const panel = (assignedPanels || [])[panelIndex];
        if (!panel) return;
        await deletePanel(panel.panelId);
        alert('Panel deleted successfully!');
      } else if (type === 'team') {
        await assignPanelToProject({ panelId: null, projectId: teamId });
        alert('Team removed successfully!');
      }
      await fetchData();
    } catch {
      alert("Delete failed.");
    }
    setConfirmRemove({ type: '', panelIndex: null, teamId: null });
  };

  const usedFacultyIds = React.useMemo(() => (
    (panels || []).flatMap(p => p.facultyIds || [])
  ), [panels]);
  const availableFaculty = React.useMemo(() => (
    (facultyList || []).filter(f => !usedFacultyIds.includes(f._id))
  ), [facultyList, usedFacultyIds]);
  const filterMatches = (str) => (
    str && typeof str === 'string' && str.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold font-roboto text-3xl">
                Panel Management
              </h2>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </button>
            </div>

            {/* Only show counts for faculty and panels */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-100 p-4 rounded">
                <div className="text-2xl font-bold text-blue-800">{facultyList.length}</div>
                <div className="text-blue-600">Total Faculty</div>
              </div>
              <div className="bg-green-100 p-4 rounded">
                <div className="text-2xl font-bold text-green-800">{panels.length}</div>
                <div className="text-green-600">Total Panels</div>
              </div>
            </div>

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
                    {f.name} ({f.employeeId})
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
                    {f.name} ({f.employeeId})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddPanel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                disabled={!selectedPair.f1 || !selectedPair.f2}
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
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
              >
                Auto Assign
              </button>
            </div>

            {assignedPanels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No panels found. Create panels to get started.
              </div>
            ) : (
              (assignedPanels || []).map((panel, idx) => {
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
                        <span className="text-sm text-gray-500 ml-2">
                          ({(panel.teams || []).length} teams)
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setConfirmRemove({ type: "panel", panelIndex: idx })
                        }
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Remove Panel
                      </button>
                    </div>
                    {expandedPanel === idx && (
                      <>
                        <div className="grid grid-cols-1 gap-3 mt-3">
                          {(panel.teams || []).length === 0 ? (
                            <div className="text-gray-500 text-center py-4">
                              No teams assigned to this panel
                            </div>
                          ) : (
                            (panel.teams || []).map((team) => (
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
                                  <p className="text-xs text-gray-500">
                                    Members: {(team.members || []).join(", ")}
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
                            ))
                          )}
                        </div>

                        {/* --- FIXED: Manual assignment dropdown always visible if unassigned teams exist --- */}
                        {unassignedTeams.length > 0 && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium mb-1">
                              Assign Team ({unassignedTeams.length} available):
                            </label>
                            <select
                              onChange={e => {
                                if (e.target.value) {
                                  handleManualAssign(idx, e.target.value);
                                  e.target.value = ""; // reset dropdown after assignment
                                }
                              }}
                              className="border p-1 rounded"
                              defaultValue=""
                            >
                              <option value="">Select Team</option>
                              {unassignedTeams.map((t) => (
                                <option key={t._id} value={t._id}>
                                  {t.name} ({t.domain})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {/* --- END FIX --- */}
                      </>
                    )}
                  </div>
                );
              })
            )}

            <TeamPopup team={modalTeam} onClose={() => setModalTeam(null)} />
            <ConfirmPopup
              isOpen={!!confirmRemove.type}
              onClose={() =>
                setConfirmRemove({ type: "", panelIndex: null, teamId: null })
              }
              onConfirm={handleConfirmRemove}
              type={confirmRemove.type}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanelManagement;
