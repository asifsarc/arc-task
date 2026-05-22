import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

const sendEmail = async (options: EmailOptions) => {
    // Utilize external Environment transport mappings, defaulting to standard 587 SMPT configs.
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
    };

    const info = await transporter.sendMail(message);
    
    // Developer helper, normally disabled in prod 
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Email dispatched safely. SMTP Message ID: ${info.messageId}`);
    }
};

export default sendEmail;
