export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyAddress =
    process.env.WAITLIST_NOTIFY_EMAIL || "info@otherhalfapp.com";
  const fromAddress =
    process.env.WAITLIST_FROM_EMAIL || "Otherhalf Waitlist <waitlist@resend.dev>";

  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Missing RESEND_API_KEY server configuration." });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: notifyAddress,
        subject: "New Otherhalf waitlist signup",
        html: `<p>New subscriber: <strong>${email}</strong></p>`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        detail || "Failed to notify waitlist inbox. Verify sender domain."
      );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Waitlist submission failed:", error);
    return res
      .status(500)
      .json({
        error:
          error.message ||
          "Unable to submit waitlist entry. Please try again shortly.",
      });
  }
}

