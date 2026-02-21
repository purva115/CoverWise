const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`

export async function askGemini(prompt) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  })

  if (!res.ok) {
    const err = await res.json()
    console.error('Gemini error:', err)
    throw new Error(`Gemini API error: ${res.status}`)
  }

  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

export async function parseInsurance(rawText) {
  return askGemini(`
    You are a medical insurance expert. Parse this insurance information and return ONLY valid JSON with no markdown, no backticks, no explanation:
    ${rawText}
    
    Return this exact structure:
    {
      "planName": "",
      "provider": "",
      "deductible": "",
      "outOfPocketMax": "",
      "covered": ["list of what is covered"],
      "notCovered": ["list of exclusions"],
      "copay": "",
      "summary": "2 sentence plain english summary"
    }
  `)
}

export async function searchTreatment(query, insuranceData) {
  return askGemini(`
    You are a medical insurance cost expert.
    Search Query: "${query}"
    Patient Insurance: ${JSON.stringify(insuranceData)}
    
    Return ONLY valid JSON with no markdown, no backticks, no explanation:
    {
      "procedureName": "official name of the medical procedure or treatment",
      "description": "1-2 sentence description of what this involves",
      "estimatedCost": "$X,XXX",
      "yourEstimatedCost": "$X,XXX",
      "breakdown": [
        { "label": "Facility Fee", "value": "$XXX" },
        { "label": "Provider Fee", "value": "$XXX" },
        { "label": "Insurance Covered", "value": "-$XXX" },
        { "label": "Your Responsibility", "value": "$XXX" }
      ],
      "advice": "Pro-tip for saving money on this specific procedure (e.g. go to outpatient vs hospital)",
      "summary": "1 sentence plain english summary for audio readout"
    }
  `)
}