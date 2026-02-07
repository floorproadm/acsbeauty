import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadsTab } from "./LeadsTab";
import { ClientsTab } from "./ClientsTab";
import { WhatsAppLeadsTab } from "./WhatsAppLeadsTab";
import { Users, MessageCircle, UserCheck } from "lucide-react";

export function CRMTab() {
  const [activeSubTab, setActiveSubTab] = useState("leads");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">CRM</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie leads e clientes em um só lugar
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="leads" className="gap-2">
            <UserCheck className="w-4 h-4" />
            Leads Quiz
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-6">
          <LeadsTab />
        </TabsContent>
        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppLeadsTab />
        </TabsContent>
        <TabsContent value="clients" className="mt-6">
          <ClientsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
