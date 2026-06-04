import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AdminLayout, AdminTab } from "@/components/admin/AdminLayout";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { BookingsTab } from "@/components/admin/BookingsTab";
import { CRMTab } from "@/components/admin/CRMTab";
import { PaymentsTab } from "@/components/admin/PaymentsTab";
import { ServicesTab } from "@/components/admin/ServicesTab";

import { OffersTab } from "@/components/admin/OffersTab";

import { TasksTab } from "@/components/admin/TasksTab";
import { AdminInvitesTab } from "@/components/admin/AdminInvitesTab";
import { GiftCardsTab } from "@/components/admin/GiftCardsTab";
import { GalleryTab } from "@/components/admin/GalleryTab";
import { TeamTab } from "@/components/admin/TeamTab";
import { ConversationsTab } from "@/components/admin/ConversationsTab";
import { NotificationsTab } from "@/components/admin/NotificationsTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { EmailLogsTab } from "@/components/admin/EmailLogsTab";
import { EmailHubTab } from "@/components/admin/EmailHubTab";
import { useUserRole } from "@/hooks/useUserRole";

export default function Admin() {
  const { role } = useUserRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  // Sync from URL ?tab=
  useEffect(() => {
    const t = searchParams.get("tab") as AdminTab | null;
    if (t) setActiveTab(t);
  }, [searchParams]);

  // Set default tab for non-admin roles
  useEffect(() => {
    if (role && role !== "admin_owner" && !searchParams.get("tab")) {
      setActiveTab("bookings");
    }
  }, [role, searchParams]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    }, { replace: true });
  };


  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab onNavigate={setActiveTab} />;
      case "bookings":
        return <BookingsTab />;
      case "conversations":
        return <ConversationsTab />;
      case "payments":
        return <PaymentsTab />;
      case "crm":
        return <CRMTab />;
      case "services":
        return <ServicesTab />;
      case "offers":
        return <OffersTab />;
      case "email":
        return <EmailHubTab />;
      case "tasks":
        return <TasksTab />;
      case "gallery":
        return <GalleryTab />;
      case "gift-cards":
        return <GiftCardsTab />;
      case "team":
        return <TeamTab />;
      case "notifications":
        return <NotificationsTab />;
      case "settings":
        return <SettingsTab />;
      case "access":
        return <AdminInvitesTab />;
      default:
        return <DashboardTab onNavigate={setActiveTab} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={handleTabChange} userRole={role}>
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
