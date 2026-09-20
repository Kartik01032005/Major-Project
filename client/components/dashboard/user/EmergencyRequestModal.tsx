"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiAlertCircle, FiMapPin, FiPhone, FiCheck } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth, useDashboard, useTranslation } from "@/context";
import { BloodGroup, UserGpsLocation, SelectedHospital } from "@/types";
import Select from "@/components/ui/Select";
import { ALL_STATES, getDistrictsByState } from "@/utils/locations";
import HospitalAutocomplete from "@/components/emergency/HospitalAutocomplete";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface EmergencyRequestModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EmergencyRequestModal({ open, onClose }: EmergencyRequestModalProps) {
  const { user } = useAuth();
  const { createRequest } = useDashboard();
  const { t } = useTranslation();

  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(user?.bloodGroup ?? "O+");
  const [state, setState] = useState(user?.location?.state ?? "");
  const [district, setDistrict] = useState(user?.location?.district ?? "");
  const [hospitalName, setHospitalName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState(user?.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // User's browser GPS coordinates
  const [userLocation, setUserLocation] = useState<UserGpsLocation | null>(null);

  // Selected hospital location metadata
  const [selectedHospital, setSelectedHospital] = useState<SelectedHospital | null>(null);
  const [isAddressUserModified, setIsAddressUserModified] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!state.trim()) e.state = t("emergency_err_state");
    if (!district.trim()) e.district = t("emergency_err_district");
    if (!hospitalName.trim()) e.hospitalName = t("emergency_err_hospital");
    if (!address.trim()) e.address = t("emergency_err_address");
    if (!contactNumber.trim()) e.contactNumber = t("emergency_err_contact_required");
    else if (!/^\d{10}$/.test(contactNumber)) e.contactNumber = t("emergency_err_contact_invalid");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleHospitalSelect = (hosp: SelectedHospital) => {
    setHospitalName(hosp.name);
    setSelectedHospital(hosp);

    if (!isAddressUserModified || !address.trim()) {
      if (hosp.address) {
        setAddress(hosp.address);
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.hospitalName;
      return next;
    });
  };

  const handleHospitalChange = (name: string) => {
    setHospitalName(name);
    if (selectedHospital && selectedHospital.name !== name) {
      setSelectedHospital(null);
    }
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await createRequest({
        bloodGroup,
        state,
        district,
        hospitalName,
        address,
        contactNumber,
        hospitalLatitude: selectedHospital?.latitude,
        hospitalLongitude: selectedHospital?.longitude,
        hospitalAddress: selectedHospital?.address,
        hospitalOsmId: selectedHospital?.osmId,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      console.error("Failed to create emergency request:", err);
      setErrors({ form: errorObj?.response?.data?.message || t("emergency_err_generic") });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setErrors({});
    setSelectedHospital(null);
    setIsAddressUserModified(false);
    onClose();
  };

  const inputCls = (field: string) =>
    [
      "w-full h-10 px-3.5 rounded-xl border text-sm",
      "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
      "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500",
      "transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500",
      errors[field]
        ? "border-red-400 dark:border-red-500"
        : "border-slate-200 dark:border-slate-700",
    ].join(" ");

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("emergency_title")}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className={[
              "fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[calc(100vw-2rem)] max-w-lg",
              "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl",
              "border border-slate-200 dark:border-slate-800 overflow-hidden",
            ].join(" ")}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/20">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600">
                <FiAlertCircle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{t("emergency_title")}</h2>
                  {userLocation && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-medium border border-emerald-200 dark:border-emerald-800">
                      GPS Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("emergency_subtitle")}</p>
              </div>
              <button
                onClick={handleClose}
                className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <FiX size={17} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {submitted ? (
                /* Success state */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-6 py-12 flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 mb-4">
                    <FiCheck size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t("emergency_success_title")}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    {t("emergency_success_sub")} (<strong>{bloodGroup}</strong>)
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    {t("emergency_close")}
                  </button>
                </motion.div>
              ) : (
                /* Form */
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto"
                  noValidate
                >
                  {/* Blood Group */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("emergency_blood_group_label")}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_GROUPS.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setBloodGroup(bg)}
                          className={[
                            "flex items-center justify-center gap-1 h-10 rounded-xl text-sm font-bold border-2 transition-all",
                            bloodGroup === bg
                              ? "border-red-600 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-300 dark:hover:border-red-700",
                          ].join(" ")}
                        >
                          <FaDroplet size={11} /> {bg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location Dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label={t("emergency_state")}
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        setDistrict("");
                        setErrors((prev) => ({ ...prev, state: "", district: "" }));
                      }}
                      error={errors.state}
                      placeholder={t("register_ph_state") || "Select State"}
                      leftIcon={<FiMapPin size={16} />}
                      options={ALL_STATES}
                      required
                    />
                    <Select
                      label={t("emergency_district")}
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        setErrors((prev) => ({ ...prev, district: "" }));
                      }}
                      error={errors.district}
                      placeholder={
                        state
                          ? (t("register_ph_district") || "Select District")
                          : "Select State first"
                      }
                      leftIcon={<FiMapPin size={16} />}
                      options={state ? getDistrictsByState(state) : []}
                      disabled={!state}
                      required
                    />
                  </div>

                  {/* Hospital */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("emergency_hospital")}
                      </label>
                      {selectedHospital?.distanceKm !== undefined && (
                        <span className="text-[11px] text-red-600 dark:text-red-400 font-medium truncate max-w-[200px]">
                          {selectedHospital.distanceKm < 10 ? "Nearby: " : ""}{selectedHospital.name} ({selectedHospital.distanceKm.toFixed(1)} km)
                        </span>
                      )}
                    </div>
                    <HospitalAutocomplete
                      value={hospitalName}
                      onChange={handleHospitalChange}
                      onSelectHospital={handleHospitalSelect}
                      onUserLocationDetected={(loc) => setUserLocation(loc)}
                      error={errors.hospitalName}
                      placeholder={t("emergency_ph_hospital") || "Search hospital..."}
                    />
                    {errors.hospitalName && <p id="hospital-error" className="text-[11px] text-red-500 mt-1">{errors.hospitalName}</p>}
                  </div>

                  {/* Address */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("emergency_address")}
                      </label>
                      {selectedHospital?.address && !isAddressUserModified && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Auto-filled from OSM
                        </span>
                      )}
                    </div>
                    <textarea
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setIsAddressUserModified(true);
                      }}
                      placeholder={t("emergency_ph_address")}
                      rows={2}
                      className={[
                        "w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none",
                        "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                        "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500",
                        "transition-colors placeholder:text-slate-400",
                        errors.address ? "border-red-400" : "border-slate-200 dark:border-slate-700",
                      ].join(" ")}
                      aria-describedby={errors.address ? "address-error" : undefined}
                    />
                    {errors.address && <p id="address-error" className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
                  </div>

                  {/* Contact */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("emergency_contact")}
                    </label>
                    <div className="relative">
                      <FiPhone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder={t("emergency_ph_contact")}
                        maxLength={10}
                        className={[inputCls("contactNumber"), "pl-9"].join(" ")}
                        aria-describedby={errors.contactNumber ? "contact-error" : undefined}
                      />
                    </div>
                    {errors.contactNumber && <p id="contact-error" className="text-[11px] text-red-500 mt-1">{errors.contactNumber}</p>}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={[
                      "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white",
                      "bg-red-600 hover:bg-red-700 transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
                      loading ? "opacity-70 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t("emergency_submitting")}</>
                    ) : (
                      <><FiAlertCircle size={16} /> {t("emergency_submit")}</>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
