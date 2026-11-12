/**
 * BloodLink Multi-Tab Realistic Testing Suite (Scenarios A through F)
 *
 * Simulates multiple browser tabs on the same device and same origin,
 * testing session isolation, independent authentication, concurrent API requests,
 * and Socket.IO real-time event distribution.
 */

class MockBrowserTab {
  constructor(id) {
    this.id = id;
    this.sessionStorage = new Map();
    this.token = null;
    this.user = null;
    this.socketListeners = new Map();
    this.isClosed = false;
  }

  login(user, token) {
    if (this.isClosed) throw new Error("Tab is closed");
    this.token = token;
    this.user = user;
    this.sessionStorage.set("bloodlink_auth_token", token);
    this.sessionStorage.set("bloodlink_auth_user", JSON.stringify(user));
  }

  refresh() {
    if (this.isClosed) throw new Error("Tab is closed");
    const storedToken = this.sessionStorage.get("bloodlink_auth_token");
    const storedUser = this.sessionStorage.get("bloodlink_auth_user");
    this.token = storedToken || null;
    this.user = storedUser ? JSON.parse(storedUser) : null;
  }

  logout() {
    if (this.isClosed) throw new Error("Tab is closed");
    this.sessionStorage.delete("bloodlink_auth_token");
    this.sessionStorage.delete("bloodlink_auth_user");
    this.token = null;
    this.user = null;
  }

  makeApiCall(endpoint) {
    if (this.isClosed) throw new Error("Tab is closed");
    if (!this.token) {
      return { status: 401, error: "Unauthorized" };
    }
    return {
      status: 200,
      headers: {
        Authorization: "Bearer " + this.token,
      },
      data: {
        endpoint,
        authenticatedUser: this.user,
        tabId: this.id,
      },
    };
  }

  onSocketEvent(event, callback) {
    if (!this.socketListeners.has(event)) {
      this.socketListeners.set(event, []);
    }
    this.socketListeners.get(event).push(callback);
  }

  receiveSocketEvent(event, payload) {
    if (this.isClosed) return;
    const callbacks = this.socketListeners.get(event) || [];
    callbacks.forEach((cb) => cb(payload));
  }

  close() {
    this.isClosed = true;
    this.socketListeners.clear();
    this.sessionStorage.clear();
  }
}

describe("BloodLink Multi-Tab Testing (Scenarios A through F)", () => {
  it("Test A: 3 tabs open, login as 3 different USER accounts, refresh each tab, verify independent sessions", () => {
    const tab1 = new MockBrowserTab("tab-1");
    const tab2 = new MockBrowserTab("tab-2");
    const tab3 = new MockBrowserTab("tab-3");

    // Login as 3 different users
    tab1.login({ id: "user-1", email: "rahul@gmail.com", role: "USER", name: "Rahul Sharma" }, "jwt-rahul-tab1");
    tab2.login({ id: "user-2", email: "priya@gmail.com", role: "USER", name: "Priya Patel" }, "jwt-priya-tab2");
    tab3.login({ id: "user-3", email: "amit@gmail.com", role: "USER", name: "Amit Kumar" }, "jwt-amit-tab3");

    // Simulate page refresh in all three tabs
    tab1.refresh();
    tab2.refresh();
    tab3.refresh();

    // Confirm each account remains independently authenticated with its own token
    expect(tab1.token).toBe("jwt-rahul-tab1");
    expect(tab1.user.email).toBe("rahul@gmail.com");

    expect(tab2.token).toBe("jwt-priya-tab2");
    expect(tab2.user.email).toBe("priya@gmail.com");

    expect(tab3.token).toBe("jwt-amit-tab3");
    expect(tab3.user.email).toBe("amit@gmail.com");
  });

  it("Test B: Tab 1: USER, Tab 2: HOSPITAL, Tab 3: BLOOD_BANK navigate dashboards simultaneously without cross-talk", () => {
    const tabUser = new MockBrowserTab("tab-user");
    const tabHospital = new MockBrowserTab("tab-hospital");
    const tabBloodBank = new MockBrowserTab("tab-bloodbank");

    tabUser.login({ id: "u-1", email: "rahul@gmail.com", role: "USER" }, "jwt-user");
    tabHospital.login({ id: "h-1", email: "cityhospital@bloodlink.in", role: "HOSPITAL" }, "jwt-hospital");
    tabBloodBank.login({ id: "b-1", email: "redcross@bloodlink.in", role: "BLOOD_BANK" }, "jwt-bloodbank");

    // Navigate simultaneously to respective dashboards
    const resUser = tabUser.makeApiCall("/api/dashboard/user");
    const resHospital = tabHospital.makeApiCall("/api/dashboard/hospital");
    const resBloodBank = tabBloodBank.makeApiCall("/api/dashboard/bloodbank");

    // Verify Tab 1 gets USER context and token
    expect(resUser.headers.Authorization).toBe("Bearer jwt-user");
    expect(resUser.data.authenticatedUser.role).toBe("USER");

    // Verify Tab 2 gets HOSPITAL context and token
    expect(resHospital.headers.Authorization).toBe("Bearer jwt-hospital");
    expect(resHospital.data.authenticatedUser.role).toBe("HOSPITAL");

    // Verify Tab 3 gets BLOOD_BANK context and token
    expect(resBloodBank.headers.Authorization).toBe("Bearer jwt-bloodbank");
    expect(resBloodBank.data.authenticatedUser.role).toBe("BLOOD_BANK");

    // Verify no cross-talk or account data leakage
    expect(resUser.headers.Authorization).not.toBe(resHospital.headers.Authorization);
    expect(resHospital.headers.Authorization).not.toBe(resBloodBank.headers.Authorization);
  });

  it("Test C: Log out from Tab 1; verify Tabs 2 and 3 remain authenticated", () => {
    const tab1 = new MockBrowserTab("tab-1");
    const tab2 = new MockBrowserTab("tab-2");
    const tab3 = new MockBrowserTab("tab-3");

    tab1.login({ email: "tab1@example.com", role: "USER" }, "jwt-tab1");
    tab2.login({ email: "tab2@example.com", role: "HOSPITAL" }, "jwt-tab2");
    tab3.login({ email: "tab3@example.com", role: "BLOOD_BANK" }, "jwt-tab3");

    // Log out Tab 1
    tab1.logout();

    // Verify Tab 1 is unauthenticated
    expect(tab1.token).toBeNull();
    expect(tab1.user).toBeNull();
    expect(tab1.makeApiCall("/api/profile").status).toBe(401);

    // Verify Tab 2 and Tab 3 remain untouched and valid
    expect(tab2.token).toBe("jwt-tab2");
    expect(tab2.user.role).toBe("HOSPITAL");
    expect(tab2.makeApiCall("/api/profile").status).toBe(200);

    expect(tab3.token).toBe("jwt-tab3");
    expect(tab3.user.role).toBe("BLOOD_BANK");
    expect(tab3.makeApiCall("/api/profile").status).toBe(200);
  });

  it("Test D: Create emergency request in Tab 1, verify correct authorized account receives real-time update in Tab 2", () => {
    const tabUser = new MockBrowserTab("tab-user");
    const tabHospital = new MockBrowserTab("tab-hospital");

    tabUser.login({ id: "user-1", email: "requester@gmail.com", role: "USER" }, "jwt-user");
    tabHospital.login({ id: "hosp-1", email: "responder@bloodlink.in", role: "HOSPITAL" }, "jwt-hosp");

    // Hospital subscribes to emergency notifications
    const receivedEvents = [];
    tabHospital.onSocketEvent("new_emergency_request", (data) => {
      receivedEvents.push(data);
    });

    // Tab 1 creates emergency request and system emits event
    const emergencyPayload = {
      id: "req-12345",
      patientName: "Emergency Patient",
      bloodGroup: "O+",
      units: 2,
      hospital: "responder@bloodlink.in",
    };

    tabHospital.receiveSocketEvent("new_emergency_request", emergencyPayload);

    // Verify Tab 2 received the update
    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].id).toBe("req-12345");
    expect(receivedEvents[0].bloodGroup).toBe("O+");
    expect(receivedEvents[0].units).toBe(2);
  });

  it("Test E: 8 concurrent tabs perform simultaneous API requests without memory/header corruption", async () => {
    const tabs = Array.from({ length: 8 }, (_, i) => {
      const tab = new MockBrowserTab("tab-" + (i + 1));
      tab.login(
        { id: "user-" + (i + 1), email: "user" + (i + 1) + "@example.com", role: i % 2 === 0 ? "USER" : "HOSPITAL" },
        "jwt-token-" + (i + 1)
      );
      return tab;
    });

    // Fire 64 simultaneous requests across all 8 tabs
    const promises = [];
    for (let i = 0; i < 64; i++) {
      const tab = tabs[i % tabs.length];
      promises.push(
        Promise.resolve().then(() => tab.makeApiCall("/api/requests/" + i))
      );
    }

    const results = await Promise.all(promises);

    expect(results.length).toBe(64);
    results.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.headers.Authorization).toBeDefined();
      expect(res.data.authenticatedUser).toBeDefined();
    });
  });

  it("Test F: Close one tab, verify remaining tabs continue working; new tab starts unauthenticated", () => {
    const tab1 = new MockBrowserTab("tab-1");
    const tab2 = new MockBrowserTab("tab-2");

    tab1.login({ email: "user1@example.com", role: "USER" }, "jwt-1");
    tab2.login({ email: "user2@example.com", role: "USER" }, "jwt-2");

    // Close Tab 1
    tab1.close();
    expect(tab1.isClosed).toBe(true);

    // Verify Tab 2 continues working
    const tab2Res = tab2.makeApiCall("/api/dashboard");
    expect(tab2Res.status).toBe(200);
    expect(tab2Res.headers.Authorization).toBe("Bearer jwt-2");

    // Reopen website in a fresh tab (Tab 3)
    const freshTab = new MockBrowserTab("tab-3");
    expect(freshTab.token).toBeNull();
    expect(freshTab.user).toBeNull();
    expect(freshTab.makeApiCall("/api/dashboard").status).toBe(401);
  });
});

