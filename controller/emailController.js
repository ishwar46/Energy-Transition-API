const { sendEmail } = require('../middlewares/sendMail');

// POST /api/contact
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate if name, email, and message are provided
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    // Send email using Nodemailer
    await sendEmail({
      email: process.env.MY_EMAIL, // Your email where you want to receive the contact form data
      subject: 'New Contact Form Submission',
      message: `
        Name: ${name}
        Email: ${email}
        Message: ${message}
      `,
    });

    res.status(200).json({ 
      success: true,
      message: 'Contact form submitted successfully.' 
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
};