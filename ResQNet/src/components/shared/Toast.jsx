export default function Toast({ message, visible }) {
  return (
    <div
      className="fixed bottom-5 right-5 z-50 bg-green-800 border border-green-600 text-white text-sm font-mono px-5 py-3 rounded-xl shadow-2xl"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.3s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {message}
    </div>
  );
}
