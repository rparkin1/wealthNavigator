import { useState } from 'react';

export function LifeEventForm({ onClose, onSave }: any) {
  const [eventType, setEventType] = useState('job_loss');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h3 className="text-xl font-bold mb-4">Add Life Event</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="job_loss">Job Loss</option>
            <option value="disability">Disability</option>
            <option value="inheritance">Inheritance</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onSave} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}
