import { ChatMessage, QuickQuestion } from "@/types/chatbot";

export const DEFAULT_QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: "q-compatibility",
    label: "🩸 Blood Compatibility",
    query: "Who can receive my blood group?",
    category: "compatibility",
  },
  {
    id: "q-donate",
    label: "💉 Donation Guidelines",
    query: "Am I eligible to donate blood?",
    category: "donation",
  },
  {
    id: "q-emergency",
    label: "🚨 Emergency Request",
    query: "How do I create an emergency blood request?",
    category: "emergency",
  },
  {
    id: "q-hospitals",
    label: "🏥 Find Nearby Hospitals",
    query: "Where are nearby blood banks and hospitals?",
    category: "hospitals",
  },
  {
    id: "q-how-it-works",
    label: "🛡️ How BloodLink Works",
    query: "How does the BloodLink platform work?",
    category: "features",
  },
];

export const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-1",
  sender: "assistant",
  text: `Hello! 👋 I am your **BloodLink Assistant**.\n\nI can help you with blood compatibility, donation guidelines, emergency requests, finding nearby hospitals, or navigating the platform.\n\n*How can I help you save a life today?*`,
  timestamp: new Date(),
  quickReplies: [
    "Blood Compatibility",
    "Can I donate blood?",
    "Emergency Request",
    "Find Hospitals",
  ],
  category: "general",
};

const MEDICAL_DISCLAIMER = `\n\n> ⚠️ **Medical Disclaimer**: *I provide general information and platform guidance. For medical emergencies or clinical diagnoses, please immediately contact emergency services (112 / 108) or consult a medical professional.*`;

interface KnowledgeResponse {
  keywords: string[];
  reply: string;
  quickReplies?: string[];
  category: "compatibility" | "donation" | "emergency" | "hospitals" | "features" | "general";
}

const KNOWLEDGE_BASE: KnowledgeResponse[] = [
  // ─── Blood Group Compatibility ──────────────────────────────────────────────
  {
    keywords: ["o-", "o negative", "universal donor"],
    reply: `**O- (O Negative) — The Universal Red Blood Cell Donor** 🩸\n\n• **Can donate red blood cells to**: **ALL blood groups** (A+, A-, B+, B-, AB+, AB-, O+, O-).\n• **Can receive blood from**: **O- only**.\n\nBecause O- red blood cells lack A, B, and Rh antigens, they are urgently needed in emergency rooms and trauma care when a patient's blood type is unknown.${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Who can receive AB+?", "Check A+ compatibility", "Donation Guidelines"],
    category: "compatibility",
  },
  {
    keywords: ["ab+", "ab positive", "universal recipient"],
    reply: `**AB+ (AB Positive) — The Universal Recipient** 🌟\n\n• **Can receive red blood cells from**: **ALL blood groups** (A+, A-, B+, B-, AB+, AB-, O+, O-).\n• **Can donate red blood cells to**: **AB+ only**.\n• **Universal Plasma Donor**: AB+ plasma can be given to patients of any blood group.${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Who can receive O-?", "Check B+ compatibility", "How to donate"],
    category: "compatibility",
  },
  {
    keywords: ["a+", "a positive"],
    reply: `**A+ (A Positive) Compatibility** 🅰️\n\n• **Can donate to**: **A+** and **AB+**\n• **Can receive from**: **A+**, **A-**, **O+**, and **O-**\n\n*A+ is one of the most common blood groups, representing roughly 30-35% of the population.*${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Check A- compatibility", "Check O+ compatibility", "Emergency Request"],
    category: "compatibility",
  },
  {
    keywords: ["a-", "a negative"],
    reply: `**A- (A Negative) Compatibility** 🅰️\n\n• **Can donate to**: **A+**, **A-**, **AB+**, and **AB-**\n• **Can receive from**: **A-** and **O-**\n\n*A- is relatively rare and highly valuable for matching both positive and negative A and AB patients.*${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Check A+ compatibility", "Check O- compatibility", "Find Hospitals"],
    category: "compatibility",
  },
  {
    keywords: ["b+", "b positive"],
    reply: `**B+ (B Positive) Compatibility** 🅱️\n\n• **Can donate to**: **B+** and **AB+**\n• **Can receive from**: **B+**, **B-**, **O+**, and **O-**\n\n*B+ is widely prevalent in South Asia and critically needed in community blood banks.*${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Check B- compatibility", "Check AB+ compatibility", "Donation Guidelines"],
    category: "compatibility",
  },
  {
    keywords: ["b-", "b negative"],
    reply: `**B- (B Negative) Compatibility** 🅱️\n\n• **Can donate to**: **B+**, **B-**, **AB+**, and **AB-**\n• **Can receive from**: **B-** and **O-**\n\n*B- is one of the rarest blood types (under 2% of population). B- donors are always in high demand.*${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Check B+ compatibility", "Check O- compatibility", "Create Emergency Request"],
    category: "compatibility",
  },
  {
    keywords: ["ab-", "ab negative"],
    reply: `**AB- (AB Negative) Compatibility** 🆎\n\n• **Can donate to**: **AB+** and **AB-**\n• **Can receive from**: **AB-**, **A-**, **B-**, and **O-**\n\n*AB- is the rarest of all major blood groups (approx. 1% of population).*${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Check AB+ compatibility", "Check O- compatibility", "Donation Guidelines"],
    category: "compatibility",
  },
  {
    keywords: ["o+", "o positive"],
    reply: `**O+ (O Positive) Compatibility** 🅾️\n\n• **Can donate to**: **O+**, **A+**, **B+**, and **AB+** (all positive groups)\n• **Can receive from**: **O+** and **O-**\n\n*O+ is the single most common blood group globally (approx. 38% of population) and frequently needed for daily transfusions.*${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Check O- compatibility", "Check A+ compatibility", "Donation Guidelines"],
    category: "compatibility",
  },
  {
    keywords: ["compatibility", "compatible", "match", "blood group", "blood type", "who can receive", "who can donate"],
    reply: `**Blood Group Compatibility Quick Guide** 🩸\n\n| Blood Group | Can Donate To | Can Receive From |\n| :--- | :--- | :--- |\n| **O-** | All Blood Groups (Universal) | O- |\n| **O+** | O+, A+, B+, AB+ | O+, O- |\n| **A-** | A-, A+, AB-, AB+ | A-, O- |\n| **A+** | A+, AB+ | A+, A-, O+, O- |\n| **B-** | B-, B+, AB-, AB+ | B-, O- |\n| **B+** | B+, AB+ | B+, B-, O+, O- |\n| **AB-** | AB-, AB+ | AB-, A-, B-, O- |\n| **AB+** | AB+ only | All Blood Groups (Universal) |\n\n*Type any specific blood group (e.g., "O-", "A+", "B-") for detailed information.*${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Who can receive O-?", "Who can receive AB+?", "Can I donate blood?"],
    category: "compatibility",
  },

  // ─── Donation Guidelines & Eligibility ──────────────────────────────────────
  {
    keywords: ["eligible", "eligibility", "can i donate", "requirements", "donate blood", "criteria", "weight", "age"],
    reply: `**Blood Donation Eligibility Criteria** 💉\n\nTo donate whole blood, you should meet the following general standards:\n\n1. **Age**: Between **18 and 65 years**.\n2. **Weight**: Minimum **50 kg (110 lbs)**.\n3. **Hemoglobin**: At least **12.5 g/dL**.\n4. **Pulse & Blood Pressure**: Normal resting range (BP: 100–140 systolic / 60–90 diastolic).\n5. **Health**: Feeling well with no active cold, flu, fever, or infection on the day of donation.\n6. **Intervals**: \n   • Men: Every **90 days (3 months)**\n   • Women: Every **120 days (4 months)**\n\n*Temporary deferrals apply for recent tattoos/piercings (6 months), dental surgery, or antibiotic courses.*${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Pre-donation tips", "Post-donation care", "How to register as donor"],
    category: "donation",
  },
  {
    keywords: ["prepare", "before donation", "pre-donation", "tips", "eat", "drink"],
    reply: `**Tips Before Donating Blood** 🥤\n\n• **Hydrate**: Drink 500ml (2-3 glasses) of water or juice 1-2 hours prior.\n• **Healthy Meal**: Eat a light, iron-rich meal within 2-3 hours before donation. Avoid greasy/fried foods.\n• **Rest**: Get a full night's sleep (7-8 hours).\n• **Avoid**: Do NOT consume alcohol for at least 24 hours prior, and avoid smoking for at least 2 hours before donation.\n• **Bring ID**: Carry a valid government photo ID card.${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Post-donation care", "Can I donate blood?", "Emergency Request"],
    category: "donation",
  },
  {
    keywords: ["after donation", "post-donation", "recovery", "care", "rest"],
    reply: `**Post-Donation Care & Recovery** 🩺\n\n• **Rest**: Relax in the refreshment area for 10-15 minutes after donation.\n• **Fluids**: Drink extra water and juice over the next 24-48 hours.\n• **Avoid Strenuous Exercise**: Do not lift heavy weights or do vigorous workouts for 24 hours.\n• **Bandage**: Keep the bandage on your arm clean and dry for at least 4-6 hours.\n• **If Lightheaded**: Sit or lie down immediately with your feet elevated until you feel completely normal.${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Can I donate blood?", "Blood Compatibility", "Find Hospitals"],
    category: "donation",
  },

  // ─── Emergency Blood Requests ───────────────────────────────────────────────
  {
    keywords: ["emergency", "request blood", "need blood", "create request", "urgent", "patient"],
    reply: `**How to Create an Emergency Blood Request on BloodLink** 🚨\n\n1. **Sign In**: Log into your BloodLink account (or register as a User/Individual).\n2. **Open Dashboard**: Go to the [User Dashboard](/dashboard).\n3. **Click Emergency CTA**: Click the red **"Create Emergency Request"** button.\n4. **Fill Request Details**:\n   • Patient Name & Blood Group required\n   • Units needed (e.g. 1 to 5 units)\n   • Hospital name & location\n   • Contact phone number & urgency level (Urgent / Immediate)\n5. **Instant Broadcast**: BloodLink immediately alerts matching nearby donors and partner blood banks via real-time notifications.\n\n*You can track the status of your request in real time under "Active Requests" on your dashboard.*${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Find Nearby Hospitals", "Check Blood Compatibility", "How BloodLink Works"],
    category: "emergency",
  },

  // ─── Hospitals & Blood Banks ────────────────────────────────────────────────
  {
    keywords: ["hospital", "blood bank", "nearby", "location", "address", "apollo", "columbia", "map"],
    reply: `**Partner Hospitals & Blood Banks** 🏥\n\nBloodLink connects you with verified hospitals and blood banks in real time:\n\n• **Apollo BGS Hospital**: Kuvempunagar, Mysuru — Phone: +91 821 2568888\n• **Columbia Asia Hospital**: Hebbal, Mysuru — Phone: +91 821 3989898\n\n🗺️ **Interactive Map View**: Navigate to the [Nearby Blood Banks & Hospitals Map](/dashboard/nearby) on your dashboard to see real-time routes, contact numbers, and live inventory levels.${MEDICAL_DISCLAIMER}`,
    quickReplies: ["Create Emergency Request", "Blood Compatibility", "How to donate"],
    category: "hospitals",
  },

  // ─── Platform Features & How-To ─────────────────────────────────────────────
  {
    keywords: ["how it works", "what is bloodlink", "platform", "features", "about"],
    reply: `**About BloodLink** 🩸\n\nBloodLink is a real-time smart blood donor finder and emergency transfusion platform that connects:\n\n1. **Donors**: Individuals who register to save lives and toggle availability.\n2. **Patients & Families**: Create emergency requests that broadcast instantly to matching donors.\n3. **Hospitals & Blood Banks**: Manage live blood inventory with 10-level smart availability tracking, CSV/Excel bulk upload, and automated notifications.\n4. **Multilingual Interface**: Full support for English, Kannada, Malayalam, Tamil, Telugu, Hindi, and Marathi.`,
    quickReplies: ["How to register as donor", "Emergency Request", "Language support"],
    category: "features",
  },
  {
    keywords: ["register", "signup", "become a donor", "donor registration", "sign up"],
    reply: `**How to Register as a Blood Donor** 👤\n\n1. Click **"Get Started"** or **"Sign Up"** on the top navigation.\n2. Choose **"Individual / Donor"** as your account type.\n3. Enter your Name, Email, Password, Blood Group, and Contact Phone.\n4. Once logged in, go to your [Dashboard](/dashboard) and toggle **"Available for Donation"** to **ON**.\n\n*When an emergency matching your blood group occurs nearby, you will receive an instant notification!*`,
    quickReplies: ["Can I donate blood?", "Emergency Request", "Blood Compatibility"],
    category: "features",
  },
  {
    keywords: ["language", "kannada", "hindi", "tamil", "telugu", "malayalam", "marathi", "translate", "multilingual"],
    reply: `**Multilingual Support on BloodLink** 🌐\n\nBloodLink supports **7 Indian languages**:\n\n• English (EN)\n• Kannada (KN — ಕನ್ನಡ)\n• Malayalam (ML — മലയാളം)\n• Tamil (TA — தமிழ்)\n• Telugu (TE — తెలుగు)\n• Hindi (HI — हिन्दी)\n• Marathi (MR — मराठी)\n\n*You can switch languages anytime using the **Language Selector** on the top navbar or footer!*`,
    quickReplies: ["How BloodLink Works", "Blood Compatibility", "Emergency Request"],
    category: "features",
  },
  {
    keywords: ["admin", "inventory", "upload", "bulk upload", "csv", "excel", "stock"],
    reply: `**Admin Blood Inventory Management** 📊\n\nAdministrators and Blood Bank personnel can:\n\n• View live stock levels for all 8 blood groups with 10-level availability indicators.\n• **Bulk Upload**: Upload Excel (.xlsx, .xls), CSV, or PDF inventory logs.\n• **Smart Column Mapping**: Automatically recognizes "Blood Type", "Quantity", and updates stock in real time.\n• **Critical Alerts**: Automatically notifies staff when any blood group reaches critical levels.\n\n*Access inventory via the [Admin Dashboard](/dashboard/admin).*`,
    quickReplies: ["Emergency Request", "Blood Compatibility", "Find Hospitals"],
    category: "features",
  },
];

const DEFAULT_FALLBACK_REPLY = `Thank you for your question! 😊\n\nI can help you with:\n• **Blood Group Compatibility** (e.g. "Who can receive O- blood?")\n• **Donation Guidelines & Eligibility** (e.g. "Can I donate blood?")\n• **Creating Emergency Requests** (e.g. "How to request blood?")\n• **Finding Nearby Hospitals** (e.g. "Where is Apollo hospital?")\n• **BloodLink Account & Features** (e.g. "How to register as donor?")\n\n*Please choose a topic below or type your question!*${MEDICAL_DISCLAIMER}`;

export const chatbotService = {
  /**
   * Process a user query and return a responsive chatbot answer
   */
  processMessage: async (query: string): Promise<ChatMessage> => {
    // Simulate natural response latency (350ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

    const cleanQuery = query.toLowerCase().trim();

    if (!cleanQuery) {
      return {
        id: `msg-${Date.now()}`,
        sender: "assistant",
        text: "Please type a question or choose from the suggested topics below! 😊",
        timestamp: new Date(),
        quickReplies: ["Blood Compatibility", "Can I donate blood?", "Emergency Request"],
        category: "general",
      };
    }

    // Exact or partial keyword matching against knowledge base
    let matchedItem: KnowledgeResponse | null = null;
    let highestScore = 0;

    // Tokenize query words
    const words = cleanQuery.split(/[\s,?.!/]+/);

    for (const item of KNOWLEDGE_BASE) {
      let score = 0;
      for (const kw of item.keywords) {
        if (cleanQuery === kw) {
          score += 50;
        } else if (words.includes(kw) || cleanQuery.includes(kw)) {
          // Extra weight for specific blood group keywords
          const isBloodGroupSpecific = ["o-", "o negative", "ab+", "ab positive", "a+", "a-", "b+", "b-", "ab-", "o+"].includes(kw);
          score += isBloodGroupSpecific ? 30 : kw.length;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        matchedItem = item;
      }
    }

    if (matchedItem && highestScore > 0) {
      return {
        id: `msg-${Date.now()}`,
        sender: "assistant",
        text: matchedItem.reply,
        timestamp: new Date(),
        quickReplies: matchedItem.quickReplies,
        category: matchedItem.category,
      };
    }

    // Friendly fallback
    return {
      id: `msg-${Date.now()}`,
      sender: "assistant",
      text: DEFAULT_FALLBACK_REPLY,
      timestamp: new Date(),
      quickReplies: [
        "Blood Compatibility",
        "Can I donate blood?",
        "Emergency Request",
        "Find Hospitals",
      ],
      category: "general",
    };
  },
};
export default chatbotService;
