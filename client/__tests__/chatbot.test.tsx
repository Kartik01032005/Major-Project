import { chatbotService } from "@/services/chatbotService";

describe("BloodLink Chatbot Service", () => {
  it("processes simple conversational greetings in English", async () => {
    const response = await chatbotService.processMessage("Hi", undefined, "en");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("Hi! 👋 How can I help you");
  });

  it("processes greetings in Hindi when Hindi is selected", async () => {
    const response = await chatbotService.processMessage("Hi", undefined, "hi");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("नमस्ते");
  });

  it("processes greetings in Kannada when Kannada is selected", async () => {
    const response = await chatbotService.processMessage("Hi", undefined, "kn");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("ನಮಸ್ಕಾರ");
  });

  it("processes greetings in Malayalam when Malayalam is selected", async () => {
    const response = await chatbotService.processMessage("Hi", undefined, "ml");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("ഹായ്");
  });

  it("processes greetings in Marathi when Marathi is selected", async () => {
    const response = await chatbotService.processMessage("Hi", undefined, "mr");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("नमस्कार");
  });

  it("processes greetings in Tamil when Tamil is selected", async () => {
    const response = await chatbotService.processMessage("Hi", undefined, "ta");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("வணக்கம்");
  });

  it("processes greetings in Telugu when Telugu is selected", async () => {
    const response = await chatbotService.processMessage("Hi", undefined, "te");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("నమస్కారం");
  });

  it("processes native blood request intent in Hindi", async () => {
    const response = await chatbotService.processMessage("मुझे O+ ब्लड चाहिए", undefined, "hi");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("O+");
    expect(response.text).toContain("मदद");
  });

  it("processes native blood request intent in Kannada", async () => {
    const response = await chatbotService.processMessage("ನನಗೆ O+ ರಕ್ತ ಬೇಕು", undefined, "kn");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("O+");
    expect(response.text).toContain("ಸಹಾಯ");
  });

  it("processes blood compatibility query for O- correctly", async () => {
    const response = await chatbotService.processMessage("Who can receive O- blood?");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("Universal Donor");
    expect(response.category).toBe("compatibility");
  });

  it("processes blood compatibility query for AB+ correctly", async () => {
    const response = await chatbotService.processMessage("Can AB+ receive from everyone?");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("Universal Recipient");
    expect(response.category).toBe("compatibility");
  });

  it("processes donation eligibility criteria", async () => {
    const response = await chatbotService.processMessage("Can I donate blood?");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("Eligibility Criteria");
    expect(response.category).toBe("donation");
  });

  it("processes emergency blood request guidance", async () => {
    const response = await chatbotService.processMessage("How to create an emergency request?");
    expect(response.sender).toBe("assistant");
    expect(response.category).toBe("emergency");
  });

  it("processes hospital and blood bank locations", async () => {
    const response = await chatbotService.processMessage("Where are nearby hospitals?");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("Apollo BGS Hospital");
    expect(response.category).toBe("hospitals");
  });

  it("returns conversational fallback response for unknown input", async () => {
    const response = await chatbotService.processMessage("random query xyz123");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("I'm here to help");
  });

  it("handles empty query gracefully", async () => {
    const response = await chatbotService.processMessage("   ");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("I'm here to help");
  });
});
