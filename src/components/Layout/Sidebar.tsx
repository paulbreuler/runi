import { Folder, History } from 'lucide-react';

export const Sidebar = (): React.JSX.Element => {
  return (
    <aside
      className="w-64 h-full border-r border-border-subtle bg-bg-surface flex flex-col transition-all duration-200"
      data-testid="sidebar"
    >
      {/* Collections Section */}
      <div className="flex-1 py-5">
        <div className="px-5 mb-3">
          <h2 className="text-base font-semibold text-text-primary tracking-tight">Collections</h2>
        </div>
        <div className="px-3">
          <div className="flex items-center gap-3 text-sm text-text-muted hover:text-text-secondary hover:bg-bg-raised/50 rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg border border-border-subtle group-hover:border-accent-blue/30 flex items-center justify-center transition-colors">
              <Folder size={16} className="text-text-muted group-hover:text-accent-blue/70" />
            </div>
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">No collections yet</span>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="flex-1 border-t border-border-subtle py-5">
        <div className="px-5 mb-3">
          <h2 className="text-base font-semibold text-text-primary tracking-tight">History</h2>
        </div>
        <div className="px-3">
          <div className="flex items-center gap-3 text-sm text-text-muted hover:text-text-secondary hover:bg-bg-raised/50 rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg border border-border-subtle group-hover:border-signal-warning/30 flex items-center justify-center transition-colors">
              <History size={16} className="text-text-muted group-hover:text-signal-warning/70" />
            </div>
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">No history yet</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
