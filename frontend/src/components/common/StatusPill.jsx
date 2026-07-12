const colorMap = {
  // Asset statuses
  Available:          'bg-emerald-50 text-emerald-700',
  Allocated:          'bg-blue-50 text-blue-700',
  Reserved:           'bg-violet-50 text-violet-700',
  'Under Maintenance':'bg-amber-50 text-amber-700',
  Lost:               'bg-red-50 text-red-700',
  Retired:            'bg-slate-100 text-slate-500',
  Disposed:           'bg-slate-100 text-slate-400',
  // Generic
  Active:             'bg-emerald-50 text-emerald-700',
  Inactive:           'bg-slate-100 text-slate-500',
  // Transfer
  Requested:          'bg-amber-50 text-amber-700',
  Approved:           'bg-emerald-50 text-emerald-700',
  Rejected:           'bg-red-50 text-red-700',
  Completed:          'bg-slate-100 text-slate-500',
  // Maintenance
  Pending:            'bg-amber-50 text-amber-700',
  'Technician Assigned': 'bg-violet-50 text-violet-700',
  'In Progress':      'bg-blue-50 text-blue-700',
  Resolved:           'bg-emerald-50 text-emerald-700',
  // Booking
  Upcoming:           'bg-blue-50 text-blue-700',
  Ongoing:            'bg-emerald-50 text-emerald-700',
  Cancelled:          'bg-red-50 text-red-700',
  // Priority
  High:               'bg-red-50 text-red-700',
  Medium:             'bg-amber-50 text-amber-700',
  Low:                'bg-slate-100 text-slate-500',
  // Audit items
  Verified:           'bg-emerald-50 text-emerald-700',
  Missing:            'bg-red-50 text-red-700',
  Damaged:            'bg-amber-50 text-amber-700',
  // Roles
  Admin:              'bg-violet-50 text-violet-700',
  'Asset Manager':    'bg-blue-50 text-blue-700',
  'Department Head':  'bg-teal-50 text-teal-700',
  Employee:           'bg-slate-100 text-slate-500',
};

export default function StatusPill({ status, className = '' }) {
  const color = colorMap[status] || 'bg-slate-100 text-slate-500';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
      {status}
    </span>
  );
}
