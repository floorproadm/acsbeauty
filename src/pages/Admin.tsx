import { useState } from "react";
import { AdminLayout, AdminTab } from "@/components/admin/AdminLayout";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { BookingsTab } from "@/components/admin/BookingsTab";
import { CRMTab } from "@/components/admin/CRMTab";
import { ServicesTab } from "@/components/admin/ServicesTab";
import { SkusTab } from "@/components/admin/SkusTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { QuizzesTab } from "@/components/admin/QuizzesTab";
import { TasksTab } from "@/components/admin/TasksTab";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab onNavigate={setActiveTab} />;
      case "bookings":
        return <BookingsTab />;
      case "crm":
        return <CRMTab />;
      case "services":
        return <ServicesTab />;
      case "skus":
        return <SkusTab />;
      case "offers":
        return <OffersTab />;
      case "quizzes":
        return <QuizzesTab />;
      case "tasks":
        return <TasksTab />;
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
