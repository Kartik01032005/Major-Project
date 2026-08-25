"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCrosshair, FiPlus, FiEdit3, FiTrash2, FiPhone, FiMapPin, FiCheck, FiX, FiAlertTriangle } from "react-icons/fi";
import { useDashboard, useTranslation } from "@/context";
import { Hospital } from "@/types";
import Select from "@/components/ui/Select";
import { ALL_STATES, getDistrictsByState } from "@/utils/locations";

interface HospitalFormData {
  name: string;
  address: string;
  state: string;
  district: string;
  phone: string;
}

const EMPTY_FORM: HospitalFormData = { name: "", address: "", state: "", district: "", phone: "" };

function HospitalModal({
  open,
  onClose,
  onSave,
  initial,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: HospitalFormData) => void;
  initial?: HospitalFormData;
  title: string;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<HospitalFormData>(initial ?? EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<HospitalFormData>>({});

  const set = (field: keyof HospitalFormData, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e: Partial<HospitalFormData> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!form.district.trim()) e.district = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    else if (!/^\d{10}$/.test(form.phone)) e.phone = "10-digit number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
    onClose();
  };

  const inputCls = (field: keyof HospitalFormData) =>
    [
      "w-full h-10 px-3.5 rounded-xl border text-sm",
      "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
      "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500",
      "placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors",
      errors[field] ? "border-red-400" : "border-slate-200 dark:border-slate-700",
    ].join(" ");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
                <FiCrosshair size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
              <button onClick={onClose} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close">
                <FiX size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("hospital_name")} *</label>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Apollo Blood Bank" className={inputCls("name")} />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("emergency_address")} *</label>
                <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, Area" className={inputCls("address")} />
                {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label={`${t("emergency_state")} *`}
                  value={form.state}
                  onChange={(e) => {
                    set("state", e.target.value);
                    set("district", "");
                  }}
                  error={errors.state}
                  placeholder="Select State"
                  options={ALL_STATES}
                />
                <Select
                  label={`${t("emergency_district")} *`}
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                  error={errors.district}
                  placeholder={form.state ? "Select District" : "Select State first"}
                  options={form.state ? getDistrictsByState(form.state) : []}
                  disabled={!form.state}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("hospital_contact")} *</label>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit number" maxLength={10} className={inputCls("phone")} />
                {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                {t("hospital_cancel")}
              </button>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors">
                <FiCheck size={13} /> {t("hospital_save")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function HospitalManagement() {
  const { hospitals, addHospital, updateHospital, deleteHospital } = useDashboard();
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Hospital | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleAdd = (data: HospitalFormData) => {
    addHospital(data);
  };

  const handleEdit = (data: HospitalFormData) => {
    if (!editTarget) return;
    updateHospital(editTarget._id, data);
    setEditTarget(null);
  };

  const confirmDelete = (id: string) => {
    deleteHospital(id);
    setDeleteTarget(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600">
            <FiCrosshair size={15} />
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("hospital_title")}</h3>
          <span className="text-[11px] text-slate-400 ml-1">{hospitals.length} registered</span>
          <button
            onClick={() => setShowAdd(true)}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <FiPlus size={13} /> {t("hospital_add")}
          </button>
        </div>

        {/* List */}
        {hospitals.length === 0 ? (
          <div className="py-10 flex flex-col items-center text-center px-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <FiCrosshair size={22} />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t("hospital_no_records")}</p>
            <button onClick={() => setShowAdd(true)} className="text-xs font-semibold px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors">
              {t("hospital_add")}
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {hospitals.map((h, i) => (
              <motion.li
                key={h._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 flex-shrink-0 mt-0.5">
                    <FiCrosshair size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{h.name}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <FiMapPin size={11} className="flex-shrink-0" />
                      <span className="truncate">{h.address}, {h.district}, {h.state}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <FiPhone size={11} /> {h.phone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEditTarget(h)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    aria-label={`Edit ${h.name}`}
                  >
                    <FiEdit3 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(h._id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    aria-label={`Delete ${h.name}`}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Add Modal */}
      <HospitalModal open={showAdd} onClose={() => setShowAdd(false)} onSave={handleAdd} title={t("hospital_add")} />

      {/* Edit Modal */}
      {editTarget && (
        <HospitalModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
          initial={{ name: editTarget.name, address: editTarget.address, state: editTarget.state, district: editTarget.district, phone: editTarget.phone }}
          title={t("hospital_edit")}
        />
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              key="del-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              key="del-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 mb-4">
                  <FiAlertTriangle size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t("hospital_confirm_delete")}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">This action cannot be undone.</p>
                <div className="flex items-center gap-2 w-full">
                  <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {t("hospital_cancel")}
                  </button>
                  <button onClick={() => confirmDelete(deleteTarget)} className="flex-1 py-2 rounded-xl bg-red-600 text-xs font-semibold text-white hover:bg-red-700 transition-colors">
                    {t("hospital_delete")}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
