exports.handler = async (event) => {
  try {
    const { text } = JSON.parse(event.body);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
                  text: `Ubah narasi berikut menjadi prompt video AI yang menarik dalam bahasa Inggris:

${text}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        result:
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Tidak ada hasil"
      })
    };
  catch (error) {
  return {
    statusCode: 500,
    body: JSON.stringify({
      result: error.message
    })
  };
};
