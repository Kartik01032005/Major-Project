"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff,
  FiMapPin, FiActivity, FiUserCheck, FiHeart, FiPlusSquare, FiShield
} from "react-icons/fi";
import { useAuth, useTranslation, useToast } from "@/context";
import { UserRole } from "@/types";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { ALL_STATES, getDistrictsByState } from "@/utils/locations";

function RegisterFormContent() {
  const { register } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role");

  // Active role tab ("USER" = Individual Donor, "BLOOD_BANK" = Blood Bank, "HOSPITAL" = Hospital)
  const [role, setRole] = useState<UserRole>(() => {
    if (initialRole === "HOSPITAL" || initialRole === "hospital") return "HOSPITAL";
    if (initialRole === "admin" || initialRole === "BLOOD_BANK" || initialRole === "blood_bank") return "BLOOD_BANK";
    return "USER";
  });

  // Form Field States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Institutional fields
  const [organizationName, setOrganizationName] = useState("");
  const [address, setAddress] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");

  // Loading/Error states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const isInstitution = role === "BLOOD_BANK" || role === "HOSPITAL" || role === "admin";

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    let isValid = true;

    if (!name) {
      tempErrors.name = !isInstitution ? t("register_err_name_required") : "Contact / Authorized person name is required";
      isValid = false;
    }

    if (isInstitution && !organizationName) {
      tempErrors.organizationName = role === "HOSPITAL" ? "Hospital name is required" : (t("register_err_org_required") || "Organization name is required");
      isValid = false;
    }

    if (role === "HOSPITAL" && !registrationNumber) {
      tempErrors.registrationNumber = "Hospital registration / license number is required";
      isValid = false;
    }

    if (role === "HOSPITAL" && !address) {
      tempErrors.address = "Hospital campus / street address is required";
      isValid = false;
    }

    if (!email) {
      tempErrors.email = t("register_err_email_required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = t("register_err_email_invalid");
      isValid = false;
    }

    if (!phone) {
      tempErrors.phone = t("register_err_phone_required");
      isValid = false;
    } else if (!/^\d{10}$/.test(phone)) {
      tempErrors.phone = t("register_err_phone_invalid");
      isValid = false;
    }

    if (!password) {
      tempErrors.password = t("register_err_password_required");
      isValid = false;
    } else if (password.length < 6) {
      tempErrors.password = t("register_err_password_length");
      isValid = false;
    }

    if (!state) {
      tempErrors.state = t("register_err_state_required");
      isValid = false;
    }
    if (!district) {
      tempErrors.district = t("register_err_district_required");
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name,
        ...(isInstitution && { organizationName }),
        ...(address && { address }),
        ...(registrationNumber && { registrationNumber }),
        email,
        phone,
        password,
        role,
        location: {
          state,
          district,
          latitude: 12.305, // Default mock coordinates for state/district
          longitude: 76.645,
        }
      };

      const response = await register(payload);
      if (response.success) {
        toast.success("Account created successfully! Welcome to BloodLink.");
        if (role === "BLOOD_BANK" || role === "admin") {
          router.push("/dashboard/admin");
        } else if (role === "HOSPITAL") {
          router.push("/dashboard/hospital");
        } else {
          router.push("/dashboard");
        }
      } else {
        setGeneralError(response.message);
        toast.error(response.message || "Failed to register account.");
      }
    } catch {
      setGeneralError(t("register_err_generic"));
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg" className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-600 mb-4">
          <FiActivity size={22} className="animate-heartbeat" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {role === "HOSPITAL"
            ? "Register Hospital Account"
            : role === "BLOOD_BANK"
            ? "Register Blood Bank Account"
            : t("register_title")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {role === "HOSPITAL"
            ? "Register your hospital or healthcare facility with BloodLink"
            : role === "BLOOD_BANK"
            ? "Register your blood bank facility to manage inventories"
            : t("register_subtitle")}
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6 border border-slate-200/50 dark:border-slate-800">
        <button
          type="button"
          onClick={() => { setRole("USER"); setErrors({}); setGeneralError(""); }}
          className={[
            "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all",
            role === "USER" || role === "user"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          ].join(" ")}
        >
          <FiUser size={13} />
          {t("register_tab_donor") || "Donor"}
        </button>
        <button
          type="button"
          onClick={() => { setRole("BLOOD_BANK"); setErrors({}); setGeneralError(""); }}
          className={[
            "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all",
            role === "BLOOD_BANK" || role === "admin"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          ].join(" ")}
        >
          <FiUserCheck size={13} />
          {t("register_tab_admin") || "Blood Bank"}
        </button>
        <button
          type="button"
          onClick={() => { setRole("HOSPITAL"); setErrors({}); setGeneralError(""); }}
          className={[
            "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all",
            role === "HOSPITAL"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          ].join(" ")}
        >
          <FiPlusSquare size={13} />
          Hospital
        </button>
      </div>

      {/* Institutional Demo Notice */}
      {isInstitution && (
        <div className="mb-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-700 dark:text-blue-400 flex items-start gap-2">
          <FiShield className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" size={15} />
          <span>
            College Project Demo Mode: Institutional accounts are activated immediately with direct dashboard access.
          </span>
        </div>
      )}

      {/* General Error */}
      {generalError && (
        <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-xs font-medium text-red-700 dark:text-red-400">
          {generalError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {!isInstitution ? (
              // Individual Donor fields
              <>
                <Input
                  label={t("register_label_full_name")}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  placeholder={t("register_ph_full_name")}
                  leftIcon={<FiUser size={16} />}
                  required
                />
              </>
            ) : (
              // Institutional fields (Blood Bank / Hospital)
              <>
                <Input
                  label={role === "HOSPITAL" ? "Hospital / Facility Name" : t("register_label_org_name")}
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  error={errors.organizationName}
                  placeholder={role === "HOSPITAL" ? "e.g. City General Hospital" : t("register_ph_org_name")}
                  leftIcon={<FiHeart size={16} />}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={role === "HOSPITAL" ? "Authorized Officer / Nodal Contact" : t("register_label_contact_name")}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    placeholder="Full name of representative"
                    leftIcon={<FiUser size={16} />}
                    required
                  />
                  <Input
                    label="Registration / License Number"
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    error={errors.registrationNumber}
                    placeholder={role === "HOSPITAL" ? "e.g. HSP-REG-84729" : "e.g. BB-LIC-10294"}
                    leftIcon={<FiShield size={16} />}
                    required={role === "HOSPITAL"}
                  />
                </div>
                <Input
                  label="Official Address / Campus"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  error={errors.address}
                  placeholder="Street address, building, campus location"
                  leftIcon={<FiMapPin size={16} />}
                  required={role === "HOSPITAL"}
                />
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isInstitution ? "Official Email" : t("register_label_email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder={isInstitution ? "official@hospital.org" : t("register_ph_email")}
                leftIcon={<FiMail size={16} />}
                required
              />
              <Input
                label={isInstitution ? "Official Phone" : t("register_label_phone")}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                placeholder={t("register_ph_phone")}
                leftIcon={<FiPhone size={16} />}
                required
              />
            </div>

            <Input
              label={t("register_label_password")}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder={t("register_ph_password")}
              leftIcon={<FiLock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                  aria-label={showPassword ? t("login_hide_password") : t("login_show_password")}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              }
              required
            />

            {/* State & District Dropdown Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t("register_label_state")}
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
                label={t("register_label_district")}
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
          </motion.div>
        </AnimatePresence>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          fullWidth
          className="mt-6"
        >
          {role === "HOSPITAL"
            ? "Submit Hospital Registration"
            : role === "BLOOD_BANK"
            ? "Submit Blood Bank Registration"
            : t("register_submit")}
        </Button>
      </form>

      {/* Footer Link */}
      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        {t("register_have_account")}{" "}
        <Link
          href={`/login${role === "HOSPITAL" ? "?role=HOSPITAL" : role === "BLOOD_BANK" ? "?role=BLOOD_BANK" : ""}`}
          className="font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        >
          {t("register_login_link")}
        </Link>
      </p>
    </Card>
  );
}

// Fallback loader for search param parsing
const FormLoader = () => (
  <div className="flex flex-col items-center justify-center p-12">
    <div className="w-10 h-10 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
  </div>
);

export default function RegisterPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-slate-950 dark:via-transparent dark:to-slate-950 pointer-events-none" />

      {/* Decorative gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-red-500/5 blur-3xl pointer-events-none" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="w-full max-w-xl relative z-10"
      >
        <Suspense fallback={<FormLoader />}>
          <RegisterFormContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
