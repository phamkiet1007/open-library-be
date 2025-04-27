const { sendConfirmationMail } = require('./src/utils/send_email.utils');

(async () => {
  try {
    await sendConfirmationMail(token, name, email);
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
})();
