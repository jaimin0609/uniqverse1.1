'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewsletterCampaignPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [formData, setFormData] = useState({
        subject: '',
        content: '',
        senderName: 'Uniqverse',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.content.trim()) {
            setResult({
                success: false,
                message: 'Please fill in both subject and content fields.',
            });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/admin/newsletter/send-campaign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            setResult(data);

            if (data.success) {
                // Clear form on success
                setFormData({
                    subject: '',
                    content: '',
                    senderName: 'Uniqverse',
                });
            }
        } catch (error) {
            console.error('Campaign send error:', error);
            setResult({
                success: false,
                message: 'Failed to send campaign. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const insertTemplate = (template: 'welcome' | 'promotion' | 'update') => {
        const templates = {
            welcome: {
                subject: 'Welcome to Uniqverse Community!',
                content: `
          <h2>🎉 Welcome to Uniqverse!</h2>
          <p>Thank you for joining our community of savvy shoppers. We're excited to have you on board!</p>
          
          <h3>What to Expect:</h3>
          <ul>
            <li>🆕 <strong>Latest Product Launches</strong> - Be the first to discover new arrivals</li>
            <li>💰 <strong>Exclusive Member Deals</strong> - Special discounts just for subscribers</li>
            <li>📚 <strong>Shopping Tips & Guides</strong> - Make the most of your purchases</li>
            <li>🎯 <strong>Personalized Recommendations</strong> - Curated just for you</li>
          </ul>
          
          <p>Ready to start shopping?</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">Explore Our Products</a>
          
          <p>Happy shopping!<br>The Uniqverse Team</p>
        `,
            },
            promotion: {
                subject: '🔥 Limited Time Offer - Save 25% Today!',
                content: `
          <h2>🔥 Flash Sale Alert!</h2>
          <p>Don't miss out on this incredible limited-time offer!</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="color: #d97706; margin: 0;">Save 25% on Everything!</h3>
            <p style="margin: 10px 0; color: #92400e;">Use code: <strong>SAVE25</strong></p>
            <p style="margin: 0; color: #92400e; font-size: 14px;">Valid until midnight tonight</p>
          </div>
          
          <p>Whether you've been eyeing that perfect item or ready to try something new, now's the perfect time to treat yourself!</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">Shop Now & Save 25%</a>
          
          <p><em>*Offer expires at 11:59 PM today. Cannot be combined with other offers.</em></p>
          
          <p>Happy shopping!<br>The Uniqverse Team</p>
        `,
            },
            update: {
                subject: 'New Arrivals & Updates from Uniqverse',
                content: `
          <h2>📦 What's New at Uniqverse</h2>
          <p>Hi there! We've got some exciting updates to share with you.</p>
          
          <h3>🆕 New Product Categories</h3>
          <p>We've expanded our collection with fresh categories and trending items. Check out what's new and find your next favorite purchase.</p>
          
          <h3>📱 Improved Shopping Experience</h3>
          <p>We've made shopping even easier with:</p>
          <ul>
            <li>Faster checkout process</li>
            <li>Better product recommendations</li>
            <li>Enhanced mobile experience</li>
          </ul>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">Explore What's New</a>
          
          <p>Thank you for being part of the Uniqverse community!</p>
          
          <p>Best regards,<br>The Uniqverse Team</p>
        `,
            },
        };

        const selectedTemplate = templates[template];
        setFormData(prev => ({
            ...prev,
            subject: selectedTemplate.subject,
            content: selectedTemplate.content,
        }));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Send Newsletter Campaign</h1>
                    <p className="text-gray-600 mt-1">Create and send newsletters to all active subscribers</p>
                </div>
                <Link href="/admin/newsletter">
                    <Button variant="outline">← Back to Newsletter Management</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sender Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.senderName}
                                    onChange={(e) => handleInputChange('senderName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Uniqverse"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => handleInputChange('subject', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter email subject"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Content (HTML) *
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => handleInputChange('content', e.target.value)}
                                    rows={15}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    placeholder="Enter email content (HTML supported)"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || !formData.subject.trim() || !formData.content.trim()}
                                className="w-full"
                            >
                                {isLoading ? 'Sending Campaign...' : 'Send Newsletter Campaign'}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Templates and Results */}
                <div className="space-y-6">
                    {/* Quick Templates */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold mb-4">Quick Templates</h3>
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertTemplate('welcome')}
                                className="w-full text-left justify-start"
                            >
                                Welcome Email
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertTemplate('promotion')}
                                className="w-full text-left justify-start"
                            >
                                Promotional Email
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => insertTemplate('update')}
                                className="w-full text-left justify-start"
                            >
                                Update Email
                            </Button>
                        </div>
                    </div>

                    {/* Result Display */}
                    {result && (
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold mb-4">Campaign Result</h3>
                            <div className={`p-4 rounded-md ${result.success
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                }`}>
                                <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    {result.message}
                                </p>
                                {result.success && result.sentCount !== undefined && (
                                    <div className="mt-2 text-sm text-green-700">
                                        <p>Sent: {result.sentCount} emails</p>
                                        {result.errorCount > 0 && (
                                            <p>Errors: {result.errorCount} emails</p>
                                        )}
                                        <p>Total Subscribers: {result.totalSubscribers}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Tips</h3>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li>• Use engaging subject lines to improve open rates</li>
                            <li>• Keep content concise and scannable</li>
                            <li>• Include clear call-to-action buttons</li>
                            <li>• Test your HTML content before sending</li>
                            <li>• Emails are sent in batches to avoid spam filters</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
