export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
