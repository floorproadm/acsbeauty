import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedLeadsTab } from "./UnifiedLeadsTab";
import { ClientsTab } from "./ClientsTab";
import { Users, UserPlus } from "lucide-react";

export function CRMTab() {
  const [activeSubTab, setActiveSubTab] = useState("captacao");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">CRM</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie leads e clientes em um só lugar
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="captacao" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Captação
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="captacao" className="mt-6">
          <UnifiedLeadsTab />
        </TabsContent>
        <TabsContent value="clients" className="mt-6">
          <ClientsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
