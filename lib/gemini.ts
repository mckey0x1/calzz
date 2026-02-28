export async function analyzeFoodImageBase64(base64Image: string) {
  const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.warn("No EXPO_PUBLIC_GEMINI_API_KEY found, using mock data.");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return {
      name: "AI Analyzed Meal (Mock)",
      calories: 450,
      protein: 25,
      carbs: 40,
      fat: 15,
      score: 8,
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [
        {
          parts: [
            {
              text: "Analyze this image of food. Estimate the total calories, protein in grams, carbohydrates in grams, and fat in grams. Also provide a health score from 1 to 10 (10 being very healthy), and a short descriptive name for the dish. Respond STRICTLY in JSON format without any markdown wrappers or additional text, like this:\n{\n  \"name\": \"Chicken Salad\",\n  \"calories\": 350,\n  \"protein\": 30,\n  \"carbs\": 10,\n  \"fat\": 20,\n  \"score\": 8\n}",
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(textResponse);
    return parsedData;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback on error
    return {
      name: "Analysis Failed",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      score: 0,
    };
  }
}
