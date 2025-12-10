import { useState } from 'react';

const EVENT_TYPES = [
  { value: 'job_loss', label: 'Job Loss', icon: '💼' },
  { value: 'disability', label: 'Disability', icon: '🏥' },
  { value: 'divorce', label: 'Divorce', icon: '💔' },
  { value: 'inheritance', label: 'Inheritance', icon: '💰' },
  { value: 'major_medical', label: 'Major Medical', icon: '🏥' },
  { value: 'home_purchase', label: 'Home Purchase', icon: '🏠' },
  { value: 'business_start', label: 'Business Start', icon: '🚀' },
  { value: 'career_change', label: 'Career Change', icon: '💼' },
  { value: 'marriage', label: 'Marriage', icon: '💍' },
  { value: 'child_birth', label: 'Child Birth', icon: '👶' },
  { value: 'relocation', label: 'Relocation', icon: '📦' },
  { value: 'windfall', label: 'Windfall', icon: '🎰' }
];

interface LifeEventFormProps {
  onClose: () => void;
  onSave: (event: any) => void;
  initialData?: any;
}

export function LifeEventForm({ onClose, onSave, initialData }: LifeEventFormProps) {
  const [eventType, setEventType] = useState(initialData?.event_type || 'job_loss');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startYear, setStartYear] = useState(initialData?.start_year || 2025);
  const [duration, setDuration] = useState(initialData?.duration_years || 1);
  const [probability, setProbability] = useState(initialData?.probability || 1.0);
  const [impact, setImpact] = useState<any>({});

  const renderDynamicFields = () => {
    switch (eventType) {
      case 'job_loss':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Severance Months</label>
              <input type="number" className="w-full border rounded px-3 py-2" defaultValue={3}
                onChange={(e) => setImpact({...impact, severance_months: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Job Search Duration (months)</label>
              <input type="number" className="w-full border rounded px-3 py-2" defaultValue={6}
                onChange={(e) => setImpact({...impact, job_search_months: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Income (% of current)</label>
              <input type="number" className="w-full border rounded px-3 py-2" defaultValue={85}
                onChange={(e) => setImpact({...impact, new_income_percent: Number(e.target.value)})} />
            </div>
          </>
        );
      case 'inheritance':
        return (
          <div>
            <label className="block text-sm font-medium mb-1">Inheritance Amount ($)</label>
            <input type="number" className="w-full border rounded px-3 py-2" defaultValue={100000}
              onChange={(e) => setImpact({...impact, amount: Number(e.target.value)})} />
          </div>
        );
      case 'home_purchase':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Home Price ($)</label>
              <input type="number" className="w-full border rounded px-3 py-2" defaultValue={400000}
                onChange={(e) => setImpact({...impact, home_price: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Down Payment (%)</label>
              <input type="number" className="w-full border rounded px-3 py-2" defaultValue={20}
                onChange={(e) => setImpact({...impact, down_payment_percent: Number(e.target.value)})} />
            </div>
          </>
        );
      default:
        return (
          <div>
            <label className="block text-sm font-medium mb-1">Financial Impact ($)</label>
            <input type="number" className="w-full border rounded px-3 py-2" defaultValue={50000}
              onChange={(e) => setImpact({...impact, amount: Number(e.target.value)})} />
          </div>
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ event_type: eventType, name, description, start_year: startYear, duration_years: duration, probability, financial_impact: impact });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">
          {initialData ? 'Edit' : 'Add'} Life Event
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event Type</label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map(type => (
                <button key={type.value} type="button"
                  onClick={() => setEventType(type.value)}
                  className={'p-3 border rounded text-center transition ' + (eventType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300')}>
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Event Name</label>
            <input type="text" required className="w-full border rounded px-3 py-2"
              value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Job Loss at TechCorp" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea className="w-full border rounded px-3 py-2" rows={2}
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Year</label>
              <input type="number" required className="w-full border rounded px-3 py-2"
                value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} min={2024} max={2100} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (years)</label>
              <input type="number" required className="w-full border rounded px-3 py-2"
                value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} max={50} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Probability: {(probability * 100).toFixed(0)}%</label>
            <input type="range" className="w-full" min="0" max="1" step="0.05"
              value={probability} onChange={(e) => setProbability(Number(e.target.value))} />
          </div>

          {renderDynamicFields()}

          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {initialData ? 'Update' : 'Create'} Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
