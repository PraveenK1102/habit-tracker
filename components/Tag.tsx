'use client';

export default function Tag({ tag, color }: { tag: string; color: string }) {
  return (
    <span
      className="px-2 py-1 rounded-xl cursor-pointer flex items-center"
      style={{
        backgroundColor: `${color}50`,
      }}
    >
      <span className="w-full flex justify-between items-center">
        <span className="text-xxs font-mono">{tag}</span>
      </span>
    </span>
  );
}