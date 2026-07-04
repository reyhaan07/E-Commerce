import React from 'react';

// Renders a pill for one of the 6 delivery statuses (or "Not Assigned" when null).
const STYLES = {
  Assigned: 'bg-blue-50 text-blue-600',
  Accepted: 'bg-indigo-50 text-indigo-600',
  'Picked Up': 'bg-amber-50 text-amber-600',
  'In Transit': 'bg-amber-50 text-amber-600',
  'Out For Delivery': 'bg-indigo-50 text-indigo-600',
  Delivered: 'bg-green-50 text-green-600',
};

export default function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-4 py-2 rounded-full font-bold text-sm bg-gray-100 text-gray-400">
        Not Assigned
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-sm ${STYLES[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}
