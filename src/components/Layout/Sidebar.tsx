import { Folder, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Sidebar = (): React.JSX.Element => {
  return (
    <aside
      className="w-64 h-full border-r border-border-default bg-bg-surface flex flex-col transition-all duration-200"
      data-testid="sidebar"
    >
      <Card className="flex-1 rounded-none border-0 border-r bg-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-text-primary">Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-text-secondary hover:bg-bg-raised rounded px-2 py-1.5 transition-colors">
            <Folder size={16} />
            <span>No collections yet</span>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 rounded-none border-0 border-r border-t bg-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-text-primary">History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-text-secondary hover:bg-bg-raised rounded px-2 py-1.5 transition-colors">
            <History size={16} />
            <span>No history yet</span>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
};
