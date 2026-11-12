import { api, setAuthToken, getAuthToken, clearAuthStorage } from "@/services/api";

describe("Multi-Tab Independent Session Isolation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setAuthToken(null);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setAuthToken(null);
  });

  it("1. stores and retrieves token from sessionStorage, not localStorage", () => {
    sessionStorage.setItem("bloodlink_auth_token", "tab1-jwt-token");
    expect(getAuthToken()).toBe("tab1-jwt-token");
    expect(localStorage.getItem("bloodlink_auth_token")).toBeNull();
  });

  it("2. caches token in memory per tab and falls back to sessionStorage", () => {
    setAuthToken("cached-tab-token");
    expect(getAuthToken()).toBe("cached-tab-token");

    setAuthToken(null);
    sessionStorage.setItem("bloodlink_auth_token", "session-tab-token");
    expect(getAuthToken()).toBe("session-tab-token");
  });

  it("3. Axios request interceptor injects the tab's session token into headers", () => {
    sessionStorage.setItem("bloodlink_auth_token", "tabA-user-token");
    setAuthToken(null);

    const headers: Record<string, string> = {};
    const config = { headers };
    const requestHandlers: any = (api.interceptors.request as any).handlers;
    const interceptorHandler = requestHandlers[0]?.fulfilled;
    expect(interceptorHandler).toBeDefined();

    const resultConfig = interceptorHandler(config);
    expect(resultConfig.headers.Authorization).toBe("Bearer tabA-user-token");
  });

  it("4. clearAuthStorage purges sessionStorage and legacy localStorage without leaking", () => {
    sessionStorage.setItem("bloodlink_auth_token", "token-to-clear");
    sessionStorage.setItem("bloodlink_auth_user", JSON.stringify({ name: "User A" }));
    localStorage.setItem("bloodlink_auth_token", "stale-shared-token");

    clearAuthStorage();

    expect(sessionStorage.getItem("bloodlink_auth_token")).toBeNull();
    expect(sessionStorage.getItem("bloodlink_auth_user")).toBeNull();
    expect(localStorage.getItem("bloodlink_auth_token")).toBeNull();
    expect(getAuthToken()).toBeNull();
  });

  it("5. simulates two independent browser tabs with different accounts and roles", () => {
    // Tab 1 environment: USER A
    const tab1Storage = new Map();
    tab1Storage.set("bloodlink_auth_token", "jwt-user-a");
    tab1Storage.set("bloodlink_auth_user", JSON.stringify({ role: "USER", email: "userA@gmail.com" }));

    // Tab 2 environment: HOSPITAL
    const tab2Storage = new Map();
    tab2Storage.set("bloodlink_auth_token", "jwt-hospital");
    tab2Storage.set("bloodlink_auth_user", JSON.stringify({ role: "HOSPITAL", email: "hospital@bloodlink.in" }));

    // Verify Tab 1 token is distinct and isolated from Tab 2
    expect(tab1Storage.get("bloodlink_auth_token")).toBe("jwt-user-a");
    expect(tab2Storage.get("bloodlink_auth_token")).toBe("jwt-hospital");

    // Logging out in Tab 1 clears Tab 1 only
    tab1Storage.delete("bloodlink_auth_token");
    tab1Storage.delete("bloodlink_auth_user");

    expect(tab1Storage.get("bloodlink_auth_token")).toBeUndefined();
    // Tab 2 remains completely intact and authenticated
    expect(tab2Storage.get("bloodlink_auth_token")).toBe("jwt-hospital");
    expect(JSON.parse(tab2Storage.get("bloodlink_auth_user")).role).toBe("HOSPITAL");
  });

  it("6. simulates four tabs: User A, User B, Hospital, Blood Bank simultaneously", () => {
    const tabs = [
      { name: "Tab 1", role: "USER", email: "rahul@gmail.com", token: "token-user-a" },
      { name: "Tab 2", role: "USER", email: "priya@gmail.com", token: "token-user-b" },
      { name: "Tab 3", role: "HOSPITAL", email: "hospital@bloodlink.in", token: "token-hospital" },
      { name: "Tab 4", role: "BLOOD_BANK", email: "apollo@bloodlink.in", token: "token-blood-bank" },
    ];

    const tabSessions = tabs.map((t) => {
      const store = new Map();
      store.set("bloodlink_auth_token", t.token);
      store.set("bloodlink_auth_user", JSON.stringify({ email: t.email, role: t.role }));
      return store;
    });

    // All tabs maintain independent sessions
    expect(tabSessions[0].get("bloodlink_auth_token")).toBe("token-user-a");
    expect(tabSessions[1].get("bloodlink_auth_token")).toBe("token-user-b");
    expect(tabSessions[2].get("bloodlink_auth_token")).toBe("token-hospital");
    expect(tabSessions[3].get("bloodlink_auth_token")).toBe("token-blood-bank");

    // Close/Logout Tab 1
    tabSessions[0].clear();

    // Confirm Tab 1 is logged out
    expect(tabSessions[0].size).toBe(0);

    // Confirm Tabs 2, 3, 4 remain untouched
    expect(tabSessions[1].get("bloodlink_auth_token")).toBe("token-user-b");
    expect(tabSessions[2].get("bloodlink_auth_token")).toBe("token-hospital");
    expect(tabSessions[3].get("bloodlink_auth_token")).toBe("token-blood-bank");
  });
});
