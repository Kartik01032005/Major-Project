import { ChatMessage, QuickQuestion } from "@/types/chatbot";
import { Locale } from "@/i18n";

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

const WELCOME_MESSAGES: Record<Locale, string> = {
  en: `Hi! 👋 I'm your **BloodLink Assistant**.\n\nHow can I help you today?`,
  hi: `नमस्ते! 👋 मैं आपका **ब्लडलिंक सहायक** हूँ।\n\nआज मैं आपकी क्या मदद कर सकता हूँ?`,
  kn: `ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ **ಬ್ಲಡ್‌ಲಿಂಕ್ ಸಹಾಯಕ**.\n\nಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?`,
  ml: `ഹായ്! 👋 ഞാൻ നിങ്ങളുടെ **ബ്ലഡ്‌ലിങ്ക് അസിസ്റ്റന്റ്** ആണ്.\n\nഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?`,
  mr: `नमस्कार! 👋 मी तुमचा **ब्लडलिंक सहाय्यक** आहे.\n\nआज मी तुम्हाला कशी मदत करू शकतो?`,
  ta: `வணக்கம்! 👋 நான் உங்கள் **பிளட்லிங்க் உதவியாளர்**.\n\nஇன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?`,
  te: `నమస్కారం! 👋 నేను మీ **బ్లడ్‌లింక్ సహాయకుడిని**.\n\nఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?`,
};

export function getWelcomeMessage(locale: Locale = "en"): ChatMessage {
  return {
    id: "welcome-1",
    sender: "assistant",
    text: WELCOME_MESSAGES[locale] || WELCOME_MESSAGES.en,
    timestamp: new Date(),
    quickReplies: [
      "Blood Compatibility",
      "Can I donate blood?",
      "Emergency Request",
      "Find Hospitals",
    ],
    category: "general",
  };
}

export const WELCOME_MESSAGE = getWelcomeMessage("en");

interface MultilingualReply {
  en: string;
  hi: string;
  kn: string;
  ml: string;
  mr: string;
  ta: string;
  te: string;
}

interface ConversationalIntent {
  patterns: (string | RegExp)[];
  reply: MultilingualReply | ((query: string, locale: Locale, history?: ChatMessage[]) => string);
  quickReplies?: string[];
  category: "compatibility" | "donation" | "emergency" | "hospitals" | "features" | "general";
}

const CONVERSATIONAL_INTENTS: ConversationalIntent[] = [
  // Greetings
  {
    patterns: [
      "hi", "hello", "hey", "heya", "namaste", "hola", "greetings",
      "नमस्ते", "प्रणाम", "हाय", "हेलो",
      "ನಮಸ್ಕಾರ", "ಹಲೋ", "ಹಾಯ್",
      "ഹായ്", "ഹലോ", "നമസ്കാരം",
      "नमस्कार", "हेलो", "हाय",
      "வணக்கம்", "ஹாய்", "ஹலோ",
      "నమస్కారం", "హాయ్", "హలో"
    ],
    reply: {
      en: "Hi! 👋 How can I help you with BloodLink today?",
      hi: "नमस्ते! 👋 आज मैं ब्लडलिंक में आपकी क्या मदद कर सकता हूँ?",
      kn: "ನಮಸ್ಕಾರ! 👋 ಇಂದು ಬ್ಲಡ್‌ಲಿಂಕ್‌ನೊಂದಿಗೆ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
      ml: "ഹായ്! 👋 ഇന്ന് ബ്ലഡ്‌ലിങ്ക് ഉപയോഗിച്ച് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?",
      mr: "नमस्कार! 👋 आज मी ब्लडलिंकद्वारे आपली कशी मदत करू शकतो?",
      ta: "வணக்கம்! 👋 இன்று பிளட்லிங்க் மூலம் உங்களுக்கு எப்படி உதவ முடியும்?",
      te: "నమస్కారం! 👋 ఈరోజు బ్లడ్‌లింక్‌తో నేను మీకు ఎలా సహాయం చేయగలను?",
    },
    quickReplies: ["I need blood", "Can I donate blood?", "Emergency Request"],
    category: "general",
  },
  {
    patterns: ["good morning", "morning", "शुभ प्रभात", "शुभप्रभात", "ಶುಭೋದಯ", "സുപ്രഭാതം", "शुभ सकाळ", "காலை வணக்கம்", "శుభోదయం"],
    reply: {
      en: "Good morning! ☀️ How can I assist you on BloodLink today?",
      hi: "शुभ प्रभात! ☀️ आज मैं ब्लडलिंक पर आपकी क्या सहायता कर सकता हूँ?",
      kn: "ಶುಭೋದಯ! ☀️ ಇಂದು ಬ್ಲಡ್‌ಲಿಂಕ್‌ನಲ್ಲಿ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
      ml: "സുപ്രഭാതം! ☀️ ഇന്ന് ബ്ലഡ്‌ലിങ്കിൽ ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?",
      mr: "शुभ सकाळ! ☀️ आज मी ब्लडलिंकवर आपली कशी मदत करू शकतो?",
      ta: "காலை வணக்கம்! ☀️ இன்று பிளட்லிங்கில் உங்களுக்கு எப்படி உதவட்டும்?",
      te: "శుభోదయం! ☀️ ఈరోజు బ్లడ్‌లింక్‌లో నేను మీకు ఎలా సహాయం చేయగలను?",
    },
    category: "general",
  },

  // Check-ins & Polite Expressions
  {
    patterns: ["how are you", "how are you doing", "how r u", "आप कैसे हैं", "आप कैसे हो", "hegiddira", "ಹೇಗಿದ್ದೀರಾ", "സുഖമാണോ", "कसे आहात", "எப்படி இருக்கிறீர்கள்", "ఎలా ఉన్నారు"],
    reply: {
      en: "I'm doing well, thank you! 😊 How can I help you today?",
      hi: "मैं ठीक हूँ, धन्यवाद! 😊 आज मैं आपकी क्या मदद कर सकता हूँ?",
      kn: "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ, ಧನ್ಯವಾದಗಳು! 😊 ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
      ml: "എനിക്ക് സുഖമാണ്, നന്ദി! 😊 ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?",
      mr: "मी मजेत आहे, धन्यवाद! 😊 आज मी तुम्हाला कशी मदत करू शकतो?",
      ta: "நான் நன்றாக இருக்கிறேன், நன்றி! 😊 இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
      te: "నేను బాగున్నాను, ధన్యవాదాలు! 😊 ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
    },
    category: "general",
  },
  {
    patterns: ["thanks", "thank you", "thx", "tq", "धन्यवाद", "शुक्रिया", "ಧನ್ಯವಾದಗಳು", "നന്ദി", "धन्यवाद", "நன்றி", "ధన్యవాదాలు"],
    reply: {
      en: "You're welcome! ❤️ Let me know if you need anything else.",
      hi: "आपका स्वागत है! ❤️ अगर आपको किसी और चीज की जरूरत हो तो मुझे बताएं।",
      kn: "ನಿಮಗೆ ಸ್ವಾಗತ! ❤️ ನಿಮಗೆ ಇನ್ನೇನಾದರೂ ಬೇಕಾದರೆ ತಿಳಿಸಿ.",
      ml: "തീർച്ചയായും! ❤️ നിങ്ങൾക്ക് മറ്റെന്തെങ്കിലും ആവശ്യമുണ്ടെങ്കിൽ അറിയിക്കുക.",
      mr: "आपले स्वागत आहे! ❤️ आपल्याला आणखी काही हवे असल्यास नक्की सांगा.",
      ta: "வரவேற்கிறோம்! ❤️ வேறு ஏதேனும் தேவைப்பட்டால் எனக்கு জানানவும்.",
      te: "స్వాగతం! ❤️ మీకు ఇంకా ఏమైనా అవసరమైతే నాకు చెప్పండి.",
    },
    category: "general",
  },
  {
    patterns: ["okay", "ok", "got it", "cool", "alright", "ठीक है", "ओके", "சரி", "సరే", "ಸರಿ", "ശരി"],
    reply: {
      en: "Glad to help! 👍 Let me know if you have more questions.",
      hi: "मदद करके खुशी हुई! 👍 अगर आपके कोई और सवाल हों तो बताएं।",
      kn: "ಸಹಾಯ ಮಾಡಲು ಸಂತೋಷವಾಗಿದೆ! 👍 ನಿಮಗೇನಾದರೂ ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ ಕೇಳಿ.",
      ml: "സഹായിക്കാൻ കഴിഞ്ഞതിൽ സന്തോഷം! 👍 കൂടുതൽ ചോദ്യങ്ങളുണ്ടെങ്കിൽ ചോദിക്കുക.",
      mr: "मदत करायला आनंद वाटला! 👍 काही प्रश्न असल्यास नक्की विचारा.",
      ta: "உதவியதில் மகிழ்ச்சி! 👍 மேலும் கேள்விகள் இருந்தால் கேட்கலாம்.",
      te: "సహాయపడినందుకు సంతోషం! 👍 ఇంకా ఏమైనా ప్రశ్నలు ఉంటే అడగండి.",
    },
    category: "general",
  },

  // General Help & Intent: "I need blood" / Blood Group
  {
    patterns: [
      "i need blood", "need blood", "want blood", "looking for blood", "require blood",
      "मुझे ब्लड चाहिए", "मुझे रक्त चाहिए", "ब्लड की जरूरत है",
      "ನನಗೆ ರಕ್ತ ಬೇಕು", "ರಕ್ತ ಬೇಕಾಗಿದೆ",
      "എനിക്ക് രക്തം വേണം", "രക്തം ആവശ്യമുണ്ട്",
      "मला रक्त हवे आहे", "रक्ताची गरज आहे",
      "எனக்கு ரத்தம் வேண்டும்", "ரத்தம் தேவைப்படுகிறது",
      "నాకు రక్తం కావాలి", "రక్తం అవసరం ఉంది"
    ],
    reply: {
      en: "I can help you find available blood donors or blood banks! Which blood group do you need? (e.g. O+, A-, B+)",
      hi: "मैं आपको ब्लड डोनर या ब्लड बैंक खोजने में मदद कर सकता हूँ! आपको किस ब्लड ग्रुप की जरूरत है? (जैसे O+, A-, B+)",
      kn: "ಲಭ್ಯವಿರುವ ರಕ್ತದಾನಿಗಳನ್ನು ಅಥವಾ ರಕ್ತ ಬ್ಯಾಂಕ್‌ಗಳನ್ನು ಹುಡುಕಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ! ನಿಮಗೆ ಯಾವ ರಕ್ತದ ಗುಂಪು ಬೇಕು? (ಉದಾ: O+, A-, B+)",
      ml: "ലഭ്യമായ രക്തദാതാക്കളെയോ രക്തബാങ്കുകളെയോ കണ്ടെത്താൻ ഞാൻ സഹായിക്കാം! നിങ്ങൾക്ക് ഏത് രക്തഗ്രൂപ്പാണ് വേണ്ടത്? (ഉദാ: O+, A-, B+)",
      mr: "मी तुम्हाला उपलब्ध रक्तदाते किंवा रक्तपेढ्या शोधण्यात मदत करू शकतो! तुम्हाला कोणत्या रक्तगटाची गरज आहे? (उदा. O+, A-, B+)",
      ta: "இரத்த தானம் செய்பவர்கள் அல்லது இரத்த வங்கிகளைக் கண்டறிய நான் உதவ முடியும்! உங்களுக்கு எந்த ரத்த வகை வேண்டும்? (எ.கா. O+, A-, B+)",
      te: "అందుబాటులో ఉన్న రక్తదాతలు లేదా బ్లడ్ బ్యాంక్‌లను కనుగొనడంలో నేను మీకు సహాయపడగలను! మీకు ఏ రక్తం గ్రూప్ కావాలి? (ఉదా: O+, A-, B+)",
    },
    quickReplies: ["O+ blood", "A+ blood", "B+ blood", "O- blood"],
    category: "emergency",
  },
  {
    patterns: [
      /^(i need|need|looking for|require|मुझे|ನನಗೆ|എനിക്ക്|मला|எனக்கு|నాకు)\s+([a-o]|ab)[\s\-\+]*(blood|ब्लड|रक्त|ರಕ್ತ|രക്തം|ரத்தம்|రక్తం)?$/i
    ],
    reply: (query: string, locale: Locale) => {
      const match = query.match(/([a-o]|ab)[\s\-\+]*/i);
      const bg = match ? match[0].trim().toUpperCase() : "blood";
      switch (locale) {
        case "hi": return `ज़रूर! मैं आपको ${bg} ब्लड डोनर या ब्लड बैंक खोजने में मदद कर सकता हूँ। आप डोनर्स को सूचित करने के लिए अपने डैशबोर्ड पर इमरजेंसी रिक्वेस्ट बना सकते हैं।`;
        case "kn": return `ಖಂಡಿತ! ನಾನು ${bg} ರಕ್ತದಾನಿ ಅಥವಾ ರಕ್ತ ಬ್ಯಾಂಕ್ ಹುಡುಕಲು ಸಹಾಯ ಮಾಡಬಹುದು. ದಾನಿಗಳಿಗೆ ತಕ್ಷಣ ತಿಳಿಸಲು ನಿಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಎಮರ್ಜೆನ್ಸಿ ರಿಕ್ವೆಸ್ಟ್ ರಚಿಸಬಹುದು.`;
        case "ml": return `തീർച്ചയായും! ${bg} രക്തദാതാക്കളെയോ രക്തബാങ്കുകളെയോ കണ്ടെത്താൻ ഞാൻ സഹായിക്കാം. നിങ്ങളുടെ ഡാഷ്‌ബോർഡിൽ എമർജൻസി റിക്വസ്റ്റ് ഉണ്ടാക്കാം.`;
        case "mr": return `नक्कीच! मी तुम्हाला ${bg} रक्तदाते किंवा रक्तपेढी शोधण्यात मदत करू शकतो. आपण आपल्या डॅशबोर्डवर आपत्कालीन विनंती तयार करू शकता.`;
        case "ta": return `நிச்சயமாக! ${bg} இரத்த தானம் செய்பவர்கள் அல்லது இரத்த வங்கிகளைக் கண்டறிய நான் உதவ முடியும். அவசர கோரிக்கையை உருவாக்கலாம்.`;
        case "te": return `ఖచ్చితంగా! నేను మీకు ${bg} రక్తదాతలు లేదా బ్లడ్ బ్యాంక్ కనుగొనడంలో సహాయపడగలను. మీ డాష్‌బోర్డ్‌లో ఎమర్జెన్సీ అభ్యర్థనను సృష్టించవచ్చు.`;
        default: return `Sure! I can help you find ${bg} blood donors or blood banks. You can create an emergency request on your dashboard to notify nearby donors instantly.`;
      }
    },
    category: "emergency",
  },
  {
    patterns: [/^(o\+|o\-|a\+|a\-|b\+|b\-|ab\+|ab\-)\s*(blood|ब्लड|रक्त|ರಕ್ತ|രക്തം|ரத்தம்|రక్తం)?$/i],
    reply: (query: string, locale: Locale, history?: ChatMessage[]) => {
      const bg = query.toUpperCase().trim();
      const lastUserMsg = history
        ?.filter((m) => m.sender === "user")
        .slice(-2)[0]?.text.toLowerCase();

      const isNeedContext = lastUserMsg && (
        lastUserMsg.includes("need") || lastUserMsg.includes("looking") || lastUserMsg.includes("blood") ||
        lastUserMsg.includes("चाहिए") || lastUserMsg.includes("ಬೇಕು") || lastUserMsg.includes("വേണം") ||
        lastUserMsg.includes("हवे") || lastUserMsg.includes("வேண்டும்") || lastUserMsg.includes("కావాలి")
      );

      if (isNeedContext) {
        switch (locale) {
          case "hi": return `समझ गया। आप ${bg} ब्लड की तलाश में हैं। आप अपने डैशबोर्ड पर इमरजेंसी रिक्वेस्ट बना सकते हैं या नजदीकी ब्लड बैंक देख सकते हैं।`;
          case "kn": return `ಅರ್ಥವಾಯಿತು. ನೀವು ${bg} ರಕ್ತವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ. ನಿಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಎಮರ್ಜೆನ್ಸಿ ರಿಕ್ವೆಸ್ಟ್ ರಚಿಸಬಹುದು ಅಥವಾ ಹತ್ತಿರದ ರಕ್ತ ಬ್ಯಾಂಕ್‌ಗಳನ್ನು ನೋಡಬಹುದು.`;
          case "ml": return `മനസ്സിലായി. നിങ്ങൾ ${bg} രക്തത്തിനായി തിരയുകയാണ്. നിങ്ങളുടെ ഡാഷ്‌ബോർഡിൽ എമർജൻസി റിക്വസ്റ്റ് ഉണ്ടാക്കാം.`;
          case "mr": return `समजले. आपण ${bg} रक्ताचा शोध घेत आहात. आपण डॅशबोर्डवर आपत्कालीन विनंती तयार करू शकता.`;
          case "ta": return `புரிந்தது. நீங்கள் ${bg} ரத்தத்தைத் தேடுகிறீர்கள். அவசர கோரிக்கையை உருவாக்கலாம்.`;
          case "te": return `ర్థమైంది. మీరు ${bg} రక్తం కోసం చూస్తున్నారు. మీరు మీ డాష్‌బోర్డ్‌లో ఎమర్జెన్సీ అభ్యర్థనను సృష్టించవచ్చు.`;
          default: return `Got it. You're looking for ${bg} blood. You can create an emergency request on your dashboard or view nearby blood banks on the map.`;
        }
      }

      switch (locale) {
        case "hi": return `${bg} ब्लड ग्रुप के लिए: मैं आपको कम्पैटिबिलिटी बता सकता हूँ या इमरजेंसी रिक्वेस्ट बनाने में मदद कर सकता हूँ।`;
        case "kn": return `${bg} ರಕ್ತದ ಗುಂಪಿಗೆ: ನಾನು ಹೊಂದಾಣಿಕೆ ವಿವರಗಳನ್ನು ತೋರಿಸಬಹುದು ಅಥವಾ ವಿನಂತಿಸಲು ಸಹಾಯ ಮಾಡಬಹುದು.`;
        case "ml": return `${bg} രക്തഗ്രൂപ്പിനായി: പൊരുത്തപ്പെടൽ വിവരങ്ങൾ കാണിക്കാനും അഭ്യർത്ഥിക്കാനും ഞാൻ സഹായിക്കാം.`;
        case "mr": return `${bg} रक्तगटासाठी: मी सुसंगतता माहिती दाखवू शकतो किंवा विनंती करण्यास मदत करू शकतो.`;
        case "ta": return `${bg} ரத்த வகைக்கு: இணக்கத்தன்மை விவரங்களைக் காட்டலாம் அல்லது கோரிக்கை விடுக்க உதவலாம்.`;
        case "te": return `${bg} బ్లడ్ గ్రూప్ కోసం: నేను అనుకూలత వివరాలను చూపించగలను లేదా అభ్యర్థించడంలో సహాయపడగలను.`;
        default: return `For ${bg} blood group: I can show you compatibility details or help you request ${bg} blood. What would you like to do?`;
      }
    },
    category: "compatibility",
  },

  // Platform How-To in Supported Languages
  {
    patterns: ["what is bloodlink", "about bloodlink", "ब्लडलिंक क्या है", "ಬ್ಲಡ್‌ಲಿಂಕ್ ಎಂದರೇನು", "എന്താണ് ബ്ലഡ്‌ലിങ്ക്", "ब्लडलिंक काय आहे", "பிளட்லிங்க் என்றால் என்ன", "బ్లడ్‌లింక్ అంటే ఏమిటి"],
    reply: {
      en: "BloodLink connects people who need blood with nearby donors and blood banks in real time.",
      hi: "ब्लडलिंक उन लोगों को जोड़ता है जिन्हें ब्लड की जरूरत होती है, नजदीकी डोनर्स और ब्लड बैंकों से।",
      kn: "ಬ್ಲಡ್‌ಲಿಂಕ್ ರಕ್ತದ ಅಗತ್ಯವಿರುವ ಜನರನ್ನು ಹತ್ತಿರದ ದಾನಿಗಳು ಮತ್ತು ರಕ್ತ ಬ್ಯಾಂಕ್‌ಗಳೊಂದಿಗೆ ನೈಜ ಸಮಯದಲ್ಲಿ ಸಂಪರ್ಕಿಸುತ್ತದೆ.",
      ml: "രക്തം ആവശ്യമുള്ള ആളുകളെ സമീപത്തുള്ള ദാതാക്കളുമായും രക്തബാങ്കുകളുമായും ബ്ലഡ്‌ലിങ്ക് തത്സമയം ബന്ധിപ്പിക്കുന്നു.",
      mr: "ब्लडलिंक रक्ताची गरज असलेल्या लोकांना जवळच्या रक्तदात्यांशी आणि रक्तपेढ्यांशी रिअल टाइममध्ये जोडते.",
      ta: "ரத்தம் தேவைப்படுபவர்களை அருகிலுள்ள தானம் செய்பவர்கள் மற்றும் இரத்த வங்கிகளுடன் பிளட்லிங்க் இணைக்கிறது.",
      te: "బ్లడ్‌లింక్ రక్తం అవసరమైన వారిని సమీపంలోని దాతలు మరియు బ్లడ్ బ్యాంక్‌లతో నిజ సమయంలో అనుసంధానిస్తుంది.",
    },
    category: "features",
  },
  {
    patterns: ["how to request blood", "create request", "अनुरोध कैसे करें", "ವಿನಂತಿ ಮಾಡುವುದು ಹೇಗೆ", "അഭ്യർത്ഥിക്കുന്നത് എങ്ങനെ", "विनंती कशी करावी", "கோரிக்கை விடுப்பது எப்படி", "అభ్యర్థించడం ఎలా"],
    reply: {
      en: "Go to your User Dashboard and click 'Create Emergency Request'. Fill in patient details and hospital to notify nearby donors.",
      hi: "अपने यूजर डैशबोर्ड पर जाएं और 'क्रिएट इमरजेंसी रिक्वेस्ट' पर क्लिक करें। डोनर्स को सूचित करने के लिए विवरण भरें।",
      kn: "ನಿಮ್ಮ ಬಳಕೆದಾರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ ಮತ್ತು 'ಕ್ರಿಯೇಟ್ ಎಮರ್ಜೆನ್ಸಿ ರಿಕ್ವೆಸ್ಟ್' ಕ್ಲಿಕ್ ಮಾಡಿ.",
      ml: "നിങ്ങളുടെ യൂസർ ഡാഷ്‌ബോർഡിൽ പോയി 'ക്രിയേറ്റ് എമർജൻസി റിക്വസ്റ്റ്' ക്ലിക്ക് ചെയ്യുക.",
      mr: "आपल्या युझर डॅशबोर्डवर जा आणि 'क्रिएट इमर्जन्सी रिक्वेस्ट' वर क्लिक करा.",
      ta: "உங்கள் பயனர் டாஷ்போர்டிற்குச் சென்று 'கிரியேட் எமர்ஜென்சி ரெக்வெஸ்ட்' என்பதைக் கிளிக் செய்யவும்.",
      te: "మీ యూజర్ డాష్‌బోర్డ్‌కి వెళ్లి 'క్రియేట్ ఎమర్జెన్సీ రిక్వెస్ట్' పై క్లిక్ చేయండి.",
    },
    category: "emergency",
  },
];

interface MultilingualKnowledge {
  keywords: string[];
  reply: MultilingualReply;
  quickReplies?: string[];
  category: "compatibility" | "donation" | "emergency" | "hospitals" | "features" | "general";
}

const KNOWLEDGE_BASE: MultilingualKnowledge[] = [
  {
    keywords: ["o-", "o negative", "universal donor"],
    reply: {
      en: "**O- (O Negative) — Universal Donor** 🩸\n\n• **Can donate to**: All blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-)\n• **Can receive from**: O- only",
      hi: "**O- (O नेगेटिव) — यूनिवर्सल डोनर** 🩸\n\n• **किसे दान कर सकते हैं**: सभी ब्लड ग्रुप को\n• **किससे ले सकते हैं**: केवल O- से",
      kn: "**O- — ಸಾರ್ವತ್ರಿಕ ದಾನಿ** 🩸\n\n• **ಕೊಡಬಹುದಾದ ರಕ್ತದ ಗುಂಪುಗಳು**: ಎಲ್ಲಾ ಗುಂಪುಗಳಿಗೆ\n• **ಪಡೆಯಬಹುದಾದ ರಕ್ತದ ಗುಂಪು**: O- ನಿಂದ ಮಾತ್ರ",
      ml: "**O- — സാർവത്രിക ദാതാവ്** 🩸\n\n• **നൽകാൻ കഴിയുന്നത്**: എല്ലാ രക്തഗ്രൂപ്പുകൾക്കും\n• **സ്വീകരിക്കാൻ കഴിയുന്നത്**: O- യിൽ നിന്ന് മാത്രം",
      mr: "**O- — युनिव्हर्सल डोनर** 🩸\n\n• **रक्तदान करू शकतात**: सर्व रक्तगटांना\n• **रक्त घेऊ शकतात**: फक्त O- कडून",
      ta: "**O- — அனைத்து இரத்த வகைகளுக்கும் தானம் செய்யலாம்** 🩸\n\n• **தானம் செய்யக்கூடிய இரத்த வகை**: அனைத்து வகைகளுக்கும்\n• **பெறக்கூடிய வகை**: O- இலிருந்து மட்டுமே",
      te: "**O- — యూనివర్సల్ డోనర్** 🩸\n\n• **దానం చేయగల గ్రూపులు**: అన్ని బ్లడ్ గ్రూపులకు\n• **స్వీకరించగల గ్రూప్**: O- నుండి మాత్రమే",
    },
    category: "compatibility",
  },
  {
    keywords: ["ab+", "ab positive", "universal recipient"],
    reply: {
      en: "**AB+ (AB Positive) — Universal Recipient** 🌟\n\n• **Can receive from**: All blood groups\n• **Can donate to**: AB+ only",
      hi: "**AB+ (AB पॉजिटिव) — यूनिवर्सल रिसिपिएंट** 🌟\n\n• **किससे ले सकते हैं**: सभी ब्लड ग्रुप से\n• **किसे दान कर सकते हैं**: केवल AB+ को",
      kn: "**AB+ — ಸಾರ್ವತ್ರಿಕ ಸ್ವೀಕರಿಸುವವರು** 🌟\n\n• **ಪಡೆಯಬಹುದಾದ ರಕ್ತದ ಗುಂಪುಗಳು**: ಎಲ್ಲಾ ಗುಂಪುಗಳಿಂದ\n• **ಕೊಡಬಹುದಾದ ರಕ್ತದ ಗುಂಪು**: AB+ ಗೆ ಮಾತ್ರ",
      ml: "**AB+ — സാർവത്രിക സ്വീകർത്താവ്** 🌟\n\n• **സ്വീകരിക്കാൻ കഴിയുന്നത്**: എല്ലാ രക്തഗ്രൂപ്പുകളിൽ നിന്നും\n• **നൽകാൻ കഴിയുന്നത്**: AB+ ന് മാത്രം",
      mr: "**AB+ — युनिव्हर्सल रेसिपिएंट** 🌟\n\n• **रक्त घेऊ शकतात**: सर्व रक्तगटांकडून\n• **रक्तदान करू शकतात**: फक्त AB+ ला",
      ta: "**AB+ — அனைவரிடமிருந்தும் ரத்தம் பெறலாம்** 🌟\n\n• **ரத்தம் பெறக்கூடிய வகை**: அனைத்து வகைகளிடமிருந்தும்\n• **தானம் செய்யக்கூடிய வகை**: AB+ க்கு மட்டுமே",
      te: "**AB+ — యూనివర్సల్ రెసిపియంట్** 🌟\n\n• **స్వీకరించగల గ్రూపులు**: అన్ని బ్లడ్ గ్రూపుల నుండి\n• **దానం చేయగల గ్రూప్**: AB+ కి మాత్రమే",
    },
    category: "compatibility",
  },
  {
    keywords: ["eligible", "eligibility", "can i donate", "requirements", "donate blood"],
    reply: {
      en: "**Blood Donation Eligibility Criteria** 💉\n\n1. **Age**: 18–65 years\n2. **Weight**: Minimum 50 kg\n3. **Health**: Feeling well with no active illness\n4. **Interval**: Men every 3 months, Women every 4 months",
      hi: "**रक्तदान पात्रता मानदंड** 💉\n\n1. **आयु**: 18-65 वर्ष\n2. **वजन**: कम से कम 50 किग्रा\n3. **स्वास्थ्य**: पूरी तरह स्वस्थ\n4. **अंतराल**: पुरुष 3 महीने, महिलाएं 4 महीने",
      kn: "**ರಕ್ತದಾನದ ಅರ್ಹತಾ ಮಾನದಂಡಗಳು** 💉\n\n1. **ವಯಸ್ಸು**: 18-65 ವರ್ಷಗಳು\n2. **ತೂಕ**: ಕನಿಷ್ಠ 50 ಕೆಜಿ\n3. **ಆರೋಗ್ಯ**: ಉತ್ತಮ ಆರೋಗ್ಯ ಹೊಂದಿರಬೇಕು",
      ml: "**രക്തദാന യോഗ്യതാ മാനദണ്ഡങ്ങൾ** 💉\n\n1. **പ്രായം**: 18–65 വയസ്സ്\n2. **ഭാരം**: കുറഞ്ഞത് 50 കിലോ\n3. **ആരോഗ്യം**: പൂർണ്ണ ആരോഗ്യം ഉണ്ടായിരിക്കണം",
      mr: "**रक्तदान पात्रता निकष** 💉\n\n1. **वय**: 18-65 वर्षे\n2. **वजन**: किमान 50 किलो\n3. **आरोग्य**: पूर्णपणे निरोगी असणे आवश्यक",
      ta: "**ரத்த தானத் தகுதி ప్రమాణాలు** 💉\n\n1. **வயது**: 18–65 ஆண்டுகள்\n2. **எடை**: குறைந்தபட்சம் 50 கிலோ\n3. **சுகாதாரம்**: நல்ல உடல்நலம் ఉండ வேண்டும்",
      te: "**రక్తదాన అర్హత ప్రమాణాలు** 💉\n\n1. **వయస్సు**: 18–65 సంవత్సరాలు\n2. **బరువు**: కనీసం 50 కేజీలు\n3. **ఆరోగ్యం**: సంపూర్ణ ఆరోగ్యంగా ఉండాలి",
    },
    category: "donation",
  },
  {
    keywords: ["hospital", "blood bank", "nearby", "location", "apollo", "columbia"],
    reply: {
      en: "**Nearby Hospitals & Blood Banks** 🏥\n\n• **Apollo BGS Hospital**: Kuvempunagar (+91 821 2568888)\n• **Columbia Asia Hospital**: Hebbal (+91 821 3989898)\n\nView live interactive routes under **Nearby Blood Banks & Hospitals** on your dashboard!",
      hi: "**नजदीकी अस्पताल और ब्लड बैंक** 🏥\n\n• **अपोलो बीजीएस अस्पताल**: कुवेम्पुनगर (+91 821 2568888)\n• **कोलंबिया एशिया अस्पताल**: हेब्बल (+91 821 3989898)",
      kn: "**ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ರಕ್ತ ಬ್ಯಾಂಕ್‌ಗಳು** 🏥\n\n• **ಅಪೋಲೋ BGS ಆಸ್ಪತ್ರೆ**: ಕುವೆಂಪುನಗರ (+91 821 2568888)\n• **ಕೊಲಂಬಿಯಾ ಏಷ್ಯಾ ಆಸ್ಪತ್ರೆ**: ಹೆಬ್ಬಾಳ (+91 821 3989898)",
      ml: "**സമീപത്തുള്ള ആശുപത്രികളും രക്തബാങ്കുകളും** 🏥\n\n• **അപ്പോളോ BGS ആശുപത്രി**: കുവേമ്പുനഗർ (+91 821 2568888)\n• **കൊളംബിയ ഏഷ്യ ആശുപത്രി**: ഹെബ്ബാൾ (+91 821 3989898)",
      mr: "**जवळची रुग्णालये आणि रक्तपेढ्या** 🏥\n\n• **अपोलो BGS हॉस्पिटल**: कुवेमपुनगर (+91 821 2568888)\n• **कोलंबिया एशिया हॉस्पिटल**: हेब्बाळ (+91 821 3989898)",
      ta: "**அருகிலுள்ள மருத்துவமனைகள் & இரத்த வங்கிகள்** 🏥\n\n• **அப்பல்லோ பிஜிஎஸ் மருத்துவமனை**: குவேம்புநகர் (+91 821 2568888)\n• **கொலம்பியா ஆசியா மருத்துவமனை**: ஹெப்பால் (+91 821 3989898)",
      te: "**సమీపంలోని ఆసుపత్రులు & బ్లడ్ బ్యాంకులు** 🏥\n\n• **అపోలో BGS ఆసుపత్రి**: కువెంపునగర్ (+91 821 2568888)\n• **కొలంబియా ఆసియా ఆసుపత్రి**: హెబ్బాల్ (+91 821 3989898)",
    },
    category: "hospitals",
  },
];

const DEFAULT_FALLBACK_REPLIES: Record<Locale, string> = {
  en: "I'm here to help! 😊 You can ask me about blood groups, donation eligibility, emergency requests, or nearby hospitals. How can I assist you?",
  hi: "मैं आपकी मदद के लिए यहाँ हूँ! 😊 आप मुझसे ब्लड ग्रुप, रक्तदान पात्रता, इमरजेंसी रिक्वेस्ट या अस्पतालों के बारे में पूछ सकते हैं।",
  kn: "ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ! 😊 ರಕ್ತದ ಗುಂಪುಗಳು, ರಕ್ತದಾನದ ಅರ್ಹತೆ ಅಥವಾ ಆಸ್ಪತ್ರೆಗಳ ಬಗ್ಗೆ ನೀವು ಕೇಳಬಹುದು.",
  ml: "ഞാൻ നിങ്ങളെ സഹായിക്കാൻ ഇവിടെയുണ്ട്! 😊 രക്തഗ്രൂപ്പുകൾ, രക്തദാന യോഗ്യത, ആശുപത്രികൾ എന്നിവയെക്കുറിച്ച് ചോദിക്കാം.",
  mr: "मी मदतीसाठी येथे आहे! 😊 आपण मला रक्तगट, रक्तदान पात्रता किंवा रुग्णालयांबद्दल विचारू शकता.",
  ta: "நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன்! 😊 ரத்த வகைகள், ரத்த தான தகுதி அல்லது மருத்துவமனைகள் பற்றி கேட்கலாம்.",
  te: "నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను! 😊 మీరు నన్ను బ్లడ్ గ్రూపులు, రక్తదాన అర్హత లేదా ఆసుపత్రుల గురించి అడగవచ్చు.",
};

export const chatbotService = {
  /**
   * Process a user query and return a responsive chatbot answer in the given locale
   */
  processMessage: async (query: string, history?: ChatMessage[], locale: Locale = "en"): Promise<ChatMessage> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const cleanQuery = query.toLowerCase().trim();

    if (!cleanQuery) {
      return {
        id: `msg-${Date.now()}`,
        sender: "assistant",
        text: DEFAULT_FALLBACK_REPLIES[locale] || DEFAULT_FALLBACK_REPLIES.en,
        timestamp: new Date(),
        quickReplies: ["Blood Compatibility", "Can I donate blood?", "Emergency Request"],
        category: "general",
      };
    }

    // 1. Check conversational intents
    for (const intent of CONVERSATIONAL_INTENTS) {
      for (const pattern of intent.patterns) {
        let isMatch = false;
        if (typeof pattern === "string") {
          isMatch = cleanQuery === pattern || cleanQuery.startsWith(`${pattern} `) || cleanQuery.endsWith(` ${pattern}`);
        } else if (pattern instanceof RegExp) {
          isMatch = pattern.test(cleanQuery);
        }

        if (isMatch) {
          const replyText = typeof intent.reply === "function"
            ? intent.reply(query, locale, history)
            : (intent.reply[locale] || intent.reply.en);

          return {
            id: `msg-${Date.now()}`,
            sender: "assistant",
            text: replyText,
            timestamp: new Date(),
            quickReplies: intent.quickReplies,
            category: intent.category,
          };
        }
      }
    }

    // 2. Knowledge base matching
    let matchedItem: MultilingualKnowledge | null = null;
    let highestScore = 0;
    const words = cleanQuery.split(/[\s,?.!/]+/);

    for (const item of KNOWLEDGE_BASE) {
      let score = 0;
      for (const kw of item.keywords) {
        if (cleanQuery === kw) {
          score += 50;
        } else if (words.includes(kw) || cleanQuery.includes(kw)) {
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
      const replyText = matchedItem.reply[locale] || matchedItem.reply.en;
      return {
        id: `msg-${Date.now()}`,
        sender: "assistant",
        text: replyText,
        timestamp: new Date(),
        quickReplies: matchedItem.quickReplies,
        category: matchedItem.category,
      };
    }

    // 3. Fallback
    return {
      id: `msg-${Date.now()}`,
      sender: "assistant",
      text: DEFAULT_FALLBACK_REPLIES[locale] || DEFAULT_FALLBACK_REPLIES.en,
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

