require('dotenv').config();
const nodemailer = require('nodemailer');
const { configs } = require('./configs');

async function testEmailConfiguration() {
    console.log('\n🔍 Testing Email Configuration...');
    console.log('----------------------------------------');
    
    // Log current configuration
    console.log('Current SMTP Configuration:');
    console.log(`Host: ${configs.SMTP_HOST}`);
    console.log(`Port: ${configs.SMTP_PORT}`);
    console.log(`Email: ${configs.SMTP_EMAIL}`);
    console.log(`Password: ${'*'.repeat(configs.SMTP_PASSWORD?.length || 0)}`);
    console.log(`From Name: ${configs.FROM_NAME}`);
    console.log(`From Email: ${configs.FROM_EMAIL}`);
    console.log(`Disable Mail: ${configs.DISABLE_MAIL}`);
    console.log('----------------------------------------\n');

    try {
        // Create transporter
        console.log('1. Creating SMTP Transporter...');
        const transporter = nodemailer.createTransport({
            host: configs.SMTP_HOST,
            port: configs.SMTP_PORT,
            secure: false, // For port 587, use false and enable STARTTLS
            auth: {
                user: configs.SMTP_EMAIL,
                pass: configs.SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false, // For development only
                ciphers:'SSLv3' // For Gmail
            }
        });

        // Verify connection
        console.log('2. Verifying SMTP Connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        // Send test email
        console.log('\n3. Sending Test Email...');
        const info = await transporter.sendMail({
            from: `${configs.FROM_NAME} <${configs.FROM_EMAIL}>`,
            to: configs.SMTP_EMAIL, // Sending to self for testing
            subject: 'SMTP Test Email',
            html: `
                <h2>SMTP Test Successful!</h2>
                <p>This email confirms that your SMTP configuration is working correctly.</p>
                <p>Configuration details:</p>
                <ul>
                    <li>Host: ${configs.SMTP_HOST}</li>
                    <li>Port: ${configs.SMTP_PORT}</li>
                    <li>From: ${configs.FROM_NAME} (${configs.FROM_EMAIL})</li>
                    <li>Timestamp: ${new Date().toISOString()}</li>
                </ul>
            `
        });

        console.log('✅ Test Email Sent Successfully!');
        console.log(`Message ID: ${info.messageId}`);
        console.log('\nAll tests passed! Your email configuration is working correctly. ✨');

    } catch (error) {
        console.error('\n❌ Email Test Failed!');
        console.error('Error Details:');
        console.error('----------------------------------------');
        console.error(`Error Name: ${error.name}`);
        console.error(`Error Message: ${error.message}`);
        
        // Provide helpful tips based on common errors
        console.log('\n🔧 Troubleshooting Tips:');
        if (error.code === 'EAUTH') {
            console.log('1. Verify your Gmail account has 2-Step Verification enabled');
            console.log('2. Make sure you\'re using an App Password, not your regular password');
            console.log('3. Generate a new App Password in Gmail settings');
        } else if (error.code === 'ESOCKET') {
            console.log('1. Check if your firewall is blocking the connection');
            console.log('2. Verify the SMTP port (587 or 465) is correct');
            console.log('3. Ensure you\'re using the correct secure setting for your port');
        } else if (error.code === 'ECONNECTION') {
            console.log('1. Check your internet connection');
            console.log('2. Verify the SMTP host is correct');
            console.log('3. Ensure your network allows SMTP connections');
        }
        
        process.exit(1);
    }
}

// Run the test
testEmailConfiguration();
