import { EventsSidebarContent } from './events-sidebar-content';

export default function EventsSidebar(props) {
  return (
    <div className="bg-muted sticky top-16 hidden max-h-[calc(100vh-4rem)] w-72 shrink-0 flex-col self-start overflow-hidden border-l lg:flex xl:w-80">
      <EventsSidebarContent {...props} />
    </div>
  );
}
