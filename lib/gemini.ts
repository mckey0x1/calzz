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
      fiber: 8,
      sugar: 4,
      sodium: 700,
      score: 8,
      servingSize: "1 plate (~350g)",
      items: [
        { name: "Rice", estimatedGrams: 200, method: "reference_scaling" },
        { name: "Chicken Curry", estimatedGrams: 150, method: "depth_estimation" },
      ],
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const analysisPrompt = `You are an expert food nutritionist and computer vision scientist. Analyze this food image using a **multi-method volume and weight estimation pipeline** to provide the most accurate nutrition data possible.

## STEP 1: FOOD SEGMENTATION (Pixel-Level Analysis)
- Identify and segment each distinct food item in the image.
- For each food item, estimate the percentage of plate/container area it occupies.
- Note the visual boundaries between different food components.

## STEP 2: REFERENCE OBJECT SCALING
- Look for reference objects in the image to calibrate real-world size:
  - Standard dinner plate (~25cm / 10in diameter)
  - Standard bowl (~15cm / 6in diameter)
  - Spoons, forks, knives (standard sizes)
  - Hands, fingers if visible
  - Cups, glasses (standard sizes)
  - Packaging with known dimensions
- If a plate is visible, use it as the primary reference.
- If no clear reference object exists, use typical serving vessel assumptions.

## STEP 3: DEPTH ESTIMATION (3D Volume from 2D)
- Estimate the height/thickness of each food item from visual cues:
  - Shadows and highlights indicate depth
  - Food piling patterns
  - Edge thickness visible from the angle
  - Perspective distortion clues
- Convert the estimated area × height into approximate volume (ml/cm³) for each food item.

## STEP 4: VOLUME → WEIGHT CONVERSION
Use food density values to convert volume to grams:
- Rice (cooked): ~1.1 g/ml
- Bread: ~0.4 g/ml
- Chicken/Meat: ~1.05 g/ml
- Vegetables (mixed): ~0.6 g/ml
- Paneer/Cheese: ~1.1 g/ml
- Dal/Lentils (cooked): ~1.05 g/ml
- Pasta (cooked): ~1.0 g/ml
- Salad greens: ~0.2 g/ml
- Fried foods: ~0.8 g/ml
- Sauce/Gravy: ~1.0 g/ml
- Fruits: ~0.8 g/ml
- Nuts/Seeds: ~0.7 g/ml
- Oil/Butter visible: ~0.9 g/ml

Formula: grams = estimated_volume_ml × density

## STEP 5: WEIGHT → NUTRITION CALCULATION
Using the estimated weight for each food item, calculate:
- Calories (kcal) using standard nutritional databases
- Protein (g)
- Carbohydrates (g)
- Fat (g)
- Fiber (g)
- Sugar (g)
- Sodium (mg)

## STEP 6: HEALTH SCORE
Rate the meal from 1-10 based on:
- Nutrient density and balance
- Presence of whole foods vs processed foods
- Vegetable/fruit content
- Excessive oil, sugar, or sodium

## OUTPUT FORMAT
Respond STRICTLY in JSON format without any markdown wrappers or additional text:
{
  "name": "Descriptive Dish Name",
  "calories": 350,
  "protein": 30,
  "carbs": 10,
  "fat": 20,
  "fiber": 5,
  "sugar": 2,
  "sodium": 450,
  "score": 8,
  "servingSize": "1 plate (~350g)",
  "items": [
    {
      "name": "Food Item 1",
      "estimatedGrams": 200,
      "method": "reference_scaling"
    },
    {
      "name": "Food Item 2",
      "estimatedGrams": 150,
      "method": "depth_estimation"
    }
  ]
}

IMPORTANT:
- Be as precise as possible with gram estimates. Do NOT round to the nearest 50 or 100.
- The "method" field should be one of: "reference_scaling", "depth_estimation", "segmentation", "density_conversion".
- "servingSize" should be a human-readable description like "1 bowl (~250g)" or "1 plate (~400g)".
- The nutrition values should be the TOTAL for all items combined.
- If the image is unclear or not food, set calories to 0 and name to "Unable to analyze".`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: analysisPrompt,
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

    // Ensure all required fields exist with defaults
    return {
      name: parsedData.name || "Analyzed Meal",
      calories: parsedData.calories || 0,
      protein: parsedData.protein || 0,
      carbs: parsedData.carbs || 0,
      fat: parsedData.fat || 0,
      fiber: parsedData.fiber || 0,
      sugar: parsedData.sugar || 0,
      sodium: parsedData.sodium || 0,
      score: parsedData.score || 5,
      servingSize: parsedData.servingSize || "1 serving",
      items: parsedData.items || [],
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback on error
    return {
      name: "Analysis Failed",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      score: 0,
      servingSize: "Unknown",
      items: [],
    };
  }
}
