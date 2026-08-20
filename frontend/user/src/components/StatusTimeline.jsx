import React from 'react';
import { HiOutlineCheck, HiOutlineClock, HiOutlineXMark } from 'react-icons/hi2';

// The end-to-end order journey, from checkout through to the doorstep. Steps
// and their state are computed by the backend (GET /api/orders/:id → journey),
// so this and the seller console always tell the same story.
//
// `journey` is preferred; `currentStatus`/`statusHistory` remain supported so
// the component still renders if it's used somewhere that hasn't been updated.

const FALLBACK_STEPS = ['Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Out For Delivery', 'Delivered'];

const PHASE_LABEL = {
  order: 'Order',
  seller: 'Seller',
  delivery: 'Courier',
};

function fallbackJourney(currentStatus, statusHistory) {
  const currentIndex = currentStatus ? FALLBACK_STEPS.indexOf(currentStatus) : -1;
  return {
    halted: false,
    haltedReason: null,
    steps: FALLBACK_STEPS.map((key, i) => {
      const entry = statusHistory.find((h) => h.status === key);
      return {
        key,
        phase: 'delivery',
        label: key,
        description: '',
        state: i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming',
        timestamp: entry ? entry.timestamp : null,
        note: entry ? entry.note : '',
      };
    }),
  };
}

function Marker({ state }) {
  if (state === 'done') {
    return (
      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-primary border-2 border-primary text-white">
        <HiOutlineCheck />
      </div>
    );
  }
  if (state === 'current') {
    return (
      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-primary text-primary">
        <HiOutlineClock />
      </div>
    );
  }
  if (state === 'halted') {
    return (
      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-200 text-gray-400">
        <HiOutlineXMark />
      </div>
    );
  }
  return <div className="relative z-10 w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-200" />;
}

export default function StatusTimeline({ journey, currentStatus, statusHistory = [] }) {
  const data = journey?.steps?.length ? journey : fallbackJourney(currentStatus, statusHistory);

  return (
    <div>
      {data.halted && (
        <p className="text-sm font-bold text-amber-600 mb-4">
          This order stopped at “{data.haltedReason}”. The remaining steps won’t happen.
        </p>
      )}

      <ol className="space-y-0">
        {data.steps.map((step, i) => {
          const last = i === data.steps.length - 1;
          const muted = step.state === 'upcoming' || step.state === 'halted';
          return (
            <li key={`${step.phase}-${step.key}`} className="flex gap-4">
              {/* marker rail */}
              <div className="flex flex-col items-center">
                <Marker state={step.state} />
                {!last && (
                  <div className={`w-0.5 flex-1 my-1 ${step.state === 'done' ? 'bg-primary' : 'bg-gray-200'}`} style={{ minHeight: 22 }} />
                )}
              </div>

              {/* copy */}
              <div className={`pb-5 min-w-0 ${last ? '' : 'flex-1'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-bold ${muted ? 'text-gray-400' : 'text-gray-900'}`}>{step.label}</p>
                  <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    {PHASE_LABEL[step.phase] || step.phase}
                  </span>
                </div>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                )}
                {step.timestamp && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{new Date(step.timestamp).toLocaleString()}</p>
                )}
                {step.note && <p className="text-[11px] text-gray-500 italic mt-0.5">“{step.note}”</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
