import { useState, useMemo } from 'react';
import { addDevice } from '../services/deviceService';

function defaultTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
  } catch {
    return 'Asia/Ho_Chi_Minh';
  }
}

const ASIA_TIMEZONES = [
  { label: 'Vietnam (Asia/Ho_Chi_Minh)', value: 'Asia/Ho_Chi_Minh' },
  { label: 'Thailand (Asia/Bangkok)', value: 'Asia/Bangkok' },
  { label: 'Singapore (Asia/Singapore)', value: 'Asia/Singapore' },
  { label: 'Indonesia - Jakarta (Asia/Jakarta)', value: 'Asia/Jakarta' },
  { label: 'Philippines (Asia/Manila)', value: 'Asia/Manila' },
  { label: 'Malaysia (Asia/Kuala_Lumpur)', value: 'Asia/Kuala_Lumpur' },
  { label: 'China (Asia/Shanghai)', value: 'Asia/Shanghai' },
  { label: 'Japan (Asia/Tokyo)', value: 'Asia/Tokyo' },
  { label: 'South Korea (Asia/Seoul)', value: 'Asia/Seoul' },
  { label: 'India (Asia/Kolkata)', value: 'Asia/Kolkata' },
];

export default function AddDeviceForm({ onSuccess }) {
  const initialTz = useMemo(() => defaultTimezone(), []);
  const [formData, setFormData] = useState({
    childName: '',
    timezone: initialTz,
  });

  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    try {
      const payload = {
        childName: formData.childName.trim(),
        timezone: formData.timezone,
      };

      const res = await addDevice(payload);

      setStatus({
        loading: false,
        error: '',
        success: res.message || 'Device added successfully.',
      });

      setFormData({
        childName: '',
        timezone: initialTz,
      });

      onSuccess?.(res.data);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to add device.';

      setStatus({
        loading: false,
        error: errorMessage,
        success: '',
      });
    }
  };

  return (
    <div className="add-device-form">
      <p className="add-device-form__hint">
        The server will automatically generate a device ID after registration.
      </p>

      {status.success && (
        <div className="add-device-form__banner add-device-form__banner--ok">
          {status.success}
        </div>
      )}

      {status.error && (
        <div className="add-device-form__banner add-device-form__banner--err">
          {status.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="field">
          <label htmlFor="childName">Child&apos;s name</label>
          <input
            type="text"
            id="childName"
            name="childName"
            placeholder="e.g. Alex"
            value={formData.childName}
            onChange={handleChange}
            required
            disabled={status.loading}
          />
        </div>

        <div className="field">
          <label htmlFor="timezone">Timezone</label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            disabled={status.loading}
            required
          >
            {ASIA_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-brand btn-block"
          type="submit"
          disabled={status.loading}
        >
          {status.loading ? 'Saving…' : 'Register device'}
        </button>
      </form>
    </div>
  );
}