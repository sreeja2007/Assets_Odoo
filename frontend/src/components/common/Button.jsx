export default function Button({ variant = 'primary', children, className = '', ...props }) {
  const variants = {
    primary:   'bg-blue-600 text-white rounded-full px-6 py-2.5 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-white border border-slate-200 text-slate-700 rounded-full px-6 py-2.5 font-medium hover:bg-slate-50 transition-colors',
    ghost:     'text-slate-600 rounded-full px-4 py-2 hover:bg-slate-100 transition-colors',
    danger:    'bg-red-600 text-white rounded-full px-6 py-2.5 font-medium hover:bg-red-700 transition-colors',
  };

  return (
    <button className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
