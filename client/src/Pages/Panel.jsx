import React, { useState, useEffect } from 'react';
import PopupReview from '../components/PopupReview';

import ReviewTable from '../components/ReviewTable';
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

  const isDeadlinePassed = (reviewType) => {
    if (!deadlines || !deadlines[reviewType]) {
      console.log(`No deadline found for ${reviewType}`);
      return false;
    }
    
    const now = new Date();
    const deadline = deadlines[reviewType];
    
    console.log(`=== PANEL DEADLINE CHECK FOR ${reviewType} ===`);
    console.log('Current time:', now.toISOString());
    console.log('Deadline object:', deadline);
    
    if (deadline.from && deadline.to) {
      const fromDate = new Date(deadline.from);
      const toDate = new Date(deadline.to);
      console.log('From date:', fromDate.toISOString());
      console.log('To date:', toDate.toISOString());
      
      const isPassed = now < fromDate || now > toDate;
      console.log(`Panel ${reviewType} deadline passed:`, isPassed);
      return isPassed;
    } else if (typeof deadline === 'string') {
      const deadlineDate = new Date(deadline);
      console.log('Deadline date:', deadlineDate.toISOString());
      const isPassed = now > deadlineDate;
      console.log(`Panel ${reviewType} deadline passed:`, isPassed);
      return isPassed;
    }
    
    return false;
  };

  const isReviewLocked = (student, reviewType) => {
    const studentReview = student[reviewType];
    if (studentReview?.locked) {
      console.log(`Panel student ${student.name} ${reviewType} is manually locked`);
      return true;
    }
    
    const deadlinePassed = isDeadlinePassed(reviewType);
    console.log(`Panel student ${student.name} ${reviewType} locked due to deadline:`, deadlinePassed);
    return deadlinePassed;
  };

  // FIX: Updated getTeamRequestStatus - check pending FIRST
  const getTeamRequestStatus = (team, reviewType) => {
    console.log(`=== GETTING PANEL TEAM REQUEST STATUS FOR ${reviewType} ===`);
    
    const statuses = team.students.map(student => {
      const requestKey = `${student.regNo}_${reviewType}`;
      const status = requestStatuses[requestKey]?.status || 'none';
      console.log(`Panel student ${student.name} ${reviewType} status:`, status);
      return status;
    });
    
    // FIX: Check for pending FIRST, before deadline override
    if (statuses.includes('pending')) {
      console.log(`Panel team ${reviewType} status: pending`);
      return 'pending';
    }
    
    // FIX: Only override to 'none' if deadline passed AND no pending requests
    if (isDeadlinePassed(reviewType)) {
      console.log(`Deadline passed for ${reviewType} - overriding non-pending status to 'none'`);
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
          comments: studentReviewData.comments
        };

        // FIX: Add review1 support
        if (reviewType === 'review1') {
          updateData.review1 = {
            component1: studentReviewData.component1 || null,
            component2: studentReviewData.component2 || null,
            component3: studentReviewData.component3 || null,
            locked: studentReviewData.locked || false
          };
          if (studentReviewData.attendance) {
            updateData.attendance = studentReviewData.attendance;
          }
          if (pptObj && pptObj.pptApproved) {
            updateData.pptApproved = pptObj.pptApproved;
          }
        } else if (reviewType === 'review2') {
          updateData.review2 = {
            component1: studentReviewData.component1 || null,
            component2: studentReviewData.component2 || null,
            component3: studentReviewData.component3 || null,
            locked: studentReviewData.locked || false
          };
          if (studentReviewData.attendance) {
            updateData.attendance = studentReviewData.attendance;
          }
          if (pptObj && pptObj.pptApproved) {
            updateData.pptApproved = pptObj.pptApproved;
          }
        } else if (reviewType === 'review3') {
          updateData.review3 = {
            component1: studentReviewData.component1 || null,
            component2: studentReviewData.component2 || null,
            component3: studentReviewData.component3 || null,
            locked: studentReviewData.locked || false
          };
          if (studentReviewData.attendance) {
            updateData.attendance = studentReviewData.attendance;
          }
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

      // FIX: Add review1 PPT support
      if (['review1', 'review2', 'review3'].includes(reviewType) && pptObj) {
        updatePayload.pptApproved = pptObj.pptApproved;
      }

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
      
      const requestData = {
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
                        {/* FIX: Add missing review1 button */}
                        <button
                          onClick={() => setActivePopup({ type: 'review1', teamId: team.id })}
                          className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Guide Review
                        </button>
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
                          Final Review
                        </button>
                      </div>
                    </div>
                    {expandedTeam === team.id && (
                      <ReviewTable 
                        team={team} 
                        deadlines={deadlines}
                        requestStatuses={requestStatuses}
                        isDeadlinePassed={isDeadlinePassed}
                        isReviewLocked={isReviewLocked}
                        panelMode={true}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FIX: Add missing review1 popup handler */}
          {activePopup?.type === 'review1' && (
            <PopupReview
              title="Guide Review"
              teamMembers={teams.find(t => t.id === activePopup.teamId).students}
              reviewType="review1"
              pptApproved={{
                approved: (() => {
                  const team = teams.find(t => t.id === activePopup.teamId);
                  return team.students.length > 0 && 
                    team.students.every(student => student.pptApproved?.approved === true);
                })(),
                locked: false
              }}
              isOpen={true}
              locked={teams.find(t => t.id === activePopup.teamId).students.some(student => 
                isReviewLocked(student, 'review1')
              )}
              onClose={() => setActivePopup(null)}
              onSubmit={(data, pptObj) => {
                handleReviewSubmit(activePopup.teamId, 'review1', data, pptObj);
                setActivePopup(null);
              }}
              onRequestEdit={() => handleRequestEdit(activePopup.teamId, 'review1')}
              requestEditVisible={(() => {
                const team = teams.find(t => t.id === activePopup.teamId);
                const isLocked = team.students.some(student => isReviewLocked(student, 'review1'));
                const requestStatus = getTeamRequestStatus(team, 'review1');
                return isLocked && requestStatus === 'none';
              })()}
              requestPending={getTeamRequestStatus(teams.find(t => t.id === activePopup.teamId), 'review1') === 'pending'}
            />
          )}

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
              locked={teams.find(t => t.id === activePopup.teamId).students.some(student => 
                isReviewLocked(student, 'review2')
              )}
              onClose={() => setActivePopup(null)}
              onSubmit={(data, pptObj) => {
                handleReviewSubmit(activePopup.teamId, 'review2', data, pptObj);
                setActivePopup(null);
              }}
              onRequestEdit={() => handleRequestEdit(activePopup.teamId, 'review2')}
              requestEditVisible={(() => {
                const team = teams.find(t => t.id === activePopup.teamId);
                const isLocked = team.students.some(student => isReviewLocked(student, 'review2'));
                const requestStatus = getTeamRequestStatus(team, 'review2');
                console.log('Panel review2 - isLocked:', isLocked, 'requestStatus:', requestStatus);
                return isLocked && requestStatus === 'none';
              })()}
              requestPending={getTeamRequestStatus(teams.find(t => t.id === activePopup.teamId), 'review2') === 'pending'}
            />
          )}

          {activePopup?.type === 'review3' && (
            <PopupReview
              title="Final Review"
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
              locked={teams.find(t => t.id === activePopup.teamId).students.some(student => 
                isReviewLocked(student, 'review3')
              )}
              onClose={() => setActivePopup(null)}
              onSubmit={(data, pptObj) => {
                handleReviewSubmit(activePopup.teamId, 'review3', data, pptObj);
                setActivePopup(null);
              }}
              onRequestEdit={() => handleRequestEdit(activePopup.teamId, 'review3')}
              requestEditVisible={(() => {
                const team = teams.find(t => t.id === activePopup.teamId);
                const isLocked = team.students.some(student => isReviewLocked(student, 'review3'));
                const requestStatus = getTeamRequestStatus(team, 'review3');
                console.log('Panel review3 - isLocked:', isLocked, 'requestStatus:', requestStatus);
                return isLocked && requestStatus === 'none';
              })()}
              requestPending={getTeamRequestStatus(teams.find(t => t.id === activePopup.teamId), 'review3') === 'pending'}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Panel;
