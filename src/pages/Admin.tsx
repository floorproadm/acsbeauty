import { useState } from "react";
import { AdminLayout, AdminTab } from "@/components/admin/AdminLayout";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { BookingsTab } from "@/components/admin/BookingsTab";
import { ClientsTab } from "@/components/admin/ClientsTab";
import { ServicesTab } from "@/components/admin/ServicesTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { CampaignsTab } from "@/components/admin/CampaignsTab";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab onNavigate={setActiveTab} />;
      case "bookings":
        return <BookingsTab />;
      case "clients":
        return <ClientsTab />;
      case "services":
        return <ServicesTab />;
      case "offers":
        return <OffersTab />;
      case "campaigns":
        return <CampaignsTab />;
      default:
        return <DashboardTab onNavigate={setActiveTab} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTab()}
    </AdminLayout>
  );
}
