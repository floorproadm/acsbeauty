import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AdminLayout, AdminTab } from "@/components/admin/AdminLayout";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { BookingsTab } from "@/components/admin/BookingsTab";
import { CRMTab } from "@/components/admin/CRMTab";
import { ServicesTab } from "@/components/admin/ServicesTab";
import { SkusTab } from "@/components/admin/SkusTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { QuizzesTab } from "@/components/admin/QuizzesTab";
import { TasksTab } from "@/components/admin/TasksTab";
import { AllowedEmailsTab } from "@/components/admin/AllowedEmailsTab";

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
      case "access":
        return <AllowedEmailsTab />;
      default:
        return <DashboardTab onNavigate={setActiveTab} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>
    </AdminLayout>
  );
}
