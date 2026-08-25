import { chatbotService } from "@/services/chatbotService";

describe("BloodLink Chatbot Service", () => {
  it("processes blood compatibility query for O- correctly", async () => {
    const response = await chatbotService.processMessage("Who can receive O- blood?");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("Universal Red Blood Cell Donor");
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
    expect(response.text).toContain("Emergency Blood Request");
    expect(response.category).toBe("emergency");
  });

  it("processes hospital and blood bank locations", async () => {
    const response = await chatbotService.processMessage("Where are nearby hospitals?");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("Apollo BGS Hospital");
    expect(response.category).toBe("hospitals");
  });

  it("returns fallback response with helpful topics for unknown input", async () => {
    const response = await chatbotService.processMessage("random query xyz123");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("Thank you for your question");
  });

  it("handles empty query gracefully", async () => {
    const response = await chatbotService.processMessage("   ");
    expect(response.sender).toBe("assistant");
    expect(response.text).toContain("Please type a question");
  });
});
