export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <input
        className={`bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <select
        className={`bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all
          ${error ? 'border-red-400' : ''}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        className={`bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none
          ${error ? 'border-red-400' : ''}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
