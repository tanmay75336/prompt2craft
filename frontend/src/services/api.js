const API_URL = "http://localhost:8081/api/generate";

export const generatePresentation = async (topic, slides) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: topic,
      slides: slides,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate presentation");
  }

  return await response.blob();
};