"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle, FiPhone, FiCheck, FiNavigation } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth } from "@/context";
import { useDashboard } from "@/context";
import { BloodGroup, UserGpsLocation, SelectedHospital } from "@/types";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import HospitalAutocomplete from "@/components/emergency/HospitalAutocomplete";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function EmergencyRequestPage() {
  const { user } = useAuth();
  const { createRequest } = useDashboard();

  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(user?.bloodGroup ?? "O+");
  const [state, setState] = useState(user?.location?.state ?? "");
  const [district, setDistrict] = useState(user?.location?.district ?? "");
  const [hospitalName, setHospitalName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState(user?.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // User's browser GPS coordinates (kept completely separate from hospital location)
  const [userLocation, setUserLocation] = useState<UserGpsLocation | null>(null);

  // Selected hospital location metadata
  const [selectedHospital, setSelectedHospital] = useState<SelectedHospital | null>(null);
  const [isAddressUserModified, setIsAddressUserModified] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!state.trim()) e.state = "State is required";
    if (!district.trim()) e.district = "District is required";
    if (!hospitalName.trim()) e.hospitalName = "Hospital name is required";
    if (!address.trim()) e.address = "Address is required";
    if (!contactNumber.trim()) e.contactNumber = "Contact number is required";
    else if (!/^\d{10}$/.test(contactNumber)) e.contactNumber = "Enter a valid 10-digit number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleHospitalSelect = (hosp: SelectedHospital) => {
    setHospitalName(hosp.name);
    setSelectedHospital(hosp);

    // If user has not typed an address or address is blank, populate with hospital address
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
      // User typed a custom hospital name
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
      setErrors({ form: errorObj?.response?.data?.message || "Failed to submit request. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBloodGroup(user?.bloodGroup ?? "O+");
    setState(user?.location?.state ?? "");
    setDistrict(user?.location?.district ?? "");
    setHospitalName("");
    setSelectedHospital(null);
    setIsAddressUserModified(false);
    setAddress("");
    setContactNumber(user?.phone ?? "");
    setErrors({});
    setSubmitted(false);
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
    <ProtectedRoute requiredRole="user">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiAlertCircle className="text-red-600 animate-pulse" size={24} />
              Emergency Blood Request
            </h1>
            {userLocation && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                <FiNavigation size={12} className="text-emerald-500 animate-pulse" />
                GPS Active (10 km radius)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submit an emergency request to alert nearby donors and blood banks instantly.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 mb-4">
                  <FiCheck size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Request Submitted Successfully!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                  Your request for <strong>{bloodGroup}</strong> blood has been registered. Nearby matching donors and clinics have been notified.
                </p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Create Another Request
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 space-y-5"
                noValidate
              >
                {errors.form && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">
                    {errors.form}
                  </div>
                )}

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Blood Group Required *
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

                {/* Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Karnataka"
                      className={inputCls("state")}
                    />
                    {errors.state && <p className="text-[11px] text-red-500 mt-1">{errors.state}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      District *
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Mysore"
                      className={inputCls("district")}
                    />
                    {errors.district && <p className="text-[11px] text-red-500 mt-1">{errors.district}</p>}
                  </div>
                </div>

                {/* Hospital */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Hospital Name *
                    </label>
                    {selectedHospital?.distanceKm !== undefined && (
                      <span className="text-[11px] text-red-600 dark:text-red-400 font-medium truncate max-w-[240px]">
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
                    placeholder="Search hospital or enter name..."
                  />
                  {errors.hospitalName && <p className="text-[11px] text-red-500 mt-1">{errors.hospitalName}</p>}
                </div>

                {/* Address */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Exact Address *
                    </label>
                    {selectedHospital?.address && !isAddressUserModified && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Auto-filled from OpenStreetMap
                      </span>
                    )}
                  </div>
                  <textarea
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setIsAddressUserModified(true);
                    }}
                    placeholder="Ward no. 4, Main Road..."
                    rows={3}
                    className={[
                      "w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none",
                      "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                      "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500",
                      "transition-colors placeholder:text-slate-400",
                      errors.address ? "border-red-400" : "border-slate-200 dark:border-slate-700",
                    ].join(" ")}
                  />
                  {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Number *
                  </label>
                  <div className="relative">
                    <FiPhone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="10-digit number"
                      maxLength={10}
                      className={[inputCls("contactNumber"), "pl-9"].join(" ")}
                    />
                  </div>
                  {errors.contactNumber && <p className="text-[11px] text-red-500 mt-1">{errors.contactNumber}</p>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white",
                    "bg-red-600 hover:bg-red-700 transition-colors shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
                    loading ? "opacity-70 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  ) : (
                    <><FiAlertCircle size={16} /> Submit Emergency Request</>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProtectedRoute>
  );
}
