import { useState } from "react";
import { AdminLayout, AdminTab } from "@/components/admin/AdminLayout";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { BookingsTab } from "@/components/admin/BookingsTab";
import { ClientsTab } from "@/components/admin/ClientsTab";
import { LeadsTab } from "@/components/admin/LeadsTab";
import { ServicesTab } from "@/components/admin/ServicesTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { QuizzesTab } from "@/components/admin/QuizzesTab";
import { WhatsAppLeadsTab } from "@/components/admin/WhatsAppLeadsTab";

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
      case "leads":
        return <LeadsTab />;
      case "services":
        return <ServicesTab />;
      case "offers":
        return <OffersTab />;
      case "quizzes":
        return <QuizzesTab />;
      case "whatsapp":
        return <WhatsAppLeadsTab />;
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
