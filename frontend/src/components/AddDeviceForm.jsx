import { useState } from 'react';
import axios from 'axios';

const AddDeviceForm = () => {
  // Store form input values
  const [formData, setFormData] = useState({ childName: '', deviceId: '' });
  
  // Store request status (loading, success message, or error message)
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset status to loading state before sending request
    setStatus({ loading: true, error: '', success: '' });

    try {
      // Send POST request to the backend API
      const response = await axios.post('http://localhost:3000/device', formData);
      
      // Update status on success
      setStatus({ loading: false, error: '', success: response.data.message });
      
      // Clear form inputs after successful submission
      setFormData({ childName: '', deviceId: '' });
      
    } catch (error) {
      // Extract error message from backend or set default network error
      const errorMessage = error.response?.data?.message || 'Failed to connect to the server.';
      
      // Update status on failure
      setStatus({ loading: false, error: errorMessage, success: '' });
    }
  };

  return (
    <div 
      className="w-full max-w-md p-8 rounded-2xl text-left relative"
      style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
    >
      <h2 className="text-center mb-6 font-bold" style={{ color: 'var(--text-h)' }}>
        Add Tracking Device
      </h2>

      {/* Display Success Message */}
      {status.success && (
        <div className="mb-4 p-3 rounded text-sm text-green-700 bg-green-100 border border-green-400">
          {status.success}
        </div>
      )}

      {/* Display Error Message */}
      {status.error && (
        <div className="mb-4 p-3 rounded text-sm text-red-700 bg-red-100 border border-red-400">
          {status.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { id: 'childName', label: "Child's Name", placeholder: 'e.g., Tom' },
          { id: 'deviceId', label: 'Device ID (UUID)', placeholder: 'e.g., a6289523-a7a4-...' }
        ].map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              {field.label}
            </label>
            <input
              type="text"
              id={field.id}
              name={field.id}
              className="w-full px-4 py-2 rounded-lg outline-none focus:ring-2 transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--code-bg)', 
                border: '1px solid var(--border)',
                color: 'var(--text-h)'
              }}
              placeholder={field.placeholder}
              value={formData[field.id]}
              onChange={handleChange}
              required
              disabled={status.loading}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={status.loading}
          className="w-full font-semibold py-2.5 rounded-lg transition-all mt-2 disabled:opacity-70"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          {status.loading ? 'Saving...' : 'Save Device'}
        </button>
      </form>
    </div>
  );
};

export default AddDeviceForm;