const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

const FALLBACK = (description, location) => ({
  severity: 'high',
  category: 'unknown',
  sms_payload: (description + ' at ' + location).substring(0, 140),
  keywords: [],
});

export async function triageRequest(description, location) {
  const prompt =
    `You are an emergency triage classifier for disaster response. Return ONLY a valid JSON object. No markdown, no backticks, no explanation.

{
  "severity": "critical|high|medium|low",
  "category": "medical|structural|rescue|supply|fire|unknown",
  "sms_payload": "under 140 chars: location + core emergency compressed",
  "keywords": ["array", "of", "key", "terms"]
}

Severity rules:
- critical: trapped, unconscious, drowning, active fire, life-threatening immediate
- high: injured, building collapse, urgent medical needed
- medium: shelter needed, supply shortage, non-life-threatening
- low: information request, safe check-in, non-urgent

Description: ` + description + `
Location: ` + location;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 300,
        },
      }),
    });

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Triage failed, using fallback:', error);
    return FALLBACK(description, location);
  }
}
