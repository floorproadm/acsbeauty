import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AdminLayout, AdminTab } from "@/components/admin/AdminLayout";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { BookingsTab } from "@/components/admin/BookingsTab";
import { CRMTab } from "@/components/admin/CRMTab";
import { PaymentsTab } from "@/components/admin/PaymentsTab";
import { ServicesTab } from "@/components/admin/ServicesTab";

import { OffersTab } from "@/components/admin/OffersTab";

import { TasksTab } from "@/components/admin/TasksTab";
import { AllowedEmailsTab } from "@/components/admin/AllowedEmailsTab";
import { GiftCardsTab } from "@/components/admin/GiftCardsTab";
import { GalleryTab } from "@/components/admin/GalleryTab";
import { TeamTab } from "@/components/admin/TeamTab";
import { ConversationsTab } from "@/components/admin/ConversationsTab";
import { useUserRole } from "@/hooks/useUserRole";

export default function Admin() {
  const { role } = useUserRole();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  // Set default tab for non-admin roles
  useEffect(() => {
    if (role && role !== "admin_owner") {
      setActiveTab("bookings");
    }
  }, [role]);

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab onNavigate={setActiveTab} />;
      case "bookings":
        return <BookingsTab />;
      case "payments":
        return <PaymentsTab />;
      case "crm":
        return <CRMTab />;
      case "services":
        return <ServicesTab />;
      case "offers":
        return <OffersTab />;
      case "tasks":
        return <TasksTab />;
      case "gallery":
        return <GalleryTab />;
      case "gift-cards":
        return <GiftCardsTab />;
      case "team":
        return <TeamTab />;
      case "access":
        return <AllowedEmailsTab />;
      default:
        return <DashboardTab onNavigate={setActiveTab} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} userRole={role}>
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
