import { useSearchParams } from 'react-router';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSettings, ProfileSettings } from '@/features/settings';

const TABS = [
  { name: 'Perfil', value: 'perfil' },
  { name: 'Conta', value: 'conta' },
];

const VALID_TABS = TABS.map((tab) => tab.value);

const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(currentTab) ? currentTab : 'perfil';

  const handleTabChange = (value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', value);
        return next;
      },
      { replace: true }
    );
  };

  return (
    <div className="w-full py-2">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList
            variant="line"
            className="w-full gap-2 rounded-none border-b p-0 sm:justify-start"
          >
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="not-data-active:hover:group-data-horizontal/tabs:after:bg-muted-foreground/30 border-0 text-base group-data-horizontal/tabs:after:bottom-[-0.5px] not-data-active:hover:group-data-horizontal/tabs:after:opacity-100 sm:flex-0"
              >
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="perfil" className="mt-4">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="conta" className="mt-4">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
