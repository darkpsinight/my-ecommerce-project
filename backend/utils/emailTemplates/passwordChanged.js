/*
Template source : https://github.com/wildbit/postmark-templates


The MIT License (MIT)

Copyright (c) 2015 Wildbit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

const passwordChangedTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <title>Password Changed</title>
        <style type="text/css" rel="stylesheet" media="all">
            @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap");
            body {
                width: 100% !important;
                height: 100%;
                margin: 0;
                -webkit-text-size-adjust: none;
                font-family: "Inter", Helvetica, Arial, sans-serif;
                background-color: #f4f7fa;
                color: #333;
            }

            a {
                color: #2563eb;
                text-decoration: none;
            }

            a:hover {
                text-decoration: underline;
            }

            .preheader {
                display: none !important;
                visibility: hidden;
                mso-hide: all;
                font-size: 1px;
                line-height: 1px;
                max-height: 0;
                max-width: 0;
                opacity: 0;
                overflow: hidden;
            }

            .email-wrapper {
                width: 100%;
                background-color: #f4f7fa;
                padding: 20px 0;
            }

            .email-content {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }

            .email-masthead {
                background: linear-gradient(to right, #2563eb, #1e40af);
                padding: 25px 0;
                text-align: center;
            }

            .email-masthead_name {
                font-size: 20px;
                font-weight: 700;
                color: #ffffff !important;
                text-decoration: none;
                text-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
                letter-spacing: -0.5px;
            }

            .email-body {
                padding: 40px;
            }

            .email-body_inner {
                width: 100%;
            }

            h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                color: #1a1a1a;
                letter-spacing: -0.5px;
                line-height: 1.3;
            }

            .alert-message {
                margin-top: 15px;
                font-size: 16px;
                line-height: 1.6;
                color: #4b5563;
            }

            .password-change-details {
                margin: 30px 0;
                padding: 25px;
                background-color: #f8fafc;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
            }

            .detail-item {
                margin: 0 0 12px;
                font-size: 15px;
                line-height: 1.6;
                color: #4b5563;
            }

            .detail-item:last-child {
                margin-bottom: 0;
            }

            .detail-label {
                font-weight: 600;
                color: #374151;
                display: inline-block;
                min-width: 100px;
            }

            .button {
                display: inline-block;
                margin-top: 25px;
                padding: 12px 24px;
                background-color: #dc2626;
                color: #ffffff !important;
                font-weight: 600;
                font-size: 15px;
                border-radius: 6px;
                text-decoration: none;
                text-align: center;
                transition: background-color 0.2s;
            }

            .button:hover {
                background-color: #b91c1c;
                text-decoration: none;
            }

            .help-text {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                line-height: 1.6;
            }

            .email-footer {
                padding: 25px 0;
                text-align: center;
                background-color: #f8fafc;
            }

            .email-footer p {
                margin: 0;
                font-size: 13px;
                color: #6b7280;
            }

            @media only screen and (max-width: 600px) {
                .email-body {
                    padding: 25px;
                }
            }

            @media (prefers-color-scheme: dark) {
                body, .email-wrapper {
                    background-color: #1a1a1a !important;
                }
                .email-content {
                    background-color: #262626 !important;
                }
                .email-masthead {
                    background: linear-gradient(to right, #1e40af, #1e3a8a) !important;
                }
                h1 {
                    color: #ffffff !important;
                }
                .alert-message, .detail-item {
                    color: #d1d5db !important;
                }
                .detail-label {
                    color: #e5e7eb !important;
                }
                .password-change-details {
                    background-color: #333333 !important;
                    border-color: #404040 !important;
                }
                .help-text {
                    border-color: #404040 !important;
                    color: #9ca3af !important;
                }
                .email-footer {
                    background-color: #333333 !important;
                }
                .email-footer p {
                    color: #9ca3af !important;
                }
            }
        </style>
    </head>
    <body>
        <span class="preheader">Your password has been successfully changed. If you didn't make this change, please contact us immediately.</span>
        <div class="email-wrapper">
            <div class="email-content">
                <div class="email-masthead">
                    <a href="{{appDomain}}" class="email-masthead_name">
                        {{appName}}
                    </a>
                </div>
                <div class="email-body">
                    <div class="email-body_inner">
                        <h1>Password Changed Successfully</h1>
                        <p class="alert-message">
                            Hi {{username}}, your password has been successfully changed. Here are the details of this change:
                        </p>
                        <div class="password-change-details">
                            <p class="detail-item">
                                <span class="detail-label">Time:</span> {{time}}
                            </p>
                            <p class="detail-item">
                                <span class="detail-label">Location:</span> {{location}}
                            </p>
                            <p class="detail-item">
                                <span class="detail-label">Device:</span> {{device}}
                            </p>
                            <p class="detail-item">
                                <span class="detail-label">Browser:</span> {{browser}}
                            </p>
                            <p class="detail-item">
                                <span class="detail-label">IP Address:</span> {{ipAddress}}
                            </p>
                        </div>
                        <p class="alert-message">
                            If you did not make this change, please take immediate action by clicking the button below:
                        </p>
                        <a href="{{reportUrl}}" class="button" target="_blank">Report Unauthorized Change</a>
                        <div class="help-text">
                            <p>For security, this request was received from a {{device}} using {{browser}}. If you did not change your password, please contact our support team immediately.</p>
                            <p>Need help or have questions? Contact our support team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>. We're here to help!</p>
                        </div>
                    </div>
                </div>
                <div class="email-footer">
                    <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
                </div>
            </div>
        </div>
    </body>
</html>`;

module.exports = { passwordChangedTemplate };
