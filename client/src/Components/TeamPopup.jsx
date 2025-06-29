// TeamPopup.jsx
import React from 'react';

const TeamPopup = ({ team, onClose }) => {
  if (!team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button
          className="absolute top-2 right-2 text-red-600"
          onClick={onClose}
        >
          ✖
        </button>
        <h2 className="text-xl font-bold mb-4">{team.name}</h2>
        <p className="text-sm text-gray-600 mb-2">Domain: {team.domain}</p>

        <h3 className="font-semibold text-md mb-2">Students:</h3>
        {team.students && team.students.length > 0 ? (
          <ul className="list-disc pl-5">
            {team.students.map((student, idx) => (
              <li key={student._id || idx}>
                {student.name} ({student.regNo})
              </li>
            ))}
          </ul>
        ) : (
          <p>No students listed.</p>
        )}
      </div>
    </div>
  );
};

export default TeamPopup;
