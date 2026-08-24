// Supported locale codes
export type Locale = "en" | "kn" | "ml" | "ta" | "te" | "hi" | "mr";

export interface LocaleInfo {
  code: Locale;
  name: string;     // English name
  native: string;   // Name in the language itself
}

export const LOCALES: LocaleInfo[] = [
  { code: "en", name: "English",   native: "English"   },
  { code: "kn", name: "Kannada",   native: "ಕನ್ನಡ"     },
  { code: "ml", name: "Malayalam", native: "മലയാളം"    },
  { code: "ta", name: "Tamil",     native: "தமிழ்"      },
  { code: "te", name: "Telugu",    native: "తెలుగు"     },
  { code: "hi", name: "Hindi",     native: "हिन्दी"     },
  { code: "mr", name: "Marathi",   native: "मराठी"      },
];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "bloodlink_language";

// ─── Full Translation Dictionary Type ─────────────────────────────────────────
export interface Translations {
  // ── Navbar ──────────────────────────────────────────────────────────────────
  nav_home: string;
  nav_features: string;
  nav_how_it_works: string;
  nav_about: string;
  nav_sign_in: string;
  nav_get_started: string;
  nav_dashboard: string;
  nav_sign_out: string;
  nav_hello: string;
  nav_open_menu: string;
  nav_close_menu: string;
  nav_logged_in_as: string;
  nav_get_started_free: string;

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer_navigation: string;
  footer_legal: string;
  footer_follow_us: string;
  footer_tagline: string;
  footer_privacy: string;
  footer_terms: string;
  footer_rights: string;
  footer_built_by: string;

  // ── Hero Section ─────────────────────────────────────────────────────────────
  hero_badge: string;
  hero_headline_1: string;
  hero_headline_2: string;
  hero_headline_3: string;
  hero_sub: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  hero_stat_donors: string;
  hero_stat_fulfilled: string;
  hero_stat_hospitals: string;
  hero_live_inventory: string;
  hero_blood_banks_nearby: string;
  hero_request_emergency: string;
  hero_donor_found: string;
  hero_seconds_ago: string;

  // ── About Section ────────────────────────────────────────────────────────────
  about_badge: string;
  about_title: string;
  about_sub: string;
  about_mission_title: string;
  about_mission_text: string;
  about_vision_title: string;
  about_vision_text: string;
  about_stat_donors: string;
  about_stat_fulfilled: string;
  about_stat_hospitals: string;
  about_stat_states: string;
  about_stat_donors_label: string;
  about_stat_fulfilled_label: string;
  about_stat_hospitals_label: string;
  about_stat_states_label: string;

  // ── Features Section ─────────────────────────────────────────────────────────
  features_badge: string;
  features_title: string;
  features_sub: string;

  // ── How It Works ─────────────────────────────────────────────────────────────
  hiw_badge: string;
  hiw_title: string;
  hiw_sub: string;

  // ── Why Choose ───────────────────────────────────────────────────────────────
  why_badge: string;
  why_title: string;
  why_sub: string;
  why_cta: string;

  // ── Stats Section ─────────────────────────────────────────────────────────────
  stats_donors: string;
  stats_donors_label: string;
  stats_fulfilled: string;
  stats_fulfilled_label: string;
  stats_hospitals: string;
  stats_hospitals_label: string;
  stats_states: string;
  stats_states_label: string;
  stats_badge: string;
  stats_title: string;
  stats_sub: string;

  // ── CTA Section ──────────────────────────────────────────────────────────────
  cta_badge: string;
  cta_title: string;
  cta_sub: string;
  cta_primary: string;
  cta_secondary: string;
  cta_note: string;

  // ── Login Page ───────────────────────────────────────────────────────────────
  login_title: string;
  login_subtitle: string;
  login_email: string;
  login_email_placeholder: string;
  login_password: string;
  login_password_placeholder: string;
  login_show_password: string;
  login_hide_password: string;
  login_forgot: string;
  login_submit: string;
  login_no_account: string;
  login_register_link: string;
  login_err_email_required: string;
  login_err_email_invalid: string;
  login_err_password_required: string;
  login_err_password_length: string;
  login_err_generic: string;

  // ── Register Page ────────────────────────────────────────────────────────────
  register_title: string;
  register_subtitle: string;
  register_tab_donor: string;
  register_tab_admin: string;
  register_label_full_name: string;
  register_label_org_name: string;
  register_label_contact_name: string;
  register_label_email: string;
  register_label_phone: string;
  register_label_password: string;
  register_label_state: string;
  register_label_district: string;
  register_ph_full_name: string;
  register_ph_org_name: string;
  register_ph_contact_name: string;
  register_ph_email: string;
  register_ph_phone: string;
  register_ph_password: string;
  register_ph_state: string;
  register_ph_district: string;
  register_submit: string;
  register_have_account: string;
  register_login_link: string;
  register_err_name_required: string;
  register_err_contact_required: string;
  register_err_org_required: string;
  register_err_email_required: string;
  register_err_email_invalid: string;
  register_err_phone_required: string;
  register_err_phone_invalid: string;
  register_err_password_required: string;
  register_err_password_length: string;
  register_err_state_required: string;
  register_err_district_required: string;
  register_err_generic: string;

  // ── Dashboard Sidebar ─────────────────────────────────────────────────────────
  sidebar_overview: string;
  sidebar_my_profile: string;
  sidebar_emergency_request: string;
  sidebar_my_requests: string;
  sidebar_notifications: string;
  sidebar_nearby_banks: string;
  sidebar_blood_inventory: string;
  sidebar_hospitals: string;
  sidebar_emergency_requests: string;
  sidebar_sign_out: string;
  sidebar_collapse: string;
  sidebar_expand: string;
  sidebar_close_nav: string;
  sidebar_open_nav: string;

  // ── Dashboard Topbar ──────────────────────────────────────────────────────────
  topbar_overview: string;
  topbar_my_profile: string;
  topbar_emergency_request: string;
  topbar_my_requests: string;
  topbar_notifications: string;
  topbar_nearby_banks: string;
  topbar_admin_overview: string;
  topbar_blood_inventory: string;
  topbar_hospital_management: string;
  topbar_emergency_requests: string;
  topbar_mark_all_read: string;
  topbar_no_notifications: string;
  topbar_notifications_label: string;
  topbar_administrator: string;
  topbar_donor_account: string;
  topbar_dashboard: string;

  // ── Welcome Banner ────────────────────────────────────────────────────────────
  banner_good_morning: string;
  banner_good_afternoon: string;
  banner_good_evening: string;
  banner_subtitle: string;
  banner_blood_group: string;
  banner_available: string;
  banner_not_available: string;
  banner_emergency_btn: string;
  banner_emergency_note: string;
  banner_donor_available_label: string;

  // ── Profile Card ──────────────────────────────────────────────────────────────
  profile_member_since: string;
  profile_edit: string;
  profile_save: string;
  profile_cancel: string;
  profile_saved: string;
  profile_email: string;
  profile_phone: string;
  profile_location: string;
  profile_joined: string;
  profile_not_set: string;
  profile_delete_title: string;
  profile_delete_description: string;
  profile_delete_btn: string;
  profile_delete_confirm_title: string;
  profile_delete_confirm_description: string;
  profile_delete_confirm_btn: string;
  profile_delete_cancel_btn: string;
  profile_deleting: string;

  // ── Active Requests Card ──────────────────────────────────────────────────────
  requests_title: string;
  requests_new: string;
  requests_empty_title: string;
  requests_empty_sub: string;
  requests_create_btn: string;
  requests_cancel: string;
  requests_cancelling: string;
  requests_confirm_cancel: string;
  requests_status_pending: string;
  requests_status_approved: string;
  requests_status_rejected: string;
  requests_status_completed: string;
  requests_status_cancelled: string;

  // ── Notifications Panel ───────────────────────────────────────────────────────
  notifications_title: string;
  notifications_new: string;
  notifications_mark_all: string;
  notifications_empty_title: string;
  notifications_empty_sub: string;
  notifications_unread: string;

  // ── Emergency Request Modal ───────────────────────────────────────────────────
  emergency_title: string;
  emergency_subtitle: string;
  emergency_blood_group_label: string;
  emergency_state: string;
  emergency_district: string;
  emergency_hospital: string;
  emergency_address: string;
  emergency_contact: string;
  emergency_ph_hospital: string;
  emergency_ph_address: string;
  emergency_ph_contact: string;
  emergency_submit: string;
  emergency_submitting: string;
  emergency_success_title: string;
  emergency_success_sub: string;
  emergency_close: string;
  emergency_err_state: string;
  emergency_err_district: string;
  emergency_err_hospital: string;
  emergency_err_address: string;
  emergency_err_contact_required: string;
  emergency_err_contact_invalid: string;
  emergency_err_generic: string;

  // ── Nearby Blood Banks Card ───────────────────────────────────────────────────
  nearby_title: string;
  nearby_empty: string;
  nearby_km: string;
  nearby_view_map: string;
  nearby_loading: string;
  nearby_error: string;

  // ── Admin Stats ───────────────────────────────────────────────────────────────
  admin_stat_total_inventory: string;
  admin_stat_hospitals: string;
  admin_stat_pending_requests: string;
  admin_stat_low_stock: string;
  admin_stat_units: string;

  // ── Blood Inventory Table ─────────────────────────────────────────────────────
  inventory_title: string;
  inventory_add: string;
  inventory_edit: string;
  inventory_delete: string;
  inventory_blood_group: string;
  inventory_units: string;
  inventory_threshold: string;
  inventory_status: string;
  inventory_hospital: string;
  inventory_updated: string;
  inventory_no_records: string;
  inventory_low_stock: string;
  inventory_adequate: string;
  inventory_critical: string;
  inventory_save: string;
  inventory_cancel: string;
  inventory_confirm_delete: string;
  inventory_bulk_upload: string;
  inventory_set_thresholds: string;
  inventory_upload_history: string;
  inventory_search: string;
  inventory_filter_hospital: string;
  inventory_filter_status: string;
  inventory_all_hospitals: string;
  inventory_all_statuses: string;
  inventory_actions: string;
  inventory_loading: string;

  // ── Emergency Requests Table (Admin) ──────────────────────────────────────────
  admin_requests_title: string;
  admin_requests_hospital: string;
  admin_requests_location: string;
  admin_requests_contact: string;
  admin_requests_status: string;
  admin_requests_date: string;
  admin_requests_no_records: string;
  admin_requests_approve: string;
  admin_requests_reject: string;
  admin_requests_blood_group: string;
  admin_requests_requested_by: string;
  admin_requests_actions: string;
  admin_requests_loading: string;
  admin_requests_search: string;
  admin_requests_filter_status: string;
  admin_requests_all_statuses: string;

  // ── Hospital Management ───────────────────────────────────────────────────────
  hospital_title: string;
  hospital_add: string;
  hospital_edit: string;
  hospital_delete: string;
  hospital_name: string;
  hospital_location: string;
  hospital_contact: string;
  hospital_email: string;
  hospital_no_records: string;
  hospital_save: string;
  hospital_cancel: string;
  hospital_confirm_delete: string;
  hospital_search: string;
  hospital_loading: string;
  hospital_actions: string;

  // ── Bulk Upload Modal ─────────────────────────────────────────────────────────
  bulk_upload_title: string;
  bulk_upload_subtitle: string;
  bulk_upload_drag: string;
  bulk_upload_or: string;
  bulk_upload_browse: string;
  bulk_upload_submit: string;
  bulk_upload_uploading: string;
  bulk_upload_success: string;
  bulk_upload_error: string;
  bulk_upload_close: string;
  bulk_upload_download_template: string;

  // ── Upload History Modal ──────────────────────────────────────────────────────
  upload_history_title: string;
  upload_history_file: string;
  upload_history_date: string;
  upload_history_status: string;
  upload_history_records: string;
  upload_history_empty: string;

  // ── Stock Thresholds Modal ────────────────────────────────────────────────────
  thresholds_title: string;
  thresholds_subtitle: string;
  thresholds_blood_group: string;
  thresholds_min_units: string;
  thresholds_save: string;
  thresholds_cancel: string;

  // ── 404 Page ──────────────────────────────────────────────────────────────────
  notfound_title: string;
  notfound_description: string;
  notfound_home: string;
  notfound_dashboard: string;

  // ── Error Page ────────────────────────────────────────────────────────────────
  error_title: string;
  error_description: string;
  error_retry: string;
  error_home: string;

  // ── Loading States ─────────────────────────────────────────────────────────────
  loading_general: string;
  loading_dashboard: string;

  // ── Common ─────────────────────────────────────────────────────────────────────
  common_required_mark: string;
  common_new: string;
  common_just_now: string;
  common_ago_minutes: string;
  common_ago_hours: string;
  common_ago_days: string;
}
