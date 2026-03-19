import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReengagementTab } from "./ReengagementTab";
import { ClientsTab } from "./ClientsTab";
import { Users, Bell } from "lucide-react";

export function CRMTab() {
  const [activeSubTab, setActiveSubTab] = useState("clients");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">CRM</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie clientes e reengajamento em um só lugar
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:max-w-xs mx-auto sm:mx-0">
          <TabsTrigger value="clients" className="gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="reengajamento" className="gap-2">
            <Bell className="w-4 h-4" />
            Reengajamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-6">
          <ClientsTab />
        </TabsContent>

        <TabsContent value="reengajamento" className="mt-6">
          <ReengagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
