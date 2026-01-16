import { Folder, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Sidebar = (): React.JSX.Element => {
  return (
    <aside
      className="w-64 h-full border-r border-border-default bg-bg-surface flex flex-col transition-all duration-200"
      data-testid="sidebar"
    >
      <Card className="flex-1 rounded-none border-0 bg-transparent">
        <CardHeader className="px-6 pb-4">
          <CardTitle className="text-base font-semibold text-text-primary">Collections</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="flex items-center gap-3 text-sm text-text-secondary hover:bg-bg-raised rounded-lg px-3 py-2.5 transition-colors cursor-pointer">
            <Folder size={18} className="text-text-muted" />
            <span>No collections yet</span>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 rounded-none border-0 border-t border-border-subtle bg-transparent">
        <CardHeader className="px-6 pb-4">
          <CardTitle className="text-base font-semibold text-text-primary">History</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="flex items-center gap-3 text-sm text-text-secondary hover:bg-bg-raised rounded-lg px-3 py-2.5 transition-colors cursor-pointer">
            <History size={18} className="text-text-muted" />
            <span>No history yet</span>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
};
