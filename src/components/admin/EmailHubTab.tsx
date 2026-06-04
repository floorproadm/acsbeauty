import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignsTab } from "./CampaignsTab";
import { EmailLogsTab } from "./EmailLogsTab";
import { EmailConfigSection } from "./SettingsTab";
import { Megaphone, Mail, Settings } from "lucide-react";

export function EmailHubTab() {
  return (
    <Tabs defaultValue="campaigns" className="space-y-4">
      <TabsList>
        <TabsTrigger value="campaigns" className="gap-2">
          <Megaphone className="w-4 h-4" /> Campanhas
        </TabsTrigger>
        <TabsTrigger value="logs" className="gap-2">
          <Mail className="w-4 h-4" /> Logs
        </TabsTrigger>
        <TabsTrigger value="config" className="gap-2">
          <Settings className="w-4 h-4" /> Configurações
        </TabsTrigger>
      </TabsList>
      <TabsContent value="campaigns" className="mt-0">
        <CampaignsTab />
      </TabsContent>
      <TabsContent value="logs" className="mt-0">
        <EmailLogsTab />
      </TabsContent>
      <TabsContent value="config" className="mt-0">
        <div className="max-w-4xl">
          <EmailConfigSection />
        </div>
      </TabsContent>
    </Tabs>
  );
}
