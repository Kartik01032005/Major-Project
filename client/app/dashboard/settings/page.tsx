"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  FiUser,
  FiPhone,
  FiLock,
  FiDroplet,
  FiClock,
  FiBell,
  FiMapPin,
  FiEye,
  FiShield,
  FiMoon,
  FiGlobe,
  FiHelpCircle,
  FiInfo,
  FiFileText,
  FiDownload,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiPauseCircle,
} from "react-icons/fi";

import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import SettingsSection from "@/components/dashboard/settings/SettingsSection";
import SettingsRow from "@/components/dashboard/settings/SettingsRow";

// Modals
import EditProfileModal from "@/components/dashboard/settings/EditProfileModal";
import PhoneEmailModal from "@/components/dashboard/settings/PhoneEmailModal";
import ChangePasswordModal from "@/components/dashboard/settings/ChangePasswordModal";
import DonationHistoryModal from "@/components/dashboard/settings/DonationHistoryModal";
import ProfileVisibilityModal from "@/components/dashboard/settings/ProfileVisibilityModal";
import PhonePrivacyModal from "@/components/dashboard/settings/PhonePrivacyModal";
import AlertRadiusModal from "@/components/dashboard/settings/AlertRadiusModal";
import EmergencyContactModal from "@/components/dashboard/settings/EmergencyContactModal";
import LoginActivityModal from "@/components/dashboard/settings/LoginActivityModal";
import LanguageModal from "@/components/dashboard/settings/LanguageModal";
import SupportModal from "@/components/dashboard/settings/SupportModal";
import AboutModal from "@/components/dashboard/settings/AboutModal";
import LegalModal from "@/components/dashboard/settings/LegalModal";
import DeleteAccountModal from "@/components/dashboard/settings/DeleteAccountModal";

import { useAuth, useLanguage, useToast } from "@/context";
import { dashboardService } from "@/services";
import { UserSettings, User, DonorProfileStats } from "@/types";
import { LOCALES } from "@/i18n";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { locale } = useLanguage();
  const { toast } = useToast();
  const { resolvedTheme, setTheme } = useTheme();

  // Settings state from backend
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Export data loading state
  const [exporting, setExporting] = useState(false);

  // Modal Visibility States
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [phoneEmailOpen, setPhoneEmailOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [donationHistoryOpen, setDonationHistoryOpen] = useState(false);
  const [profileVisibilityOpen, setProfileVisibilityOpen] = useState(false);
  const [phonePrivacyOpen, setPhonePrivacyOpen] = useState(false);
  const [alertRadiusOpen, setAlertRadiusOpen] = useState(false);
  const [emergencyContactOpen, setEmergencyContactOpen] = useState(false);
  const [loginActivityOpen, setLoginActivityOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<"privacy" | "terms">("privacy");
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  // Flash notification helper with accessible Toast integration
  const notify = useCallback((type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    if (type === "success") {
      toast.success(text);
    } else {
      toast.error(text);
    }
    setTimeout(() => {
      setStatusMessage((current) => (current?.text === text ? null : current));
    }, 3500);
  }, [toast]);

  // Fetch initial settings from server
  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        const data = await dashboardService.getSettings();
        if (mounted) {
          setSettings(data);
        }
      } catch (err) {
        console.error("Failed to load settings from server:", err);
        // Fallback to safe defaults if network error occurs
        if (mounted && user?.settings) {
          setSettings(user.settings);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      mounted = false;
    };
  }, [user]);

  // Generic settings update with optimistic UI & rollback
  const handleUpdateSettings = async (partial: Partial<UserSettings>, successMsg: string) => {
    if (!settings) return;
    const previous = { ...settings };
    const optimistic: UserSettings = {
      ...settings,
      ...partial,
      donor: { ...settings.donor, ...(partial.donor || {}) },
      notifications: { ...settings.notifications, ...(partial.notifications || {}) },
      privacy: { ...settings.privacy, ...(partial.privacy || {}) },
      emergency: { ...settings.emergency, ...(partial.emergency || {}) },
      security: { ...settings.security, ...(partial.security || {}) },
    };

    setSettings(optimistic);

    try {
      const serverSaved = await dashboardService.updateSettings(partial);
      setSettings(serverSaved);
      notify("success", successMsg);
    } catch (err: unknown) {
      setSettings(previous);
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errorObj.response?.data?.message || "Unable to update settings. Please try again.";
      notify("error", msg);
    }
  };

  // Toggle donor availability (stored on user profile)
  const handleToggleDonorAvailability = async (isAvailable: boolean) => {
    const previous = user?.isAvailableDonor ?? true;
    updateUser({ isAvailableDonor: isAvailable });

    try {
      const updated = await dashboardService.updateProfile({ isAvailableDonor: isAvailable });
      updateUser(updated);
      notify(
        "success",
        isAvailable
          ? "Donor availability is now active. You may receive emergency blood matches."
          : "Donor availability paused. You will not appear as an active responder."
      );
    } catch {
      updateUser({ isAvailableDonor: previous });
      notify("error", "Failed to update donor availability.");
    }
  };

  // Download personal data export
  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await dashboardService.exportUserData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute(
        "download",
        `bloodlink-data-${user?.name?.toLowerCase().replace(/\s+/g, "-") || "user"}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      notify("success", "Personal data archive downloaded successfully.");
    } catch {
      notify("error", "Unable to download data archive. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const currentLocaleInfo = LOCALES.find((l) => l.code === locale) || LOCALES[0];
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    if (resolvedTheme) {
      setIsDarkMode(resolvedTheme === "dark");
    } else if (typeof document !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, [resolvedTheme]);

  const handleToggleDarkMode = (val: boolean) => {
    setIsDarkMode(val);
    setTheme(val ? "dark" : "light");
  };

  return (
    <ProtectedRoute requiredRole="user">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h1 className="sr-only">Settings</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage your account identity, donor preferences, emergency alerts, and security.
            </p>
          </div>
          {loading && (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 animate-pulse">
              Syncing preferences...
            </span>
          )}
        </div>

        {/* Global Feedback Banner */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className={[
                "p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-2.5 shadow-sm",
                statusMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800",
              ].join(" ")}
            >
              {statusMessage.type === "success" ? (
                <FiCheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <FiAlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. ACCOUNT */}
        <SettingsSection
          title="Account"
          icon={<FiUser size={15} />}
          description="Personal profile, login coordinates, and authentication credentials."
        >
          <SettingsRow
            id="settings-edit-profile-row"
            icon={<FiUser size={16} />}
            label="Edit Profile"
            description="Name, blood group, state, and district"
            valuePreview={user?.name || "Profile"}
            onClick={() => setEditProfileOpen(true)}
          />
          <SettingsRow
            id="settings-phone-email-row"
            icon={<FiPhone size={16} />}
            label="Phone & Email"
            description="Registered mobile number and verified login address"
            valuePreview={user?.phone ? `+91 ${user.phone}` : user?.email}
            onClick={() => setPhoneEmailOpen(true)}
          />
          <SettingsRow
            id="settings-change-password-row"
            icon={<FiLock size={16} />}
            label="Change Password"
            description="Update your BloodLink password"
            onClick={() => setChangePasswordOpen(true)}
          />
        </SettingsSection>

        {/* 2. DONOR */}
        <SettingsSection
          title="Donor"
          icon={<FiDroplet size={15} />}
          description="Configure your status as an active volunteer blood donor."
        >
          <SettingsRow
            id="settings-donor-availability-row"
            icon={<FiUser size={16} />}
            type="toggle"
            label="Donor Availability"
            description="Toggle whether you are available to receive nearby emergency requests"
            badge={
              <span
                className={[
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                  user?.isAvailableDonor
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                ].join(" ")}
              >
                {user?.isAvailableDonor ? "AVAILABLE" : "UNAVAILABLE"}
              </span>
            }
            checked={user?.isAvailableDonor ?? true}
            onToggle={handleToggleDonorAvailability}
          />
          <SettingsRow
            id="settings-donation-history-row"
            icon={<FiClock size={16} />}
            label="Donation History"
            description="Verified donations fulfilled through BloodLink"
            valuePreview={
              user?.donorStats?.donationsCount
                ? `${user.donorStats.donationsCount} fulfilled`
                : "View history"
            }
            onClick={() => setDonationHistoryOpen(true)}
          />
          <SettingsRow
            id="settings-pause-requests-row"
            icon={<FiPauseCircle size={16} />}
            type="toggle"
            label="Pause Donor Requests"
            description="Temporarily suppress request alerts without changing your permanent profile"
            checked={settings?.donor?.pauseDonorRequests ?? false}
            onToggle={(val) =>
              handleUpdateSettings(
                { donor: { ...settings?.donor, pauseDonorRequests: val } },
                val ? "Donor requests paused." : "Donor requests resumed."
              )
            }
          />
        </SettingsSection>

        {/* 3. NOTIFICATIONS */}
        <SettingsSection
          title="Notifications"
          icon={<FiBell size={15} />}
          description="Manage alerts for emergency requests and community blood updates."
        >
          <SettingsRow
            id="settings-emergency-alerts-row"
            icon={<FiBell size={16} className="text-red-600 dark:text-red-400" />}
            type="toggle"
            label="Emergency Blood Requests"
            description="Critical high-priority broadcasts when nearby patients need blood urgently"
            checked={true}
            disabled={true}
            disabledReason="Critical emergency notifications cannot be disabled because they may be required to provide the requested service."
            onToggle={() => {}}
          />
          <SettingsRow
            id="settings-nearby-requests-row"
            icon={<FiBell size={16} />}
            type="toggle"
            label="Nearby Donor Requests"
            description="Notifications when requests are matched within your selected radius"
            checked={settings?.notifications?.nearbyRequests ?? true}
            onToggle={(val) =>
              handleUpdateSettings(
                { notifications: { ...settings?.notifications, nearbyRequests: val } },
                "Nearby donor request preference updated."
              )
            }
          />
          <SettingsRow
            id="settings-blood-bank-updates-row"
            icon={<FiBell size={16} />}
            type="toggle"
            label="Blood Bank Updates"
            description="Alerts regarding local blood drives and hospital inventory deficits"
            checked={settings?.notifications?.bloodBankUpdates ?? false}
            onToggle={(val) =>
              handleUpdateSettings(
                { notifications: { ...settings?.notifications, bloodBankUpdates: val } },
                "Blood bank updates preference updated."
              )
            }
          />
        </SettingsSection>

        {/* 4. PRIVACY & LOCATION */}
        <SettingsSection
          title="Privacy & Location"
          icon={<FiMapPin size={15} />}
          description="Maintain control over your location sharing and contact visibility."
        >
          <SettingsRow
            id="settings-location-sharing-row"
            icon={<FiMapPin size={16} />}
            type="toggle"
            label="Location Sharing"
            description="Your approximate location helps BloodLink find nearby blood requests and blood banks."
            checked={settings?.privacy?.locationSharing ?? true}
            onToggle={(val) =>
              handleUpdateSettings(
                { privacy: { ...settings?.privacy, locationSharing: val } },
                "Location sharing preference updated."
              )
            }
          />
          <SettingsRow
            id="settings-profile-visibility-row"
            icon={<FiEye size={16} />}
            label="Profile Visibility"
            description="Choose whether your donor profile appears to matching requests"
            valuePreview={
              settings?.privacy?.profileVisibility === "hidden" ? "Hidden" : "Matching Requests"
            }
            onClick={() => setProfileVisibilityOpen(true)}
          />
          <SettingsRow
            id="settings-phone-privacy-row"
            icon={<FiLock size={16} />}
            label="Phone Number Privacy"
            description="Control when other users can view your contact number"
            valuePreview={
              settings?.privacy?.phoneNumberPrivacy === "hidden"
                ? "Hidden"
                : settings?.privacy?.phoneNumberPrivacy === "public"
                ? "Public"
                : "On Request"
            }
            onClick={() => setPhonePrivacyOpen(true)}
          />
        </SettingsSection>

        {/* 5. EMERGENCY */}
        <SettingsSection
          title="Emergency"
          icon={<FiMapPin size={15} />}
          description="Configure emergency broadcast range and emergency medical contact."
        >
          <SettingsRow
            id="settings-alert-radius-row"
            icon={<FiMapPin size={16} />}
            label="Emergency Alert Radius"
            description="Choose how far away emergency blood requests can be from your location."
            valuePreview={`${settings?.emergency?.alertRadiusKm ?? 25} km`}
            onClick={() => setAlertRadiusOpen(true)}
          />
          <SettingsRow
            id="settings-emergency-contact-row"
            icon={<FiPhone size={16} />}
            label="Emergency Contact"
            description="Trusted contact for high-priority emergency notifications"
            valuePreview={
              settings?.emergency?.emergencyContact?.name
                ? `${settings.emergency.emergencyContact.name} (${settings.emergency.emergencyContact.relationship})`
                : "Not configured"
            }
            onClick={() => setEmergencyContactOpen(true)}
          />
        </SettingsSection>

        {/* 6. SECURITY */}
        <SettingsSection
          title="Security"
          icon={<FiShield size={15} />}
          description="Authentication controls and active device session management."
        >
          <SettingsRow
            id="settings-2fa-row"
            icon={<FiShield size={16} />}
            type="toggle"
            label="Two-Factor Authentication"
            description="Require one-time verification codes when logging in or altering donor credentials"
            checked={settings?.security?.twoFactorAuth ?? false}
            onToggle={(val) =>
              handleUpdateSettings(
                { security: { ...settings?.security, twoFactorAuth: val } },
                val ? "Two-factor verification enabled." : "Two-factor verification disabled."
              )
            }
          />
          <SettingsRow
            id="settings-login-activity-row"
            icon={<FiClock size={16} />}
            label="Login Activity"
            description="Review active device sessions and connected hardware"
            valuePreview="Current device active"
            onClick={() => setLoginActivityOpen(true)}
          />
        </SettingsSection>

        {/* 7. APP */}
        <SettingsSection
          title="App"
          icon={<FiGlobe size={15} />}
          description="Theme appearance, interface language, and platform legal information."
        >
          <SettingsRow
            id="settings-dark-mode-row"
            icon={<FiMoon size={16} />}
            type="toggle"
            label="Dark Mode"
            description="Toggle between light and sleek dark mode color schemes"
            checked={isDarkMode}
            onToggle={handleToggleDarkMode}
          />
          <SettingsRow
            id="settings-language-row"
            icon={<FiGlobe size={16} />}
            label="Language"
            description="Application language for navigation and alerts"
            valuePreview={currentLocaleInfo.native}
            onClick={() => setLanguageOpen(true)}
          />
          <SettingsRow
            id="settings-help-support-row"
            icon={<FiHelpCircle size={16} />}
            label="Help & Support"
            description="24x7 blood helplines and donor guidance"
            onClick={() => setSupportOpen(true)}
          />
          <SettingsRow
            id="settings-about-row"
            icon={<FiInfo size={16} />}
            label="About BloodLink"
            description="Version, mission, and platform information"
            valuePreview="v2.4.0"
            onClick={() => setAboutOpen(true)}
          />
          <SettingsRow
            id="settings-privacy-policy-row"
            icon={<FiFileText size={16} />}
            label="Privacy Policy"
            description="Learn how your health data and location are safeguarded"
            onClick={() => {
              setLegalTab("privacy");
              setLegalOpen(true);
            }}
          />
          <SettingsRow
            id="settings-terms-row"
            icon={<FiFileText size={16} />}
            label="Terms & Conditions"
            description="Donor agreement and medical disclaimer"
            onClick={() => {
              setLegalTab("terms");
              setLegalOpen(true);
            }}
          />
        </SettingsSection>

        {/* 8. ACCOUNT MANAGEMENT */}
        <SettingsSection
          title="Account Management"
          icon={<FiTrash2 size={15} />}
          description="Export personal health data or permanently terminate your account."
        >
          <SettingsRow
            id="settings-download-data-row"
            icon={<FiDownload size={16} />}
            label="Download My Data"
            description="Export all personal account records, donor activity, and logs in JSON format"
            valuePreview={exporting ? "Exporting..." : "Export"}
            disabled={exporting}
            onClick={handleExportData}
          />
          <SettingsRow
            id="settings-delete-account-row"
            icon={<FiTrash2 size={16} />}
            label="Delete BloodLink Account"
            description="Permanently delete your donor profile, responses, and notifications"
            destructive
            onClick={() => setDeleteAccountOpen(true)}
          />
        </SettingsSection>

        {/* Modals */}
        <EditProfileModal
          isOpen={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          user={user}
          onSuccess={(updated: User) => {
            updateUser(updated);
            notify("success", "Profile updated successfully.");
          }}
        />

        <PhoneEmailModal
          isOpen={phoneEmailOpen}
          onClose={() => setPhoneEmailOpen(false)}
          user={user}
          onSuccess={(updated: User) => {
            updateUser(updated);
            notify("success", "Contact details updated.");
          }}
        />

        <ChangePasswordModal
          isOpen={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
        />


        <DonationHistoryModal
          isOpen={donationHistoryOpen}
          onClose={() => setDonationHistoryOpen(false)}
          user={user as (User & { donorStats?: DonorProfileStats })}
        />

        <ProfileVisibilityModal
          isOpen={profileVisibilityOpen}
          onClose={() => setProfileVisibilityOpen(false)}
          currentValue={settings?.privacy?.profileVisibility ?? "matching"}
          settings={settings}
          onSuccess={(updated: UserSettings) => {
            setSettings(updated);
            notify("success", "Profile visibility updated.");
          }}
        />

        <PhonePrivacyModal
          isOpen={phonePrivacyOpen}
          onClose={() => setPhonePrivacyOpen(false)}
          currentValue={settings?.privacy?.phoneNumberPrivacy ?? "on_request"}
          settings={settings}
          onSuccess={(updated: UserSettings) => {
            setSettings(updated);
            notify("success", "Phone privacy preference updated.");
          }}
        />

        <AlertRadiusModal
          isOpen={alertRadiusOpen}
          onClose={() => setAlertRadiusOpen(false)}
          currentRadius={settings?.emergency?.alertRadiusKm ?? 25}
          settings={settings}
          onSuccess={(updated: UserSettings) => {
            setSettings(updated);
            notify("success", `Alert radius set to ${updated.emergency?.alertRadiusKm ?? 25} km.`);
          }}
        />

        <EmergencyContactModal
          isOpen={emergencyContactOpen}
          onClose={() => setEmergencyContactOpen(false)}
          contact={settings?.emergency?.emergencyContact}
          settings={settings}
          onSuccess={(updated: UserSettings) => {
            setSettings(updated);
            notify("success", "Emergency contact saved.");
          }}
        />

        <LoginActivityModal
          isOpen={loginActivityOpen}
          onClose={() => setLoginActivityOpen(false)}
          user={user}
        />

        <LanguageModal
          isOpen={languageOpen}
          onClose={() => setLanguageOpen(false)}
        />

        <SupportModal
          isOpen={supportOpen}
          onClose={() => setSupportOpen(false)}
        />

        <AboutModal
          isOpen={aboutOpen}
          onClose={() => setAboutOpen(false)}
        />

        <LegalModal
          isOpen={legalOpen}
          onClose={() => setLegalOpen(false)}
          defaultTab={legalTab}
        />

        <DeleteAccountModal
          isOpen={deleteAccountOpen}
          onClose={() => setDeleteAccountOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
