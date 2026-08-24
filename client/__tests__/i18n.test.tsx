import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LOCALES, LOCALE_STORAGE_KEY, getTranslations, translations } from "@/i18n";
import { LanguageProvider, useTranslation } from "@/context";
import LanguageSelector from "@/components/ui/LanguageSelector";
import Home from "@/app/page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
}));

describe("Multilingual i18n Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should have all 7 languages configured", () => {
    const codes = LOCALES.map((l) => l.code);
    expect(codes).toEqual(["en", "kn", "ml", "ta", "te", "hi", "mr"]);
    expect(LOCALES).toHaveLength(7);
  });

  it("should have identical key sets across all 7 languages", () => {
    const enKeys = Object.keys(translations.en).sort();
    
    for (const loc of LOCALES) {
      const locKeys = Object.keys(translations[loc.code]).sort();
      expect(locKeys).toEqual(enKeys);
    }
  });

  it("should get correct translation dictionary for each locale", () => {
    for (const loc of LOCALES) {
      const dict = getTranslations(loc.code);
      expect(dict).toBeDefined();
      expect(dict.nav_home).toBeTruthy();
    }
  });

  it("should fallback to English when an invalid locale is provided", () => {
    // @ts-expect-error testing invalid locale
    const fallbackDict = getTranslations("invalid_locale");
    expect(fallbackDict).toEqual(translations.en);
  });

  it("should switch language and update UI via useTranslation", () => {
    const TestComponent = () => {
      const { t, locale, setLocale } = useTranslation();
      return (
        <div>
          <span data-testid="current-locale">{locale}</span>
          <span data-testid="translated-home">{t("nav_home")}</span>
          <button onClick={() => setLocale("hi")}>Switch to Hindi</button>
          <button onClick={() => setLocale("kn")}>Switch to Kannada</button>
          <button onClick={() => setLocale("te")}>Switch to Telugu</button>
          <button onClick={() => setLocale("ta")}>Switch to Tamil</button>
          <button onClick={() => setLocale("ml")}>Switch to Malayalam</button>
          <button onClick={() => setLocale("mr")}>Switch to Marathi</button>
        </div>
      );
    };

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    // Initial state is English
    expect(screen.getByTestId("current-locale")).toHaveTextContent("en");
    expect(screen.getByTestId("translated-home")).toHaveTextContent("Home");

    // Switch to Hindi
    fireEvent.click(screen.getByText("Switch to Hindi"));
    expect(screen.getByTestId("current-locale")).toHaveTextContent("hi");
    expect(screen.getByTestId("translated-home")).toHaveTextContent("होम");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("hi");

    // Switch to Kannada
    fireEvent.click(screen.getByText("Switch to Kannada"));
    expect(screen.getByTestId("current-locale")).toHaveTextContent("kn");
    expect(screen.getByTestId("translated-home")).toHaveTextContent("ಮುಖಪುಟ");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("kn");

    // Switch to Telugu
    fireEvent.click(screen.getByText("Switch to Telugu"));
    expect(screen.getByTestId("current-locale")).toHaveTextContent("te");
    expect(screen.getByTestId("translated-home")).toHaveTextContent("హోమ్");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("te");

    // Switch to Tamil
    fireEvent.click(screen.getByText("Switch to Tamil"));
    expect(screen.getByTestId("current-locale")).toHaveTextContent("ta");
    expect(screen.getByTestId("translated-home")).toHaveTextContent("முகப்பு");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("ta");

    // Switch to Malayalam
    fireEvent.click(screen.getByText("Switch to Malayalam"));
    expect(screen.getByTestId("current-locale")).toHaveTextContent("ml");
    expect(screen.getByTestId("translated-home")).toHaveTextContent("ഹോം");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("ml");

    // Switch to Marathi
    fireEvent.click(screen.getByText("Switch to Marathi"));
    expect(screen.getByTestId("current-locale")).toHaveTextContent("mr");
    expect(screen.getByTestId("translated-home")).toHaveTextContent("मुख्यपृष्ठ");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("mr");
  });

  it("should render LanguageSelector with dropdown and change locale", () => {
    render(
      <LanguageProvider>
        <LanguageSelector />
      </LanguageProvider>
    );

    const triggerBtn = screen.getByRole("button", { name: /select language/i });
    expect(triggerBtn).toBeInTheDocument();
    expect(triggerBtn).toHaveTextContent("English");

    // Click to open dropdown
    fireEvent.click(triggerBtn);

    // Verify all 7 languages are in the dropdown
    expect(screen.getByRole("option", { name: /english/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /ಕನ್ನಡ/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /മലയാളം/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /தமிழ்/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /తెలుగు/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /हिन्दी/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /मराठी/i })).toBeInTheDocument();

    // Select Hindi
    fireEvent.click(screen.getByRole("option", { name: /हिन्दी/i }));
    expect(triggerBtn).toHaveTextContent("हिन्दी");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("hi");
  });

  it("persists the locale after the provider remounts", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "hi");
    const TestComponent = () => {
      const { locale } = useTranslation();
      return <span data-testid="persisted-locale">{locale}</span>;
    };

    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId("persisted-locale")).toHaveTextContent("hi");
    expect(document.documentElement.lang).toBe("hi");
  });

  it("supports keyboard navigation and Escape in the language selector", async () => {
    render(
      <LanguageProvider>
        <LanguageSelector />
      </LanguageProvider>
    );

    const trigger = screen.getByRole("button", { name: /select language/i });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    const english = screen.getByRole("option", { name: /english/i });
    fireEvent.keyDown(english, { key: "End" });
    const marathi = screen.getAllByRole("option")[6];
    expect(marathi).toHaveFocus();
    fireEvent.keyDown(marathi, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("renders the Home landing page wrapped in LanguageProvider", () => {
    render(
      <LanguageProvider>
        <Home />
      </LanguageProvider>
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
