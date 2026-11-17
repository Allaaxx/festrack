import { EventsSidebarContent } from './events-sidebar-content';

export default function EventsSidebar({
  currentDate,
  onDateChange,
  sidebarDate,
  onSidebarDateChange,
  events,
  onEventCreate,
  tagFilter,
  ...rest
}) {
  return (
    <div className="bg-muted hidden h-full w-72 shrink-0 flex-col overflow-hidden border-l lg:flex xl:w-80">
      <EventsSidebarContent
        currentDate={currentDate}
        onDateChange={onDateChange}
        sidebarDate={sidebarDate}
        onSidebarDateChange={onSidebarDateChange}
        events={events}
        onEventCreate={onEventCreate}
        tagFilter={tagFilter}
        {...rest}
      />
    </div>
  );
}
