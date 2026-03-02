\
const nodemailer = require("nodemailer");

/**
 * POST /api/lead
 * Body: { source, hizmet, teslim, butce, ad, telefon, email, not, product, deadline, message, page }
 */
module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const body = req.body || {};
    const {
      source = "site",
      page = "",
      hizmet = "",
      teslim = "",
      butce = "",
      ad = "",
      telefon = "",
      email = "",
      not = "",
      product = "",
      deadline = "",
      message = "",
    } = body;

    // Basic validation
    const requiredOk = (ad || "").trim() && (telefon || "").trim() && (email || "").trim();
    if (!requiredOk && source === "chat") {
      return res.status(400).json({ ok: false, error: "Eksik bilgi: ad/telefon/e-posta" });
    }

    // SMTP env
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      TO_EMAIL,
      FROM_EMAIL,
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !TO_EMAIL || !FROM_EMAIL) {
      return res.status(500).json({
        ok: false,
        error:
          "Sunucu e-posta ayarları eksik. (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/TO_EMAIL/FROM_EMAIL)",
      });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // 465 => SSL
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const subject =
      source === "form"
        ? "Yeni Talep (Form) — Boost Digital"
        : "Yeni Talep (Chat) — Boost Digital";

    const lines = [
      `Kaynak: ${source}`,
      page ? `Sayfa: ${page}` : "",
      "",
      product ? `Ürün/Hizmet: ${product}` : (hizmet ? `Hizmet: ${hizmet}` : ""),
      teslim ? `Teslim hedefi: ${teslim}` : "",
      butce ? `Bütçe aralığı: ${butce}` : "",
      deadline ? `Hedef tarih: ${deadline}` : "",
      "",
      ad ? `Ad Soyad: ${ad}` : "",
      telefon ? `Telefon: ${telefon}` : "",
      email ? `E-posta: ${email}` : "",
      "",
      not ? `Not: ${not}` : "",
      message ? `Mesaj: ${message}` : "",
    ].filter(Boolean);

    const text = lines.join("\n");

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email || undefined,
      subject,
      text,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "E-posta gönderilemedi." });
  }
};
