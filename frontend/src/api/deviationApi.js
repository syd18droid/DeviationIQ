const API_BASE_URL = "http://127.0.0.1:8000";

export async function analyzeDeviation(
  deviationText
) {
  const response = await fetch(
    `${API_BASE_URL}/api/deviations/analyze`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviation_text: deviationText,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to analyze deviation"
    );
  }

  return response.json();
}

export async function analyzeDeviationPdf(
  file
) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/api/deviations/extract-pdf`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to analyze PDF"
    );
  }

  return response.json();
}

export async function chatWithDeviationCopilot(
  currentData,
  userMessage
) {
  const response = await fetch(
    `${API_BASE_URL}/api/deviations/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_data: currentData,
        user_message: userMessage,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to process Copilot message"
    );
  }

  return response.json();
}

export async function saveDeviation(
  deviationData
) {
  const response = await fetch(
    `${API_BASE_URL}/api/deviations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deviationData),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to save deviation"
    );
  }

  return response.json();
}