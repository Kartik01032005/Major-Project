"use client";

import React, { useState } from "react";
import { FiAlertTriangle, FiPhone, FiUser, FiLoader, FiCheck } from "react-icons/fi";
import SettingsModal from "./SettingsModal";
import { UserSettings, EmergencyContact } from "@/types";
import { dashboardService } from "@/services";

interface EmergencyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: EmergencyContact;
  settings: UserSettings | null;
  onSuccess: (updated: UserSettings) => void;
}

const RELATIONSHIPS = [
  "Parent",
  "Spouse",
  "Sibling",
  "Child",
  "Guardian",
  "Doctor",
  "Friend",
  "Other",
];

export default function EmergencyContactModal({
  isOpen,
  onClose,
  contact,
  settings,
  onSuccess,
}: EmergencyContactModalProps) {
  const [name, setName] = useState(contact?.name || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [relationship, setRelationship] = useState(contact?.relationship || "Parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!name.trim()) {
      setError("Contact name is required");
      return;
    }
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Please provide a valid 10-digit emergency contact phone number");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await dashboardService.updateSettings({
        emergency: {
          alertRadiusKm: settings?.emergency?.alertRadiusKm ?? 25,
          emergencyContact: {
            name: name.trim(),
            phone: cleanPhone,
            relationship: relationship.trim(),
          },
        },
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || "Failed to update emergency contact.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Emergency Contact"
      description="Designate a primary contact to reach in critical medical or donation emergencies."
      icon={<FiAlertTriangle size={20} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FiUser size={13} className="text-slate-400" />
            <span>Contact Name</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g. Ramesh Kumar"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FiPhone size={13} className="text-slate-400" />
            <span>Contact Phone Number</span>
          </label>
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:ring-2 focus-within:ring-red-500 overflow-hidden">
            <span className="px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 border-r border-slate-200 dark:border-slate-700 select-none">
              +91
            </span>
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              required
              className="w-full px-3 py-2.5 text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
              placeholder="9876543210"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Relationship
          </label>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {RELATIONSHIPS.map((rel) => (
              <option key={rel} value={rel}>
                {rel}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
            <span>Save Contact</span>
          </button>
        </div>
      </form>
    </SettingsModal>
  );
}
