import { EventsSidebarContent } from './events-sidebar-content';

export default function EventsSidebar(props) {
  return (
    <div className="bg-muted hidden h-full w-72 shrink-0 flex-col overflow-hidden border-l lg:flex xl:w-80">
      <EventsSidebarContent {...props} />
    </div>
  );
}
