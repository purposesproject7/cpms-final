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
    { key: 'component1', label: 'Component 1 (out of 10)' }
  ],
  review3: [
    { key: 'component1', label: 'Component 1 (out of 10)' }
  ],
  review4: [
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
  const [marks, setMarks] = useState({});
  const [comments, setComments] = useState({});
  const [attendance, setAttendance] = useState({});
  const [teamPptApproved, setTeamPptApproved] = useState(false);

  // ALL REVIEWS NOW HAVE ATTENDANCE
  const showAttendance = true;

  useEffect(() => {
    if (isOpen && teamMembers) {
      setMarks({});
      setComments({});
      setAttendance({});
      setTeamPptApproved(false);

      const initialMarks = {};
      const initialComments = {};
      const initialAttendance = {};

      teamMembers.forEach((member) => {
        if (reviewType === 'review0') {
          initialMarks[member._id] = member.review0?.component1 ?? '';
        } else {
          const review = member[reviewType] || {};
          initialMarks[member._id] = {
            component1: review.component1 ?? '',
            component2: review.component2 ?? '',
            component3: review.component3 ?? '',
          };
        }
        initialComments[member._id] = (member[reviewType]?.comments) || '';
        // ALL REVIEWS NOW SUPPORT ATTENDANCE
        initialAttendance[member._id] = member[reviewType]?.attendance?.value ?? true;
      });

      setMarks(initialMarks);
      setComments(initialComments);
      setAttendance(initialAttendance);

      if (['review1', 'review2', 'review3', 'review4'].includes(reviewType)) {
        const teamPptStatus =
          teamMembers.length > 0 &&
          teamMembers.every((member) => member.pptApproved?.approved === true);
        setTeamPptApproved(teamPptStatus);
      }
    }
  }, [isOpen, teamMembers, reviewType, pptApproved, locked, requestEditVisible, requestPending]);

  const handleMarksChange = (memberId, value, component = null) => {
    if (locked) return;
    if (attendance[memberId] === false) return;

    const numValue = Number(value);
    if (numValue > 10) {
      alert('Enter value less than 10, resetting to 0');
      if (component) {
        setMarks((prev) => ({
          ...prev,
          [memberId]: {
            ...prev[memberId],
            [component]: 0,
          },
        }));
      } else {
        setMarks((prev) => ({ ...prev, [memberId]: 0 }));
      }
    } else {
      if (component) {
        setMarks((prev) => ({
          ...prev,
          [memberId]: {
            ...prev[memberId],
            [component]: numValue,
          },
        }));
      } else {
        setMarks((prev) => ({ ...prev, [memberId]: numValue }));
      }
    }
  };

  const handleAttendanceChange = (memberId, isPresent) => {
    if (locked) return;
    setAttendance((prev) => ({ ...prev, [memberId]: isPresent }));
    if (!isPresent) {
      if (reviewType === 'review0') {
        setMarks((prev) => ({ ...prev, [memberId]: 0 }));
      } else {
        setMarks((prev) => ({
          ...prev,
          [memberId]: {
            component1: 0,
            component2: 0,
            component3: 0,
          },
        }));
      }
      setComments((prev) => ({ ...prev, [memberId]: '' }));
    }
  };

  const handleSubmit = () => {
    if (locked) return;

    const submission = {};
    teamMembers.forEach((member) => {
      if (reviewType === 'review0') {
        submission[member.regNo] = {
          component1: marks[member._id] || 0,
          attendance: { value: attendance[member._id] !== false },
          comments: comments[member._id] || '',
        };
      } else {
        const memberMarks = marks[member._id] || {};
        submission[member.regNo] = {
          component1: memberMarks.component1 || 0,
          component2: memberMarks.component2 || 0,
          component3: memberMarks.component3 || 0,
          attendance: { value: attendance[member._id] !== false },
          comments: comments[member._id] || '',
        };
      }
    });

    if (['review1', 'review2', 'review3', 'review4'].includes(reviewType)) {
      const teamPptObj = {
        pptApproved: {
          approved: teamPptApproved,
          locked: false,
        },
      };
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
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {teamMembers.map((member) => {
            const isAbsent = attendance[member._id] === false;
            return (
              <div key={member._id} className="py-4 border-b last:border-b-0">
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
                          className={`w-20 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isAbsent ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          value={marks[member._id] || ''}
                          onChange={(e) => handleMarksChange(member._id, e.target.value)}
                          placeholder="0-10"
                          disabled={locked || isAbsent}
                        />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {components.map((comp) => (
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
                              onChange={(e) =>
                                handleMarksChange(member._id, e.target.value, comp.key)
                              }
                              placeholder="0-10"
                              disabled={locked || isAbsent}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Comments
                    </label>
                    <textarea
                      className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isAbsent ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      placeholder="Enter Comments"
                      rows="2"
                      value={comments[member._id] || ''}
                      onChange={(e) => {
                        if (!locked && !isAbsent) {
                          setComments((prev) => ({ ...prev, [member._id]: e.target.value }));
                        }
                      }}
                      disabled={locked || isAbsent}
                    />
                  </div>
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
                </div>
              </div>
            );
          })}

          {/* PPT Approval Section for Final Reviews */}
          {['review1', 'review2', 'review3', 'review4'].includes(reviewType) && (
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={teamPptApproved}
                  onChange={(e) => setTeamPptApproved(e.target.checked)}
                  disabled={locked}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Approve PPT for entire team</span>
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={locked}
              className={`px-6 py-2 rounded transition-colors ${
                locked ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
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
