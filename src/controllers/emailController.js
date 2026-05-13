import { Resend } from 'resend';
import createHttpError from 'http-errors';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendContactEmail = async (req, res, next) => {
    console.log('=== ОТРИМАНО ЗАПИТ ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body:', req.body);
    console.log('Body type:', typeof req.body);
    console.log('Body keys:', req.body ? Object.keys(req.body) : 'no body');
  try {
    const { name, email, phone, comment } = req.body;

    // Валідація обов'язкових полів
    if (!name || !email || !phone) {
      throw createHttpError(400, "Будь ласка, заповніть всі обов'язкові поля");
    }

    // Валідація email формату
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createHttpError(400, 'Невірний формат email');
    }

    // Відправка email через Resend
    const { data, error } = await resend.emails.send({
      from: 'Photography message <onboarding@resend.dev>',
      to: ['info@stanislavkochubey.cz'],
      subject: `Нове повідомлення від ${name}`,
      replyTo: email,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f4f4f4; padding: 10px; text-align: center; }
            .content { padding: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-top: 5px; }
            .footer { background: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Нове повідомлення з форми контакту</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Ім'я:</div>
                <div class="value">${escapeHtml(name)}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${escapeHtml(email)}</div>
              </div>
              <div class="field">
                <div class="label">Телефон:</div>
                <div class="value">${escapeHtml(phone)}</div>
              </div>
              <div class="field">
                <div class="label">Коментар:</div>
                <div class="value">${comment ? escapeHtml(comment) : 'Без коментаря'}</div>
              </div>
            </div>
            <div class="footer">
              <p>Повідомлення відправлено з сайту stanislavkochubey.cz</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Нове повідомлення з форми контакту
        -------------------------
        Ім'я: ${name}
        Email: ${email}
        Телефон: ${phone}
        Коментар: ${comment || 'Без коментаря'}

        Повідомлення відправлено з сайту stanislavkochubey.cz
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw createHttpError(
        500,
        error.message || 'Помилка при відправці email',
      );
    }

    // Логуємо успішну відправку
    console.log(`Email sent successfully to mrakul84@gmail.com from ${email}`);

    res.status(200).json({
      message: 'Повідомлення успішно відправлено!',
      data: data,
    });
  } catch (error) {
    console.error('Send email error:', error);
    next(error);
  }
};

// Проста функція для екранування HTML
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
