import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart3, Clock } from "lucide-react";
import { TeamMembersSubTab } from "./team/TeamMembersSubTab";
import { TeamPerformanceSubTab } from "./team/TeamPerformanceSubTab";
import { TeamScheduleSubTab } from "./team/TeamScheduleSubTab";

export function TeamTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Equipe</h2>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="members" className="gap-1.5 text-xs sm:text-sm">
            <Users className="w-3.5 h-3.5" />
            Membros
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="w-3.5 h-3.5" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5" />
            Escalas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <TeamMembersSubTab />
        </TabsContent>

        <TabsContent value="performance">
          <TeamPerformanceSubTab />
        </TabsContent>

        <TabsContent value="schedule">
          <TeamScheduleSubTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
