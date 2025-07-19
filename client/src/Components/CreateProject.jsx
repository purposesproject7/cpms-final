
import React, { useState } from 'react';
import { createProject } from '../api';

const CreateProject = ({ isOpen, onClose, onSuccess }) => {
  const [projectName, setProjectName] = useState('');
  const [students, setStudents] = useState([{ regNo: '', name: '', emailId: '' }]);
  const [loading, setLoading] = useState(false);

  const addStudent = () => {
  if(students.length <3){
    setStudents([...students, { regNo: '', name: '', emailId: '' }]);
  }
  else{
    alert("Only 3 Students Per project")
  }
  };

  const removeStudent = (index) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const updateStudent = (index, field, value) => {
    const updatedStudents = [...students];
    updatedStudents[index][field] = value;
    setStudents(updatedStudents);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUser = JSON.parse(localStorage.getItem('faculty') || '{}');
      
      const payload = {
        name: projectName,
        students: students,
        guideFacultyEmpId: currentUser.employeeId
      };

      const response = await createProject(payload);
      
      if (response.success) {
        alert('Project created successfully!');
        onSuccess();
        onClose();
       
        setProjectName('');
        setStudents([{ regNo: '', name: '', emailId: '' }]);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Create New Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-700">Students</h3>

          <button
            type="button"
            onClick={addStudent}
            disabled={students.length >= 3}
            className={`px-4 py-2 text-white rounded ${
              students.length >= 3 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            Add Student {students.length >= 3 && '(Max 3)'}
          </button>

            </div>

            {students.map((student, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border rounded">
                <input
                  type="text"
                  placeholder="Registration Number"
                  value={student.regNo}
                  onChange={(e) => updateStudent(index, 'regNo', e.target.value)}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Student Name"
                  value={student.name}
                  onChange={(e) => updateStudent(index, 'name', e.target.value)}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email ID"
                  value={student.emailId}
                  onChange={(e) => updateStudent(index, 'emailId', e.target.value)}
                  className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeStudent(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={students.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
