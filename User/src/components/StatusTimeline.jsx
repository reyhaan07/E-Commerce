import React from 'react';
import { HiOutlineCheck } from 'react-icons/hi2';

const STEPS = ['Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Out For Delivery', 'Delivered'];

export default function StatusTimeline({ currentStatus, statusHistory = [] }) {
  const currentIndex = currentStatus ? STEPS.indexOf(currentStatus) : -1;

  function timestampFor(step) {
    const entry = statusHistory.find((h) => h.status === step);
    return entry ? new Date(entry.timestamp).toLocaleDateString() : null;
  }

  return (
    <div className="flex items-start w-full overflow-x-auto">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const time = timestampFor(step);
        return (
          <div key={step} className="flex-1 min-w-[90px] flex flex-col items-center text-center relative">
            {i > 0 && (
              <div
                className={`absolute top-4 -left-1/2 w-full h-0.5 ${done || current ? 'bg-primary' : 'bg-gray-200'}`}
              />
            )}
            <div
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 ${
                done
                  ? 'bg-primary border-primary text-white'
                  : current
                  ? 'bg-white border-primary text-primary'
                  : 'bg-gray-100 border-gray-200 text-gray-400'
              }`}
            >
              {done ? <HiOutlineCheck /> : i + 1}
            </div>
            <p className={`text-xs font-bold mt-2 px-1 ${done || current ? 'text-gray-900' : 'text-gray-400'}`}>{step}</p>
            {time && <p className="text-[10px] text-gray-400 mt-0.5">{time}</p>}
          </div>
        );
      })}
    </div>
  );
}
