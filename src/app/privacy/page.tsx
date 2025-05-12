import { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy | UniQVerse",
    description: "Information about how UniQVerse collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Privacy Header */}
            <div className="text-center mb-12">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                    <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Last Updated: April 30, 2025
                </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                <div className="prose prose-blue max-w-none">
                    <h2>1. Introduction</h2>
                    <p>
                        UniQVerse Inc. ("UniQVerse," "we," "us," or "our") values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website www.UniQVerse.com, use our mobile application, or otherwise interact with our services (collectively, the "Services").
                    </p>
                    <p>
                        Please read this Privacy Policy carefully. By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy. If you do not agree with our policies and practices, your choice is not to use our Services.
                    </p>
                    <p>
                        This Privacy Policy may change from time to time (see "Changes to Our Privacy Policy"). Your continued use of our Services after we make changes is deemed to be acceptance of those changes, so please check the policy periodically for updates.
                    </p>

                    <h2>2. Information We Collect</h2>
                    <p>
                        We collect several types of information from and about users of our Services, including:
                    </p>
                    <h3>2.1. Personal Information</h3>
                    <p>
                        When you create an account, place an order, sign up for our newsletter, participate in a survey, or otherwise interact with our Services, we may collect personal information, such as:
                    </p>
                    <ul>
                        <li>Contact information (such as name, email address, mailing address, and phone number)</li>
                        <li>Account credentials (such as username and password)</li>
                        <li>Payment information (such as credit card details and billing address)</li>
                        <li>Order history and preferences</li>
                        <li>Demographic information (such as age, gender, and location)</li>
                        <li>Any other information you choose to provide</li>
                    </ul>

                    <h3>2.2. Automatically Collected Information</h3>
                    <p>
                        When you access and use our Services, we may automatically collect certain information about your equipment, browsing actions, and patterns, including:
                    </p>
                    <ul>
                        <li>Usage details, such as traffic data, logs, and other communication data</li>
                        <li>Information about your computer and internet connection, including your IP address, operating system, and browser type</li>
                        <li>Information about your device and location when you use our mobile app</li>
                        <li>Information collected through cookies, web beacons, and other tracking technologies</li>
                    </ul>

                    <h3>2.3. Information from Third Parties</h3>
                    <p>
                        We may receive information about you from third parties including:
                    </p>
                    <ul>
                        <li>Business partners, such as payment processors and shipping providers</li>
                        <li>Social media platforms when you interact with our content or link your account to our Services</li>
                        <li>Marketing partners and analytics providers</li>
                    </ul>

                    <h2>3. How We Use Your Information</h2>
                    <p>
                        We use the information we collect about you or that you provide to us for various purposes, including:
                    </p>
                    <ul>
                        <li>To provide, maintain, and improve our Services</li>
                        <li>To process and fulfill your orders, including payment processing and delivery</li>
                        <li>To create and manage your account</li>
                        <li>To communicate with you about orders, products, services, promotions, and events</li>
                        <li>To personalize your experience and deliver content and product offerings relevant to your interests</li>
                        <li>To respond to your inquiries and provide customer support</li>
                        <li>To conduct research and analysis to improve our products and Services</li>
                        <li>To detect, prevent, and address technical issues, security breaches, and fraudulent activities</li>
                        <li>To comply with legal obligations and enforce our terms and policies</li>
                    </ul>

                    <h2>4. Cookies and Tracking Technologies</h2>
                    <p>
                        We and our service providers use cookies, web beacons, and other tracking technologies to track information about your use of our Services. We may combine this information with other personal information we collect from you.
                    </p>
                    <p>
                        Cookies are small data files stored on your device that help us improve our Services and your experience, see which areas and features of our Services are popular, and count visits. Web beacons (also known as "pixel tags" or "clear GIFs") are electronic images that may be used in our Services or emails to deliver cookies, count visits, and understand usage and campaign effectiveness.
                    </p>
                    <p>
                        You can choose to have your computer warn you each time a cookie is being sent, or you can choose to turn off all cookies through your browser settings. Most browsers allow you to refuse to accept cookies and to delete cookies. If you disable cookies, some features of our Services may not function properly.
                    </p>

                    <h2>5. How We Share Your Information</h2>
                    <p>
                        We may share your personal information with the following categories of third parties:
                    </p>
                    <ul>
                        <li><strong>Service Providers:</strong> We share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf. These include payment processors, shipping companies, cloud service providers, email service providers, and marketing partners.</li>
                        <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, financing, reorganization, bankruptcy, or sale of company assets, your information may be transferred as part of such transaction.</li>
                        <li><strong>Legal Requirements:</strong> We may disclose information if required to do so by law or in the good faith belief that such action is necessary to (i) comply with a legal obligation, (ii) protect and defend our rights or property, (iii) prevent fraud, (iv) act in urgent circumstances to protect the personal safety of users of the Services or the public, or (v) protect against legal liability.</li>
                        <li><strong>With Your Consent:</strong> We may share information with your consent or at your direction.</li>
                    </ul>
                    <p>
                        We may also share aggregated or de-identified information, which cannot reasonably be used to identify you, with third parties.
                    </p>

                    <h2>6. Your Privacy Rights and Choices</h2>
                    <p>
                        Depending on your location, you may have certain rights regarding your personal information. These may include:
                    </p>
                    <ul>
                        <li>Accessing, correcting, or deleting your personal information</li>
                        <li>Withdrawing your consent to our processing of your information</li>
                        <li>Requesting restrictions on how we use or disclose your information</li>
                        <li>Requesting a copy of your personal information in a structured, commonly used, and machine-readable format</li>
                        <li>Opting out of certain uses and disclosures of your information</li>
                    </ul>
                    <p>
                        To exercise these rights, please contact us using the information provided in the "Contact Us" section below. Please note that certain information may be exempt from such requests under applicable law.
                    </p>
                    <p>
                        In addition, you have the following specific choices regarding your information:
                    </p>
                    <ul>
                        <li><strong>Account Information:</strong> You can update your account information by logging into your account settings.</li>
                        <li><strong>Marketing Communications:</strong> You can opt out of receiving promotional emails from us by following the unsubscribe instructions included in those emails. Even if you opt out, we may still send you non-promotional messages, such as those about your account or our ongoing business relations.</li>
                        <li><strong>Push Notifications:</strong> If you use our mobile app, you can opt out of receiving push notifications through your device settings.</li>
                        <li><strong>Cookies:</strong> You can manage cookies as discussed in the "Cookies and Tracking Technologies" section above.</li>
                    </ul>

                    <h2>7. Data Security</h2>
                    <p>
                        We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on secure servers behind firewalls, and payment information is encrypted using SSL technology.
                    </p>
                    <p>
                        The safety and security of your information also depends on you. Where we have given you (or where you have chosen) a password for access to certain parts of our Services, you are responsible for keeping this password confidential. We ask you not to share your password with anyone.
                    </p>
                    <p>
                        Unfortunately, the transmission of information via the internet is not completely secure. Although we do our best to protect your personal information, we cannot guarantee the security of your personal information transmitted to our Services. Any transmission of personal information is at your own risk.
                    </p>

                    <h2>8. Data Retention</h2>
                    <p>
                        We will retain your personal information for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements. To determine the appropriate retention period for personal information, we consider the amount, nature, and sensitivity of the personal information, the potential risk of harm from unauthorized use or disclosure, the purposes for which we process the data, and whether we can achieve those purposes through other means.
                    </p>
                    <p>
                        In some circumstances, we may anonymize your personal information (so that it can no longer be associated with you) for research or statistical purposes, in which case we may use this information indefinitely without further notice to you.
                    </p>

                    <h2>9. Children's Privacy</h2>
                    <p>
                        Our Services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are under 13, do not use or provide any information on our Services. If we learn we have collected or received personal information from a child under 13 without verification of parental consent, we will delete that information. If you believe we might have any information from or about a child under 13, please contact us using the information provided in the "Contact Us" section below.
                    </p>

                    <h2>10. International Transfers</h2>
                    <p>
                        We are based in the United States and the information we collect is governed by U.S. law. If you are accessing our Services from outside the United States, please be aware that information collected through the Services may be transferred to, processed, stored, and used in the United States and other jurisdictions. Data protection laws in the U.S. and other jurisdictions may be different from those of your country of residence. Your use of the Services or provision of any information therefore constitutes your consent to the transfer to and from, processing, usage, sharing, and storage of your information in the U.S. and other jurisdictions as set forth in this Privacy Policy.
                    </p>

                    <h2>11. Changes to Our Privacy Policy</h2>
                    <p>
                        We may update our Privacy Policy from time to time. If we make material changes to how we treat our users' personal information, we will notify you through a notice on our website or by email. The date the Privacy Policy was last revised is identified at the top of the page. You are responsible for ensuring we have an up-to-date active and deliverable email address for you, and for periodically visiting our website and this Privacy Policy to check for any changes.
                    </p>

                    <h2>12. Contact Us</h2>
                    <p>
                        If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
                    </p>
                    <ul>
                        <li>Email: <a href="mailto:privacy@UniQVerse.com" className="text-blue-600 hover:underline">privacy@UniQVerse.com</a></li>
                        <li>Phone: 1-800-555-1234</li>
                        <li>Mail: UniQVerse Inc., Attn: Privacy Officer, 123 Commerce Street, Suite 500, New York, NY 10001</li>
                    </ul>
                    <p>
                        We will respond to your request or inquiry as soon as reasonably possible.
                    </p>
                </div>
            </div>
        </div>
    );
}