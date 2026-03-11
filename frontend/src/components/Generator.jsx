import { useState } from "react";
import { generatePresentation } from "../services/api";

export default function Generator() {

  const [topic, setTopic] = useState("");
  const [slides, setSlides] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const blob = await generatePresentation(topic, slides);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `${topic}.pptx`;

      document.body.appendChild(a);
      a.click();
      a.remove();

    } catch (error) {
      alert("Error generating presentation");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">

      <div className="w-full max-w-xl p-10 bg-gray-900 rounded-2xl shadow-xl">

        <h1 className="text-3xl font-bold text-center mb-6">
          Prompt2Craft
        </h1>

        <p className="text-gray-400 text-center mb-8">
          Generate AI powered presentations instantly
        </p>

        {/* Topic input */}

        <input
          type="text"
          placeholder="Enter presentation topic"
          className="w-full p-3 mb-4 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        {/* Slides input */}

        <input
          type="number"
          min="3"
          max="30"
          className="w-full p-3 mb-6 rounded-lg bg-gray-800 border border-gray-700"
          value={slides}
          onChange={(e) => setSlides(e.target.value)}
        />

        {/* Generate Button */}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 transition p-3 rounded-lg font-semibold"
        >
          {loading ? "Generating..." : "Generate Presentation"}
        </button>

      </div>

    </div>
  );
}