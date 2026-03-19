export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";

async function parseError(response, fallbackMessage) {
  try {
    const data = await response.json();
    return data?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export const previewPresentation = async (topic, slides) => {
  const response = await fetch(`${API_BASE_URL}/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      slides,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to generate presentation preview"));
  }

  return response.json();
};

export const generatePresentation = async (topic, slides) => {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      slides,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to generate presentation"));
  }

  return response.blob();
};

export const generatePresentationFromJson = async (slides) => {
  const response = await fetch(`${API_BASE_URL}/generate-from-json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slides,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to generate presentation from edited slides"));
  }

  return response.blob();
};

export const createPaymentOrder = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/payments/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to create payment order"));
  }

  return response.json();
};

export const verifyPayment = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to verify payment"));
  }

  return response.json();
};
