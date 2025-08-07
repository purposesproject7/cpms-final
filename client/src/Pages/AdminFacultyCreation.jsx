import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Hash, Shield, Upload } from 'lucide-react';
import Navbar from '../Components/UniversalNavbar';
import { createFaculty, createAdmin } from '../api';

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
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
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
    
    if (!formData.emailId.endsWith('@vit.ac.in')) {
      throw new Error('Only VIT email addresses are allowed (@vit.ac.in)');
    }
    
    if (!formData.password) {
      throw new Error('Password is required');
    }
    
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
      validateForm();

      const apiData = {
        name: String(formData.name.trim()),
        emailId: String(formData.emailId.trim().toLowerCase()),
        password: String(formData.password),
        employeeId: String(formData.employeeId.trim().toUpperCase())
      };

      let response;
      if (formData.role === 'faculty') {
        response = await createFaculty(apiData);
      } else if (formData.role === 'admin') {
        response = await createAdmin(apiData);
      } else {
        throw new Error('Invalid role selected');
      }

      setSuccess(response.message || `${formData.role === 'faculty' ? 'Faculty' : 'Admin'} created successfully!`);
      resetForm();
      
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Server validation failed');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to create user. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar userType="admin" />
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <div className="h-full flex flex-col pt-20">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="mr-3 text-blue-600" size={28} />
                Faculty Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">Create and manage faculty and admin accounts</p>
            </div>
          </div>

          {/* Main Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-4xl mx-auto">
              {/* Success/Error Messages */}
              {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm border border-green-200 shadow-sm">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{success}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm border border-red-200 shadow-sm">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Form Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-8">
                  {/* Role Selection - Prominent */}
                  <div className="mb-8">
                    <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-3">
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'faculty' }))}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                          formData.role === 'faculty' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <User size={20} />
                        <span className="font-medium">Faculty</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                          formData.role === 'admin' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <Shield size={20} />
                        <span className="font-medium">Admin</span>
                      </button>
                    </div>
                  </div>

                  {/* Form Fields - Two Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="lg:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User size={18} className="text-gray-400" />
                        </div>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Dr. Bruce Wayne"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Employee ID */}
                    <div>
                      <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                        Employee ID <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Hash size={18} className="text-gray-400" />
                        </div>
                        <input
                          id="employeeId"
                          name="employeeId"
                          type="text"
                          placeholder="VITF1234"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.employeeId}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div>
                      <label htmlFor="emailId" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail size={18} className="text-gray-400" />
                        </div>
                        <input
                          id="emailId"
                          name="emailId"
                          type="email"
                          placeholder="bruce.wayne@vit.ac.in"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.emailId}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="lg:col-span-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Wayne@2025"
                          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Password Requirements - Compact */}
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-1">Password Requirements:</p>
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                          <span>• 8+ characters</span>
                          <span>• One uppercase (A-Z)</span>
                          <span>• One lowercase (a-z)</span>
                          <span>• One number (0-9)</span>
                          <span className="col-span-2">• One special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>

                    {/* Profile Image URL */}
                    <div className="lg:col-span-2">
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Image URL <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Upload size={18} className="text-gray-400" />
                        </div>
                        <input
                          id="imageUrl"
                          name="imageUrl"
                          type="url"
                          placeholder="https://example.com/profile-image.jpg"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.imageUrl}
                          onChange={handleInputChange}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        URL to profile image (display only, won't be saved)
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-8">
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full flex justify-center items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed font-medium shadow-lg"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating {formData.role === 'faculty' ? 'Faculty' : 'Admin'}...
                        </>
                      ) : (
                        <>
                          <User size={20} className="mr-2" />
                          Create {formData.role === 'faculty' ? 'Faculty' : 'Admin'} Account
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FacultyManagement;
