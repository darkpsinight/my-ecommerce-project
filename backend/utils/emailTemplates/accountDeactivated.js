const accountDeactivatedTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Account Deactivation Notice</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        body {
            background-color: #f3f4f6;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            font-size: 15px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }

        .email-wrapper {
            background-color: #f3f4f6;
            padding: 32px 16px;
            width: 100%;
        }

        .email-content {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            margin: 0 auto;
            max-width: 600px;
            overflow: hidden;
        }

        .email-masthead {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            padding: 32px 0;
            text-align: center;
            position: relative;
        }

        .email-masthead:after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8);
        }

        .email-masthead_name {
            color: #ffffff !important;
            font-size: 24px;
            font-weight: 700;
            text-decoration: none;
            text-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
            letter-spacing: -0.5px;
        }

        .email-body {
            padding: 48px 40px;
        }

        .email-body_inner {
            width: 100%;
        }

        h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
            letter-spacing: -0.5px;
            line-height: 1.3;
        }

        .main-message {
            margin-top: 20px;
            font-size: 16px;
            line-height: 1.6;
            color: #4b5563;
        }

        .deactivation-text {
            margin: 0 0 16px;
            font-size: 15px;
            line-height: 1.6;
            color: #4b5563;
        }

        .deactivation-box {
            margin: 16px 0;
            padding: 24px;
            background-color: #fffbeb;
            border-radius: 10px;
            border: 1px solid #fef3c7;
            position: relative;
            overflow: hidden;
        }

        .deactivation-box:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(to bottom, #f59e0b, #d97706);
        }

        .timeline-list {
            margin: 0;
            padding: 0;
            list-style-type: none;
        }

        .timeline-list li {
            margin: 8px 0;
            padding-left: 28px;
            color: #4b5563;
            position: relative;
        }

        .timeline-list li:before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 18px;
            height: 18px;
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
        }

        .warning-text {
            color: #dc2626;
            font-weight: 600;
        }

        .reactivation-box {
            margin: 24px 0;
            padding: 24px;
            background-color: #f8fafc;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            text-align: center;
        }

        .reactivation-title {
            margin: 0 0 16px;
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
        }

        .button {
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: #ffffff !important;
            font-weight: 600;
            font-size: 15px;
            border-radius: 8px;
            text-decoration: none;
            text-align: center;
            transition: all 0.2s;
            margin-top: 20px;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        }

        .button:hover {
            background: linear-gradient(135deg, #1d4ed8, #1e40af);
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.25);
        }

        .help-text {
            margin-top: 36px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            line-height: 1.6;
        }

        .email-footer {
            padding: 32px 0;
            text-align: center;
            background-color: #f8fafc;
            border-top: 1px solid #e5e7eb;
        }

        .email-footer p {
            margin: 0;
            font-size: 13px;
            color: #6b7280;
        }

        .data-notice {
            margin-top: 16px;
            padding: 12px 16px;
            background-color: #f3f4f6;
            border-radius: 6px;
            font-size: 13px;
            color: #6b7280;
        }

        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 32px 24px;
            }
            
            .deactivation-box, .reactivation-box {
                padding: 24px 20px;
            }
        }

        @media (prefers-color-scheme: dark) {
            body, .email-wrapper {
                background-color: #1a1a1a !important;
            }
            .email-content {
                background-color: #262626 !important;
                border-color: #374151 !important;
            }
            .email-masthead {
                background: linear-gradient(135deg, #1e40af, #1e3a8a) !important;
            }
            .email-masthead:after {
                background: linear-gradient(90deg, #2563eb, #1e40af, #1e3a8a) !important;
            }
            h1, .reactivation-title {
                color: #ffffff !important;
            }
            .main-message, .deactivation-text, .timeline-list li {
                color: #d1d5db !important;
            }
            .deactivation-box {
                background-color: #422006 !important;
                border-color: #854d0e !important;
            }
            .reactivation-box {
                background-color: #1f2937 !important;
                border-color: #374151 !important;
            }
            .help-text, .email-footer p {
                color: #9ca3af !important;
                border-color: #374151 !important;
            }
            .data-notice {
                background-color: #1f2937 !important;
                color: #9ca3af !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-content">
            <div class="email-masthead">
                <a href="#" class="email-masthead_name">
                    {{appName}}
                </a>
            </div>
            <div class="email-body">
                <div class="email-body_inner">
                    <h1>Account Deactivation Notice</h1>
                    <p class="main-message">Dear {{username}},</p>
                    <p class="deactivation-text">We've received your request to delete your account. Your account has been deactivated and is scheduled for permanent deletion. Here's what you need to know:</p>
                    
                    <div class="deactivation-box">
                        <ul class="timeline-list">
                            <li class="calendar">Account deactivated on: <strong>{{deactivationDate}}</strong></li>
                            <li class="warning warning-text">Scheduled deletion date: <strong>{{deletionDate}}</strong></li>
                            <li class="clock">Grace period: <strong>{{deletionDelayDays}} days</strong></li>
                        </ul>
                        <div class="data-notice">
                            <strong>Important:</strong> After {{deletionDate}}, all your account data, including your profile, settings, and any content you've created will be permanently deleted and cannot be recovered.
                        </div>
                    </div>

                    <div class="reactivation-box">
                        <h2 class="reactivation-title">Changed Your Mind?</h2>
                        <p style="margin-bottom: 0;">You can reactivate your account at any time during the {{deletionDelayDays}}-day grace period. Simply log in to cancel the deletion process and restore your account to its active state.</p>
                        <a href="{{buttonHREF}}" class="button" target="_blank">
                            REACTIVATE MY ACCOUNT
                        </a>
                    </div>

                    <p class="help-text">
                        If you have any questions about your account deletion or need assistance, please contact our support team. We're here to help.<br><br>
                        Thank you for being part of the {{appName}} community. We're sorry to see you go and hope to welcome you back in the future.
                    </p>
                </div>
            </div>
            <div class="email-footer">
                <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
                <p style="margin-top: 8px;">This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

module.exports = { accountDeactivatedTemplate };
