interface Props {
  isRunning: boolean;
  isLoading: boolean;
  onNewRound: () => void;
  onBackToSetup: () => void;
}

export default function Controls({
  isRunning,
  isLoading,
  onNewRound,
  onBackToSetup,
}: Props) {
  return (
    <div className="bg-[#0d0d14] rounded-lg border border-[#1a1a2a] font-mono">
      <div className="px-3 py-2 border-b border-[#1a1a2a]">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          Controls
        </span>
      </div>
      <div className="p-3 space-y-2">
        <button
          onClick={onNewRound}
          disabled={isRunning || isLoading}
          className="w-full py-2 rounded text-[11px] font-bold uppercase tracking-wider transition-all
            bg-violet-600 hover:bg-violet-500 text-white
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? 'QUERYING...' : isRunning ? 'RUNNING' : 'NEW ROUND'}
        </button>
        <button
          onClick={onBackToSetup}
          disabled={isRunning || isLoading}
          className="w-full py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all
            bg-[#1a1a2a] hover:bg-[#2a2a3a] text-gray-500
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          BACK TO SETUP
        </button>
      </div>
    </div>
  );
}
