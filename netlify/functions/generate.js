exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const text = body.text || "";

    if (!text) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          result: "Teks narasi belum tersedia."
        })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          result: "GEMINI_API_KEY belum terbaca di Netlify."
        })
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "Ubah narasi berikut menjadi prompt video AI berbahasa Inggris, singkat, visual, dan menarik. Output hanya prompt saja:\n\n" +
                    text
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.error?.message ||
      "Gemini tidak mengembalikan hasil.";

    return {
      statusCode: 200,
      body: JSON.stringify({ result })
    };
  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        result: "Error: " + error.message
      })
    };
  }
};