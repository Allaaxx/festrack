import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSettings } from '@/features/settings';
const tabs = [
  { name: 'General', value: 'general' },
  { name: 'Preferences', value: 'preferences' },
  { name: 'Users', value: 'users' },
];
const SettingsPage = () => {
  return (
    <div className="w-full py-8">
      <div className="mx-auto min-h-screen max-w-7xl px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="general">
          <TabsList
            variant="line"
            className="w-full gap-2 rounded-none border-b p-0 sm:justify-start"
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="not-data-active:hover:group-data-horizontal/tabs:after:bg-muted-foreground/30 border-0 text-base group-data-horizontal/tabs:after:bottom-[-0.5px] not-data-active:hover:group-data-horizontal/tabs:after:opacity-100 sm:flex-0"
              >
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="mt-4">
          <AccountSettings />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
