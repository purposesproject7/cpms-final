import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Hash, Shield, Upload } from 'lucide-react';
import Navbar from '../Components/UniversalNavbar';
import { createFaculty, createAdmin } from '../api'; // Import real API functions

const FacultyManagement = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    imageUrl: '',
    employeeId: '',
    name: '',
    emailId: '',
    password: '',
    role: 'faculty'
  });

  // Auto-dismiss success and error messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const resetForm = () => {
    setFormData({
      imageUrl: '',
      employeeId: '',
      name: '',
      emailId: '',
      password: '',
      role: 'faculty'
    });
    setError('');
    setSuccess('');
    setShowPassword(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Client-side validation
    if (!formData.name.trim()) {
      throw new Error('Name is required');
    }
    
    if (!formData.employeeId.trim()) {
      throw new Error('Employee ID is required');
    }
    
    if (!formData.employeeId.match(/^[A-Za-z0-9]+$/)) {
      throw new Error('Employee ID must contain only letters and numbers');
    }
    
    if (!formData.emailId.trim()) {
      throw new Error('Email is required');
    }
    
    // FIX: Add back the missing email validation
    if (!formData.emailId.endsWith('@vitstudent.ac.in')) {
      throw new Error('Only VIT email addresses are allowed (@vit.ac.in)');
    }
    
    if (!formData.password) {
      throw new Error('Password is required');
    }
    
    // Password validation matching backend
    if (formData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(formData.password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(formData.password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(formData.password)) {
      throw new Error('Password must contain at least one number');
    }
    
    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      throw new Error('Password must contain at least one special character');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Validate form first
      validateForm();

      // FIX: Ensure all data is explicitly converted to strings and trimmed
      const apiData = {
        name: String(formData.name.trim()),
        emailId: String(formData.emailId.trim().toLowerCase()), // Also convert to lowercase
        password: String(formData.password),
        employeeId: String(formData.employeeId.trim().toUpperCase()) // Convert to uppercase for consistency
      };

      console.log('Submitting data (all strings):', apiData);
      console.log('Data types check:');
      console.log('- name type:', typeof apiData.name, '| value:', apiData.name);
      console.log('- emailId type:', typeof apiData.emailId, '| value:', apiData.emailId);
      console.log('- password type:', typeof apiData.password, '| length:', apiData.password.length);
      console.log('- employeeId type:', typeof apiData.employeeId, '| value:', apiData.employeeId);
      console.log('Selected role:', formData.role);

      // Call appropriate real API based on role
      let response;
      if (formData.role === 'faculty') {
        console.log('Calling createFaculty API...');
        response = await createFaculty(apiData);
      } else if (formData.role === 'admin') {
        console.log('Calling createAdmin API...');
        response = await createAdmin(apiData);
      } else {
        throw new Error('Invalid role selected');
      }

      console.log('API response:', response);

      setSuccess(response.message || `${formData.role === 'faculty' ? 'Faculty' : 'Admin'} created successfully!`);
      
      // Reset form AFTER successful creation
      resetForm();
      
    } catch (err) {
      console.error('Creation error:', err);
      
      // FIX: Enhanced error handling to show backend validation errors
      if (err.response && err.response.data) {
        // Backend validation error
        console.log('Backend error response:', err.response.data);
        setError(err.response.data.message || 'Server validation failed');
      } else if (err.message) {
        // Client-side validation error
        setError(err.message);
      } else {
        // Generic error
        setError('Failed to create user. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar userType="admin" />
      <div className="min-h-screen bg-gray-50 overflow-x-hidden p-6 pt-24">
        <div className="max-w-2xl mx-auto">
          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm border-l-4 border-green-500">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{success}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm border-l-4 border-red-500">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Faculty Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h1 className="font-semibold font-roboto mb-4 text-2xl md:text-3xl">
              Faculty Management
            </h1>
            <div className="space-y-6">
              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <div className="pl-3 flex items-center">
                    <Shield size={20} className="text-gray-400" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    className="flex-1 pl-3 pr-3 py-3 bg-transparent focus:outline-none transition text-gray-900"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="faculty">Faculty</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select whether this person will be a faculty member or administrator
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <div className="pl-3 flex items-center">
                    <User size={20} className="text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Dr. Bruce Wayne"
                    className="flex-1 pl-3 pr-3 py-3 bg-transparent focus:outline-none transition"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the full name with appropriate title (Dr., Prof., etc.)
                </p>
              </div>

              {/* Employee ID */}
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <div className="pl-3 flex items-center">
                    <Hash size={20} className="text-gray-400" />
                  </div>
                  <input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    placeholder="VITF1234"
                    className="flex-1 pl-3 pr-3 py-3 bg-transparent focus:outline-none transition"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier for the employee (letters and numbers only)
                </p>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="emailId" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <div className="pl-3 flex items-center">
                    <Mail size={20} className="text-gray-400" />
                  </div>
                  <input
                    id="emailId"
                    name="emailId"
                    type="email"
                    placeholder="bruce.wayne@vit.ac.in"
                    className="flex-1 pl-3 pr-3 py-3 bg-transparent focus:outline-none transition"
                    value={formData.emailId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be a valid VIT email address ending with @vit.ac.in
                </p>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <div className="pl-3 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Wayne@2025"
                    className="flex-1 pl-3 pr-3 py-3 bg-transparent focus:outline-none transition"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <div className="pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter (A-Z)</li>
                    <li>One lowercase letter (a-z)</li>
                    <li>One number (0-9)</li>
                    <li>One special character (!@#$%^&*)</li>
                  </ul>
                </div>
              </div>

              {/* Profile Image URL (Optional) */}
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Image URL <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <div className="pl-3 flex items-center">
                    <Upload size={20} className="text-gray-400" />
                  </div>
                  <input
                    id="imageUrl"
                    name="imageUrl"
                    type="url"
                    placeholder="https://example.com/profile-image.jpg"
                    className="flex-1 pl-3 pr-3 py-3 bg-transparent focus:outline-none transition"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  URL to profile image hosted on a cloud service (Note: This field is for display only and won't be saved)
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center bg-blue-700 text-white py-3 px-4 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-75 font-medium"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating {formData.role === 'faculty' ? 'Faculty' : 'Admin'}...
                    </>
                  ) : (
                    <>
                      <User size={20} className="mr-2" />
                      Add {formData.role === 'faculty' ? 'Faculty' : 'Admin'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6">
            <div className="flex items-center justify-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 bg-gray-50 text-gray-500 text-sm">
                VIT Faculty Management System
              </span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FacultyManagement;
