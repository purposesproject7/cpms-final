import React from 'react';

const renderMarks = (reviewObj, keys = ['component1', 'component2', 'component3']) => {
  if (!reviewObj) return <span className="text-gray-400">None</span>;
  if (keys.length === 1) {
    return reviewObj.component1 != null ? reviewObj.component1 : <span className="text-gray-400">None</span>;
  }
  const values = keys.map(key =>
    reviewObj[key] != null ? reviewObj[key] : 'None'
  );
  return values.join(' / ');
};

const renderAttendance = (attendanceObj) => {
  if (!attendanceObj || attendanceObj.value == null) return <span className="text-gray-400">None</span>;
  return attendanceObj.value
    ? <span className="text-green-600 font-semibold">Present</span>
    : <span className="text-red-600 font-semibold">Absent</span>;
};

const renderPPTApproval = (pptObj) => {
  if (!pptObj || pptObj.approved == null) return <span className="text-gray-400">None</span>;
  return pptObj.approved
    ? <span className="text-green-600 font-semibold">Yes</span>
    : <span className="text-red-600 font-semibold">No</span>;
};

const ReviewTable = ({
  team,
  deadlines = {},
  requestStatuses = {},
  isDeadlinePassed,
  isReviewLocked,
}) => {
  // Force re-render with multiple dependencies
  const forceRenderKey = React.useMemo(() => {
    const studentPptStatuses = team.students.map(s => s.pptApproved?.approved).join(',');
    const studentAttendance = team.students.map(s => s.attendance?.value).join(',');
    return `${team.id}_${studentPptStatuses}_${studentAttendance}_${Date.now()}`;
  }, [team.id, team.students]);

  const checkDeadlinePassed = isDeadlinePassed || ((reviewType) => {
    if (!deadlines || !deadlines[reviewType]) return false;
    const now = new Date();
    const deadline = deadlines[reviewType];
    
    if (deadline.from && deadline.to) {
      const fromDate = new Date(deadline.from);
      const toDate = new Date(deadline.to);
      return now < fromDate || now > toDate;
    } else if (typeof deadline === 'string') {
      return now > new Date(deadline);
    }
    return false;
  });

  const checkReviewLocked = isReviewLocked || ((student, reviewType) => {
    const studentReview = student[reviewType];
    if (studentReview?.locked) return true;
    
    if (checkDeadlinePassed(reviewType)) {
      const requestKey = `${student.regNo}_${reviewType}`;
      const requestStatus = requestStatuses[requestKey];
      return requestStatus?.status !== 'approved';
    }
    return false;
  });

  // Check if all students have PPT approved (for team-level status)
  const isTeamPptApproved = team.students.length > 0 && 
    team.students.every(student => student.pptApproved?.approved === true);

  console.log('ReviewTable render - Student PPT statuses:', 
    team.students.map(s => ({ name: s.name, ppt: s.pptApproved?.approved })));
  console.log('ReviewTable render - Team PPT approved:', isTeamPptApproved);

  return (
    <div className="overflow-x-auto mt-4" key={forceRenderKey}>
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Reg No</th>
            <th className="px-4 py-2 border">
              Review 0
              {team.students.some(student => checkReviewLocked(student, 'review0')) && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-700 rounded">
                  Locked
                </span>
              )}
            </th>
            <th className="px-4 py-2 border">
              Draft Review
              {team.students.some(student => checkReviewLocked(student, 'draftReview')) && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-700 rounded">
                  Locked
                </span>
              )}
            </th>
            <th className="px-4 py-2 border">
              Final Review (Guide)
              {team.students.some(student => checkReviewLocked(student, 'review1')) && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-700 rounded">
                  Locked
                </span>
              )}
            </th>
            <th className="px-4 py-2 border">Attendance</th>
            <th className="px-4 py-2 border">PPT Approved</th>
          </tr>
        </thead>
        <tbody>
          {team.students.map(student => (
            <tr key={`${student.regNo}_${forceRenderKey}`}>
              <td className="px-4 py-2 border">{student.name}</td>
              <td className="px-4 py-2 border">{student.regNo}</td>
              
              {/* Review 0 - Only marks */}
              <td className="px-4 py-2 border text-center">
                {renderMarks(student.review0, ['component1'])}
              </td>
              
              {/* Draft Review - Only marks */}
              <td className="px-4 py-2 border text-center">
                {renderMarks(student.draftReview)}
              </td>
              
              {/* Final Review (review1) - Marks only */}
              <td className="px-4 py-2 border text-center">
                {renderMarks(student.review1)}
              </td>
              
              {/* Attendance - Only from review1 */}
              <td className="px-4 py-2 border text-center">
                {renderAttendance(student.attendance)}
              </td>
              
              {/* Individual PPT Approved - From student level */}
              <td className="px-4 py-2 border text-center">
                {renderPPTApproval(student.pptApproved)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Team-level PPT Approval Status */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Team PPT Approved:</span>
          <span key={`team_ppt_${isTeamPptApproved}_${forceRenderKey}`}>
            {isTeamPptApproved
              ? <span className="text-green-600 font-semibold">Yes</span>
              : <span className="text-red-600 font-semibold">No</span>
            }
          </span>
        </div>
        
        {/* Individual PPT Status Summary */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">Individual PPT Status: </span>
          {team.students.map((student, index) => (
            <span key={student.regNo}>
              {student.name}: {student.pptApproved?.approved ? 
                <span className="text-green-600">✓</span> : 
                <span className="text-red-600">✗</span>
              }
              {index < team.students.length - 1 && ', '}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewTable;
