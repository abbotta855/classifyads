import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-6 bg-white dark:bg-[#161615] rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-[#1b1b18] dark:text-[#EDEDEC]">
        React is Working! 🎉
      </h1>
      <p className="mb-4 text-[#706f6c] dark:text-[#A1A09A]">
        This is a React component running inside Laravel.
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 bg-[#1b1b18] dark:bg-[#eeeeec] text-white dark:text-[#1C1C1A] rounded-sm hover:bg-black dark:hover:bg-white transition-colors"
        >
          -
        </button>
        <span className="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
          Count: {count}
        </span>
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-[#1b1b18] dark:bg-[#eeeeec] text-white dark:text-[#1C1C1A] rounded-sm hover:bg-black dark:hover:bg-white transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default App;
