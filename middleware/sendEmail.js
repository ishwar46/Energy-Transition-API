const nodeMail = require('nodemailer');

exports.sendEmail = async (options) => {
    const transporter = nodeMail.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure:true,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        },
        service: process.env.SMTP_SERVICE,
    });
    const mailOptions = {
        from: process.env.SMTP_EMAIL, 
        subject: options.subject,
        html: options.html, // Use html property instead of text for HTML content
        to: options.to
    }
    await transporter.sendMail(mailOptions);
}
