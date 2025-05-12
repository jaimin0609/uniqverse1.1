import { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms of Service | UniQVerse",
    description: "The terms and conditions governing your use of the UniQVerse platform and services.",
};

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Terms Header */}
            <div className="text-center mb-12">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Service</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Last Updated: April 30, 2025
                </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                <div className="prose prose-blue max-w-none">
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to UniQVerse. These Terms of Service ("Terms") govern your access to and use of the UniQVerse website, mobile application, and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
                    </p>
                    <p>
                        Our Privacy Policy also governs your use of our Services and explains how we collect, safeguard and disclose information that results from your use of our web pages. Please read it here: <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                    </p>
                    <p>
                        By using our Services, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or instructions provided in any email we send.
                    </p>

                    <h2>2. Definitions</h2>
                    <p>
                        For the purposes of these Terms:
                    </p>
                    <ul>
                        <li><strong>"Account"</strong> means a unique account created for you to access our Services or parts of our Services.</li>
                        <li><strong>"Company"</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to UniQVerse Inc., 123 Commerce Street, Suite 500, New York, NY 10001.</li>
                        <li><strong>"Customer"</strong> refers to the company, organization or person that signs up to use the UniQVerse Services.</li>
                        <li><strong>"Service"</strong> refers to the UniQVerse website, mobile application, and services.</li>
                        <li><strong>"Terms"</strong> mean these Terms of Service that form the entire agreement between You and the Company regarding the use of the Service.</li>
                        <li><strong>"Third-party Service"</strong> means any service or content (including data, information, products or services) provided by a third-party that may be displayed, included or made available by the Service.</li>
                        <li><strong>"Website"</strong> refers to UniQVerse, accessible from <Link href="https://www.UniQVerse.com" className="text-blue-600 hover:underline">https://www.UniQVerse.com</Link></li>
                        <li><strong>"You"</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
                    </ul>

                    <h2>3. Account Registration and Use</h2>
                    <p>
                        To use certain features of the Services, you may be required to register for an account. When you register for an account, you must provide accurate, current, and complete information as prompted by the registration form. You are responsible for safeguarding the password that you use to access the Services and for any activities or actions under your password. We encourage you to use "strong" passwords (passwords that use a combination of upper and lower case letters, numbers, and symbols) with your account. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
                    </p>
                    <p>
                        You may not use as a username the name of another person or entity or that is not lawfully available for use, a name or trademark that is subject to any rights of another person or entity other than you without appropriate authorization, or a name that is otherwise offensive, vulgar or obscene.
                    </p>

                    <h2>4. Purchases</h2>
                    <p>
                        If you wish to purchase any product or service made available through the Service ("Purchase"), you may be asked to supply certain information relevant to your Purchase including, without limitation, your name, shipping address, billing address, credit card information, billing information, and other information.
                    </p>
                    <p>
                        You represent and warrant that: (i) you have the legal right to use any credit card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information you supply to us is true, correct and complete.
                    </p>
                    <p>
                        By submitting such information, you grant us the right to provide the information to third parties for purposes of facilitating the completion of Purchases.
                    </p>
                    <p>
                        We reserve the right to refuse or cancel your order at any time for certain reasons including but not limited to: product or service availability, errors in the description or price of the product or service, error in your order or other reasons.
                    </p>
                    <p>
                        We reserve the right to refuse or cancel your order if fraud or an unauthorized or illegal transaction is suspected.
                    </p>

                    <h2>5. Product Descriptions and Pricing</h2>
                    <p>
                        We attempt to be as accurate as possible with descriptions of our products. However, we do not warrant that product descriptions or other content of the Services is accurate, complete, reliable, current, or error-free.
                    </p>
                    <p>
                        All products are subject to availability, and we cannot guarantee that items will be in stock. We reserve the right to discontinue any products at any time. Prices for all products are subject to change without notice. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.
                    </p>
                    <p>
                        We do not guarantee that the quality of any products, services, information, or other material purchased or obtained by you will meet your expectations, or that any errors in the Service will be corrected.
                    </p>

                    <h2>6. Shipping and Delivery</h2>
                    <p>
                        Delivery times are estimates and commence from the date of shipping, rather than the date of order. Delivery times are to be used as a guide only and are subject to the acceptance and approval of your order.
                    </p>
                    <p>
                        Unless there are exceptional circumstances, we make every effort to fulfill your order within the estimated delivery timeframes. However, delays are occasionally inevitable due to unforeseen factors. UniQVerse shall be under no liability for any delay or failure to deliver products if the delay or failure is wholly or partly caused by circumstances beyond our control.
                    </p>

                    <h2>7. Returns and Refunds</h2>
                    <p>
                        Our Returns & Refund Policy forms a part of these Terms. Please read our Returns & Refund Policy to learn more about returns, refunds, and exchanges: <Link href="/returns" className="text-blue-600 hover:underline">Returns & Exchanges Policy</Link>.
                    </p>

                    <h2>8. Intellectual Property</h2>
                    <p>
                        The Services and their original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of UniQVerse and its licensors. The Services are protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of UniQVerse.
                    </p>
                    <p>
                        You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Services, except as follows:
                    </p>
                    <ul>
                        <li>Your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials.</li>
                        <li>You may store files that are automatically cached by your Web browser for display enhancement purposes.</li>
                        <li>You may print or download one copy of a reasonable number of pages of the Services for your own personal, non-commercial use and not for further reproduction, publication, or distribution.</li>
                        <li>If we provide social media features with certain content, you may take such actions as are enabled by such features.</li>
                    </ul>

                    <h2>9. Prohibited Uses</h2>
                    <p>
                        You may use the Services only for lawful purposes and in accordance with these Terms. You agree not to use the Services:
                    </p>
                    <ul>
                        <li>In any way that violates any applicable federal, state, local, or international law or regulation.</li>
                        <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
                        <li>To send, knowingly receive, upload, download, use, or re-use any material that does not comply with these Terms.</li>
                        <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.</li>
                        <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                        <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Services, or which, as determined by us, may harm the Company or users of the Services or expose them to liability.</li>
                    </ul>

                    <h2>10. Limitation Of Liability</h2>
                    <p>
                        In no event shall UniQVerse, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Services; (ii) any conduct or content of any third party on the Services; (iii) any content obtained from the Services; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.
                    </p>

                    <h2>11. Disclaimer</h2>
                    <p>
                        Your use of the Services is at your sole risk. The Services are provided on an "AS IS" and "AS AVAILABLE" basis. The Services are provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
                    </p>
                    <p>
                        UniQVerse, its subsidiaries, affiliates, and its licensors do not warrant that a) the Services will function uninterrupted, secure or available at any particular time or location; b) any errors or defects will be corrected; c) the Services are free of viruses or other harmful components; or d) the results of using the Services will meet your requirements.
                    </p>

                    <h2>12. Governing Law</h2>
                    <p>
                        These Terms shall be governed and construed in accordance with the laws of New York, United States, without regard to its conflict of law provisions.
                    </p>
                    <p>
                        Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Services, and supersede and replace any prior agreements we might have between us regarding the Services.
                    </p>

                    <h2>13. Changes to Terms</h2>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                    </p>
                    <p>
                        By continuing to access or use our Services after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Services.
                    </p>

                    <h2>14. Contact Us</h2>
                    <p>
                        If you have any questions about these Terms, please contact us:
                    </p>
                    <ul>
                        <li>By email: <a href="mailto:legal@UniQVerse.com" className="text-blue-600 hover:underline">legal@UniQVerse.com</a></li>
                        <li>By phone: 1-800-555-1234</li>
                        <li>By mail: UniQVerse Inc., 123 Commerce Street, Suite 500, New York, NY 10001</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}