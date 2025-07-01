import React, { useState, useEffect } from 'react';
import PopupReview from '../Components/PopupReview';
import ReviewTable from '../Components/ReviewTable';
import Navbar from '../Components/UniversalNavbar';
import { ChevronRight } from 'lucide-react';
import { 
  getPanelProjects,
  getDefaultDeadline, 
  updateProject,
  createReviewRequest,
  checkRequestStatus,
  checkAllRequestStatuses
} from '../api';

const Panel = () => {
  const [teams, setTeams] = useState([]);
  const [deadlines, setDeadlines] = useState({});
  const [activePopup, setActivePopup] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestStatuses, setRequestStatuses] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('=== PANEL FETCH DATA STARTED ===');
      
      const [projectsRes, deadlinesRes] = await Promise.all([
        getPanelProjects(),
        getDefaultDeadline()
      ]);

      if (projectsRes.data.success) {
        const projects = projectsRes.data.data;
        console.log('Raw panel projects from backend:', projects);
        
        // DEBUG: Check deadline structure
        projects.forEach(project => {
          console.log(`Project ${project.name} students:`, project.students);
          
          project.students?.forEach(student => {
            console.log(`Student ${student.name} deadline structure:`, student.deadline);
          });
        });
        
        const mappedTeams = projects.map(project => {
          return {
            id: project._id,
            title: project.name,
            description: `Panel: ${[project.panel?.faculty1?.name, project.panel?.faculty2?.name].filter(Boolean).join(', ') || 'N/A'}`,
            students: project.students || [],
            pptApproved: project.pptApproved || { approved: false, locked: false },
            panel: project.panel
          };
        });
        
        console.log('Mapped panel teams:', mappedTeams);
        setTeams(mappedTeams);
        
        if (mappedTeams.length > 0) {
          const statuses = await checkAllRequestStatuses(mappedTeams);
          setRequestStatuses(statuses);
        }
      }

      if (deadlinesRes.data) {
        const deadlineData = deadlinesRes.data.data || deadlinesRes.data.defaultDeadline || {};
        console.log('=== PANEL DEADLINES FETCHED ===');
        console.log('Complete deadline data:', deadlineData);
        setDeadlines(deadlineData);
      }
      
      console.log('=== PANEL FETCH DATA COMPLETED ===');
    } catch (error) {
      console.error('Error fetching panel data:', error);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Team-level deadline checking using nested deadline structure (like Guide)
  const isTeamDeadlinePassed = (reviewType, teamId) => {
    console.log(`=== PANEL TEAM DEADLINE CHECK FOR ${reviewType} ===`);
    
    const team = teams.find(t => t.id === teamId);
    if (!team) return false;
    
    // Check if ANY student in the team has an individual deadline override
    const hasIndividualOverride = team.students.some(student => 
      student.deadline && student.deadline[reviewType]
    );
    
    if (hasIndividualOverride) {
      // If any student has individual override, use the LATEST deadline from all students
      const studentDeadlines = team.students
        .filter(student => student.deadline && student.deadline[reviewType])
        .map(student => new Date(student.deadline[reviewType].to));
      
      if (studentDeadlines.length > 0) {
        const latestDeadline = new Date(Math.max(...studentDeadlines));
        const now = new Date();
        
        console.log(`Panel team has individual overrides. Latest deadline:`, latestDeadline.toISOString());
        console.log('Current time:', now.toISOString());
        
        const isPassed = now > latestDeadline;
        console.log(`✅ Panel team ${reviewType} deadline passed:`, isPassed);
        return isPassed;
      }
    }
    
    // Fall back to system default deadlines
    if (!deadlines || !deadlines[reviewType]) {
      console.log(`No deadline found for ${reviewType}`);
      return false;
    }
    
    const now = new Date();
    const deadline = deadlines[reviewType];
    
    console.log(`Panel system deadline for ${reviewType}:`, deadline);
    console.log('Current time:', now.toISOString());
    
    if (deadline.from && deadline.to) {
      const fromDate = new Date(deadline.from);
      const toDate = new Date(deadline.to);
      console.log('From date:', fromDate.toISOString());
      console.log('To date:', toDate.toISOString());
      
      const isPassed = now < fromDate || now > toDate;
      console.log(`✅ Panel system ${reviewType} deadline passed:`, isPassed);
      return isPassed;
    }
    
    return false;
  };

  const isReviewLocked = (student, reviewType, teamId) => {
    // Check manual lock first
    const studentReview = student[reviewType];
    if (studentReview?.locked) {
      console.log(`Panel student ${student.name} ${reviewType} is manually locked`);
      return true;
    }
    
    // Check team-level deadline
    const teamDeadlinePassed = isTeamDeadlinePassed(reviewType, teamId);
    console.log(`Panel team ${reviewType} deadline passed:`, teamDeadlinePassed);
    return teamDeadlinePassed;
  };

  const getTeamRequestStatus = (team, reviewType) => {
    console.log(`=== GETTING PANEL TEAM REQUEST STATUS FOR ${reviewType} ===`);
    
    const statuses = team.students.map(student => {
      const requestKey = `${student.regNo}_${reviewType}`;
      const status = requestStatuses[requestKey]?.status || 'none';
      console.log(`Panel student ${student.name} ${reviewType} status:`, status);
      return status;
    });
    
    // Check for pending FIRST
    if (statuses.includes('pending')) {
      console.log(`Panel team ${reviewType} status: pending`);
      return 'pending';
    }
    
    // Check if team deadline passed
    if (isTeamDeadlinePassed(reviewType, team.id)) {
      console.log(`Panel team deadline passed for ${reviewType} - status: none`);
      return 'none';
    }
    
    if (statuses.includes('approved')) {
      console.log(`Panel team ${reviewType} status: approved`);
      return 'approved';
    }
    
    console.log(`Panel team ${reviewType} status: none`);
    return 'none';
  };

  const handleReviewSubmit = async (teamId, reviewType, reviewData, pptObj) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      console.log('=== PANEL REVIEW SUBMIT STARTED ===');
      console.log('Team ID:', teamId);
      console.log('Review type:', reviewType);
      console.log('PPT Object received:', pptObj);

      const studentUpdates = team.students.map(student => {
        const studentReviewData = reviewData[student.regNo] || {};
        
        const updateData = {
          studentId: student._id,
        };

        // FIXED: Updated to match new schema with attendance inside each review + COMMENTS
        if (reviewType === 'review2') {
          updateData.review2 = {
            component1: studentReviewData.component1 || null,
            component2: studentReviewData.component2 || null,
            component3: studentReviewData.component3 || null,
            attendance: {
              value: studentReviewData.attendance?.value || false,
              locked: studentReviewData.attendance?.locked || false
            },
            comments: studentReviewData.comments || '', // ADDED: Comments
            locked: studentReviewData.locked || false
          };
          if (pptObj && pptObj.pptApproved) {
            updateData.pptApproved = pptObj.pptApproved;
          }
        } else if (reviewType === 'review3') {
          updateData.review3 = {
            component1: studentReviewData.component1 || null,
            component2: studentReviewData.component2 || null,
            component3: studentReviewData.component3 || null,
            attendance: {
              value: studentReviewData.attendance?.value || false,
              locked: studentReviewData.attendance?.locked || false
            },
            comments: studentReviewData.comments || '', // ADDED: Comments
            locked: studentReviewData.locked || false
          };
          if (pptObj && pptObj.pptApproved) {
            updateData.pptApproved = pptObj.pptApproved;
          }
        } else if (reviewType === 'review4') {
          updateData.review4 = {
            component1: studentReviewData.component1 || null,
            component2: studentReviewData.component2 || null,
            component3: studentReviewData.component3 || null,
            attendance: {
              value: studentReviewData.attendance?.value || false,
              locked: studentReviewData.attendance?.locked || false
            },
            comments: studentReviewData.comments || '', // ADDED: Comments
            locked: studentReviewData.locked || false
          };
          if (pptObj && pptObj.pptApproved) {
            updateData.pptApproved = pptObj.pptApproved;
          }
        }

        return updateData;
      });

      const updatePayload = {
        projectId: teamId,
        studentUpdates
      };

      if (['review2', 'review3', 'review4'].includes(reviewType) && pptObj) {
        updatePayload.pptApproved = pptObj.pptApproved;
      }

      console.log('Final panel update payload:', JSON.stringify(updatePayload, null, 2));

      const response = await updateProject(updatePayload);
      
      if (response.data) {
        setTimeout(async () => {
          await fetchData();
          alert('Panel review submitted successfully!');
        }, 1000);
      }
    } catch (error) {
      console.error('Error submitting panel review:', error);
      alert('Error submitting panel review. Please try again.');
    }
  };

  const handleRequestEdit = async (teamId, reviewType) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      
      const reason = prompt('Please enter the reason for requesting edit access:', 'Need to correct marks after deadline');
      if (!reason?.trim()) return;
      
      const currentUser = JSON.parse(localStorage.getItem('faculty') || '{}');
      
      const requestData = {
        employeeId: currentUser.employeeId || 'CURRENT_USER',
        regNo: team.students[0].regNo,
        reviewType: reviewType,
        reason: reason.trim()
      };
      
      const response = await createReviewRequest('panel', requestData);
      
      if (response.success) {
        alert('Edit request submitted successfully!');
        const statuses = await checkAllRequestStatuses(teams);
        setRequestStatuses(statuses);
      } else {
        alert(response.message || 'Error submitting request');
      }
    } catch (error) {
      console.error('Error submitting panel request:', error);
      alert('Error submitting panel request. Please try again.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar userType="faculty" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userType="faculty" />
      <div className='min-h-screen bg-gray-50 overflow-x-hidden'>
        <div className='p-24 items-center'>
          <div className="bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-black pl-5 mt-2">Panel Review</h2>
            </div>
            
            {teams.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No projects assigned as panel
              </div>
            ) : (
              teams.map(team => (
                <div key={team.id} className="bg-white rounded-lg shadow-sm mb-4">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                            className="flex items-center"
                          >
                            <span className={`inline-block transition-transform duration-200 ${
                              expandedTeam === team.id ? 'rotate-90' : ''
                            }`}>
                              <ChevronRight />
                            </span>
                            <span className="font-medium text-black">{team.title}</span>
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 ml-6">{team.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActivePopup({ type: 'review2', teamId: team.id })}
                          className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                        >
                          Panel Review 1
                        </button>
                        <button
                          onClick={() => setActivePopup({ type: 'review3', teamId: team.id })}
                          className="px-4 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
                        >
                          Panel Review 2
                        </button>
                        <button
                          onClick={() => setActivePopup({ type: 'review4', teamId: team.id })}
                          className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                        >
                          Final Review
                        </button>
                      </div>
                    </div>
                    {expandedTeam === team.id && (
                      <ReviewTable 
                        team={team} 
                        deadlines={deadlines}
                        requestStatuses={requestStatuses}
                        isDeadlinePassed={(reviewType) => isTeamDeadlinePassed(reviewType, team.id)}
                        isReviewLocked={(student, reviewType) => isReviewLocked(student, reviewType, team.id)}
                        panelMode={true}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panel Review 1 (review2) */}
          {activePopup?.type === 'review2' && (
            <PopupReview
              title="Panel Review 1"
              teamMembers={teams.find(t => t.id === activePopup.teamId).students}
              reviewType="review2"
              pptApproved={{
                approved: (() => {
                  const team = teams.find(t => t.id === activePopup.teamId);
                  return team.students.length > 0 && 
                    team.students.every(student => student.pptApproved?.approved === true);
                })(),
                locked: false
              }}
              isOpen={true}
              locked={isTeamDeadlinePassed('review2', activePopup.teamId)}
              onClose={() => setActivePopup(null)}
              onSubmit={(data, pptObj) => {
                handleReviewSubmit(activePopup.teamId, 'review2', data, pptObj);
                setActivePopup(null);
              }}
              onRequestEdit={() => handleRequestEdit(activePopup.teamId, 'review2')}
              requestEditVisible={(() => {
                const team = teams.find(t => t.id === activePopup.teamId);
                const isLocked = isTeamDeadlinePassed('review2', activePopup.teamId);
                const requestStatus = getTeamRequestStatus(team, 'review2');
                return isLocked && requestStatus === 'none';
              })()}
              requestPending={getTeamRequestStatus(teams.find(t => t.id === activePopup.teamId), 'review2') === 'pending'}
            />
          )}

          {/* Panel Review 2 (review3) */}
          {activePopup?.type === 'review3' && (
            <PopupReview
              title="Panel Review 2"
              teamMembers={teams.find(t => t.id === activePopup.teamId).students}
              reviewType="review3"
              pptApproved={{
                approved: (() => {
                  const team = teams.find(t => t.id === activePopup.teamId);
                  return team.students.length > 0 && 
                    team.students.every(student => student.pptApproved?.approved === true);
                })(),
                locked: false
              }}
              isOpen={true}
              locked={isTeamDeadlinePassed('review3', activePopup.teamId)}
              onClose={() => setActivePopup(null)}
              onSubmit={(data, pptObj) => {
                handleReviewSubmit(activePopup.teamId, 'review3', data, pptObj);
                setActivePopup(null);
              }}
              onRequestEdit={() => handleRequestEdit(activePopup.teamId, 'review3')}
              requestEditVisible={(() => {
                const team = teams.find(t => t.id === activePopup.teamId);
                const isLocked = isTeamDeadlinePassed('review3', activePopup.teamId);
                const requestStatus = getTeamRequestStatus(team, 'review3');
                return isLocked && requestStatus === 'none';
              })()}
              requestPending={getTeamRequestStatus(teams.find(t => t.id === activePopup.teamId), 'review3') === 'pending'}
            />
          )}

          {/* Final Review (review4) */}
          {activePopup?.type === 'review4' && (
            <PopupReview
              title="Final Review"
              teamMembers={teams.find(t => t.id === activePopup.teamId).students}
              reviewType="review4"
              pptApproved={{
                approved: (() => {
                  const team = teams.find(t => t.id === activePopup.teamId);
                  return team.students.length > 0 && 
                    team.students.every(student => student.pptApproved?.approved === true);
                })(),
                locked: false
              }}
              isOpen={true}
              locked={isTeamDeadlinePassed('review4', activePopup.teamId)}
              onClose={() => setActivePopup(null)}
              onSubmit={(data, pptObj) => {
                handleReviewSubmit(activePopup.teamId, 'review4', data, pptObj);
                setActivePopup(null);
              }}
              onRequestEdit={() => handleRequestEdit(activePopup.teamId, 'review4')}
              requestEditVisible={(() => {
                const team = teams.find(t => t.id === activePopup.teamId);
                const isLocked = isTeamDeadlinePassed('review4', activePopup.teamId);
                const requestStatus = getTeamRequestStatus(team, 'review4');
                return isLocked && requestStatus === 'none';
              })()}
              requestPending={getTeamRequestStatus(teams.find(t => t.id === activePopup.teamId), 'review4') === 'pending'}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Panel;
