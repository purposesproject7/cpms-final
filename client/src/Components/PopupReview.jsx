import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const componentLabels = {
  review0: [{ key: 'component1', label: 'Marks (out of 10)' }],
  draftReview: [
    { key: 'component1', label: 'Component 1 (out of 10)' },
    { key: 'component2', label: 'Component 2 (out of 10)' },
    { key: 'component3', label: 'Component 3 (out of 10)' },
  ],
  review1: [
    { key: 'component1', label: 'Component 1 (out of 10)' },
    { key: 'component2', label: 'Component 2 (out of 10)' },
    { key: 'component3', label: 'Component 3 (out of 10)' },
  ],
  review2: [
    { key: 'component1', label: 'Component 1 (out of 10)' },
    { key: 'component2', label: 'Component 2 (out of 10)' },
    { key: 'component3', label: 'Component 3 (out of 10)' },
  ],
  review3: [
    { key: 'component1', label: 'Component 1 (out of 10)' },
    { key: 'component2', label: 'Component 2 (out of 10)' },
    { key: 'component3', label: 'Component 3 (out of 10)' },
  ],
};

const PopupReview = ({
  title,
  teamMembers,
  reviewType = 'review0',
  isOpen,
  locked = false,
  onClose,
  onSubmit,
  onRequestEdit,
  requestEditVisible = false,
  requestPending = false,
  pptApproved,
}) => {
  // RESET: Fresh state initialization
  const [marks, setMarks] = useState({});
  const [comments, setComments] = useState({});
  const [attendance, setAttendance] = useState({});
  const [teamPptApproved, setTeamPptApproved] = useState(false);

  const showAttendanceAndPPT = ['review1', 'review2', 'review3'].includes(reviewType);

  // RESET: Clear state when popup opens
  useEffect(() => {
    if (isOpen && teamMembers) {
      console.log('=== POPUP REVIEW RESET AND INIT ===');
      console.log('Review type:', reviewType);
      console.log('Locked status:', locked);
      console.log('Request edit visible:', requestEditVisible);
      console.log('Request pending:', requestPending);
      
      // RESET: Clear all previous state
      setMarks({});
      setComments({});
      setAttendance({});
      setTeamPptApproved(false);
      
      const initialMarks = {};
      const initialComments = {};
      const initialAttendance = {};
      
      teamMembers.forEach(member => {
        if (reviewType === 'review0') {
          initialMarks[member._id] = member.review0?.component1 ?? '';
        } else if (reviewType === 'draftReview') {
          initialMarks[member._id] = {
            component1: member.draftReview?.component1 ?? '',
            component2: member.draftReview?.component2 ?? '',
            component3: member.draftReview?.component3 ?? '',
          };
        } else if (reviewType === 'review1') {
          initialMarks[member._id] = {
            component1: member.review1?.component1 ?? '',
            component2: member.review1?.component2 ?? '',
            component3: member.review1?.component3 ?? '',
          };
        } else if (reviewType === 'review2') {
          initialMarks[member._id] = {
            component1: member.review2?.component1 ?? '',
            component2: member.review2?.component2 ?? '',
            component3: member.review2?.component3 ?? '',
          };
        } else if (reviewType === 'review3') {
          initialMarks[member._id] = {
            component1: member.review3?.component1 ?? '',
            component2: member.review3?.component2 ?? '',
            component3: member.review3?.component3 ?? '',
          };
        }
        
        initialComments[member._id] = member.comments || '';
        
        if (showAttendanceAndPPT) {
          initialAttendance[member._id] = member.attendance?.value ?? false;
          console.log(`Student ${member.name} PPT status:`, member.pptApproved?.approved);
          console.log(`Student ${member.name} attendance:`, member.attendance?.value);
        }
      });
      
      setMarks(initialMarks);
      setComments(initialComments);
      
      if (showAttendanceAndPPT) {
        setAttendance(initialAttendance);
        
        const teamPptStatus = teamMembers.length > 0 && 
          teamMembers.every(member => member.pptApproved?.approved === true);
        
        console.log('Calculated team PPT status from students:', teamPptStatus);
        setTeamPptApproved(teamPptStatus);
      }
    }
  }, [isOpen, teamMembers, reviewType, showAttendanceAndPPT, pptApproved, locked, requestEditVisible, requestPending]);

  const handleMarksChange = (memberId, value, component = null) => {
    if (locked) {
      console.log('❌ Marks change blocked - review is locked');
      return;
    }
    
    if (['review1', 'review2', 'review3'].includes(reviewType) && attendance[memberId] === false) {
      console.log('❌ Blocked marks change - student is absent');
      return;
    }
    
    const numValue = Number(value);
    if (numValue > 10) {
      alert("Enter value less than 10, resetting to 0");
      if (component) {
        setMarks(prev => ({
          ...prev,
          [memberId]: {
            ...prev[memberId],
            [component]: 0
          }
        }));
      } else {
        setMarks(prev => ({ ...prev, [memberId]: 0 }));
      }
    } else {
      if (component) {
        setMarks(prev => ({
          ...prev,
          [memberId]: {
            ...prev[memberId],
            [component]: numValue
          }
        }));
      } else {
        setMarks(prev => ({ ...prev, [memberId]: numValue }));
      }
    }
  };

  const handleAttendanceChange = (memberId, isPresent) => {
    if (locked) return;
    
    console.log(`Setting attendance for student ${memberId} to:`, isPresent);
    setAttendance(prev => ({ ...prev, [memberId]: isPresent }));
    
    if (!isPresent) {
      console.log(`Student ${memberId} marked absent - zeroing marks and comments`);
      
      if (reviewType === 'review0') {
        setMarks(prev => ({ ...prev, [memberId]: 0 }));
      } else if (['draftReview', 'review1', 'review2', 'review3'].includes(reviewType)) {
        setMarks(prev => ({
          ...prev,
          [memberId]: {
            component1: 0,
            component2: 0,
            component3: 0
          }
        }));
      }
      setComments(prev => ({ ...prev, [memberId]: '' }));
    }
  };

  const handleSubmit = () => {
    if (locked) return;
    
    console.log('=== SUBMIT STARTED ===');
    console.log('Review type:', reviewType);
    console.log('Current teamPptApproved state:', teamPptApproved);
    
    const submission = {};
    teamMembers.forEach(member => {
      if (reviewType === 'review0') {
        submission[member.regNo] = {
          component1: marks[member._id] || 0,
          comments: comments[member._id] || ''
        };
      } else if (reviewType === 'draftReview') {
        const memberMarks = marks[member._id] || {};
        submission[member.regNo] = {
          component1: memberMarks.component1 || 0,
          component2: memberMarks.component2 || 0,
          component3: memberMarks.component3 || 0,
          comments: comments[member._id] || ''
        };
      } else if (['review1', 'review2', 'review3'].includes(reviewType)) {
        const memberMarks = marks[member._id] || {};
        submission[member.regNo] = {
          component1: memberMarks.component1 || 0,
          component2: memberMarks.component2 || 0,
          component3: memberMarks.component3 || 0,
          comments: comments[member._id] || '',
          attendance: { value: attendance[member._id] }
        };
      }
    });
    
    console.log('Submission data:', submission);
    
    if (['review1', 'review2', 'review3'].includes(reviewType)) {
      const teamPptObj = {
        pptApproved: {
          approved: teamPptApproved,
          locked: false
        }
      };
      console.log('Submitting team PPT object:', teamPptObj);
      onSubmit(submission, teamPptObj);
    } else {
      onSubmit(submission);
    }
  };

  if (!isOpen) return null;

  const components = componentLabels[reviewType] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <X size={24} />
          </button>
        </div>

        {/* FIXED: Enhanced debug logging for banner visibility */}
        {locked && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 flex justify-between items-center">
            <span>This review is locked. Deadline has passed and no edit permission granted.</span>
            {(() => {
              console.log('=== BANNER BUTTON LOGIC ===');
              console.log('Request edit visible:', requestEditVisible);
              console.log('Request pending:', requestPending);
              console.log('Should show request button:', requestEditVisible && !requestPending);
              console.log('Should show pending button:', requestPending);
              
              if (requestEditVisible && !requestPending) {
                return (
                  <button
                    onClick={() => {
                      console.log('🔵 REQUEST EDIT BUTTON CLICKED');
                      onRequestEdit();
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm ml-4"
                  >
                    Request Edit
                  </button>
                );
              }
              
              if (requestPending) {
                return (
                  <button
                    disabled
                    className="px-3 py-1 bg-yellow-400 text-white rounded cursor-not-allowed text-sm ml-4"
                  >
                    Request Pending
                  </button>
                );
              }
              
              return null;
            })()}
          </div>
        )}

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {showAttendanceAndPPT && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">Team PPT Approval</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="teamPpt"
                    checked={teamPptApproved === true}
                    onChange={() => {
                      if (!locked) {
                        console.log('Setting team PPT to APPROVED');
                        setTeamPptApproved(true);
                      }
                    }}
                    disabled={locked}
                    className="mr-2"
                  />
                  <span className="text-green-600 font-semibold">Approved</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="teamPpt"
                    checked={teamPptApproved === false}
                    onChange={() => {
                      if (!locked) {
                        console.log('Setting team PPT to NOT APPROVED');
                        setTeamPptApproved(false);
                      }
                    }}
                    disabled={locked}
                    className="mr-2"
                  />
                  <span className="text-red-600 font-semibold">Not Approved</span>
                </label>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Current state: {teamPptApproved ? 'Approved' : 'Not Approved'}
              </div>
            </div>
          )}

          {teamMembers.map((member) => {
            const isAbsent = ['review1', 'review2', 'review3'].includes(reviewType) && attendance[member._id] === false;
            
            return (
              <div
                key={member._id}
                className="py-4 border-b last:border-b-0"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-medium text-gray-700">{member.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({member.regNo})</span>
                    {isAbsent && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                        ABSENT - Fields Disabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {reviewType === 'review0' ? (
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Marks:</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          className="w-20 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={marks[member._id] || ''}
                          onChange={(e) => handleMarksChange(member._id, e.target.value)}
                          placeholder="0-10"
                          disabled={locked}
                        />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {components.map(comp => (
                          <div key={comp.key} className="flex items-center gap-1">
                            <label className="text-xs">{comp.label.split(' ')[0]}:</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              className={`w-16 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isAbsent ? 'bg-gray-100 cursor-not-allowed' : ''
                              }`}
                              value={marks[member._id]?.[comp.key] || ''}
                              onChange={(e) => handleMarksChange(member._id, e.target.value, comp.key)}
                              placeholder="0-10"
                              disabled={locked || isAbsent}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`grid gap-4 ${showAttendanceAndPPT ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      {['review2', 'review3'].includes(reviewType) ? 'Panel Comments' : 'Guide Comments'}
                    </label>
                    <textarea
                      className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isAbsent ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      placeholder={['review2', 'review3'].includes(reviewType) ? 'Enter Panel Comments' : 'Enter Guide Comments'}
                      rows="2"
                      value={comments[member._id] || ''}
                      onChange={(e) => {
                        if (!locked && !isAbsent) {
                          setComments(prev => ({ ...prev, [member._id]: e.target.value }));
                        }
                      }}
                      disabled={locked || isAbsent}
                    />
                  </div>

                  {showAttendanceAndPPT && (
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Attendance
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`attendance_${member._id}`}
                            checked={attendance[member._id] === true}
                            onChange={() => handleAttendanceChange(member._id, true)}
                            disabled={locked}
                            className="mr-2"
                          />
                          Present
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`attendance_${member._id}`}
                            checked={attendance[member._id] === false}
                            onChange={() => handleAttendanceChange(member._id, false)}
                            disabled={locked}
                            className="mr-2"
                          />
                          Absent
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={locked}
              className={`px-6 py-2 rounded transition-colors ${
                locked 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupReview;
