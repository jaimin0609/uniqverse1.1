"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Save, AlertCircle, CheckCircle2, Database, Mail, Shield, Globe } from "lucide-react";
import { toast } from "sonner";

interface SystemSettings {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
    emailNotifications: boolean;
    autoBackup: boolean;
    cacheEnabled: boolean;
}

export default function AdminSettingsPage() {
    const { data: session } = useSession();
    const [settings, setSettings] = useState<SystemSettings>({
        siteName: "UniQverse",
        siteDescription: "Your Ultimate E-commerce Destination",
        supportEmail: "support@uniqverse.com",
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true,
        autoBackup: true,
        cacheEnabled: true,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/settings');
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                toast.success('Settings saved successfully');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: keyof SystemSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (session?.user?.role !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        You don't have permission to access this page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Settings className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">System Settings</h1>
                </div>
                <Button onClick={saveSettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general" className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>General</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Security</span>
                    </TabsTrigger>
                    <TabsTrigger value="system" className="flex items-center space-x-2">
                        <Database className="h-4 w-4" />
                        <span>System</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>
                                Configure basic site information and appearance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="siteName">Site Name</Label>
                                <Input
                                    id="siteName"
                                    value={settings.siteName}
                                    onChange={(e) => handleInputChange('siteName', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="siteDescription">Site Description</Label>
                                <Textarea
                                    id="siteDescription"
                                    value={settings.siteDescription}
                                    onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="maintenanceMode"
                                    checked={settings.maintenanceMode}
                                    onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                                />
                                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Configuration</CardTitle>
                            <CardDescription>
                                Configure email settings and notifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="supportEmail">Support Email</Label>
                                <Input
                                    id="supportEmail"
                                    type="email"
                                    value={settings.supportEmail}
                                    onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="emailNotifications"
                                    checked={settings.emailNotifications}
                                    onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                                />
                                <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>
                                Configure user registration and security options.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="allowRegistration"
                                    checked={settings.allowRegistration}
                                    onCheckedChange={(checked) => handleInputChange('allowRegistration', checked)}
                                />
                                <Label htmlFor="allowRegistration">Allow User Registration</Label>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="system" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Settings</CardTitle>
                            <CardDescription>
                                Configure system-level options and performance settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="autoBackup"
                                    checked={settings.autoBackup}
                                    onCheckedChange={(checked) => handleInputChange('autoBackup', checked)}
                                />
                                <Label htmlFor="autoBackup">Enable Automatic Backups</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="cacheEnabled"
                                    checked={settings.cacheEnabled}
                                    onCheckedChange={(checked) => handleInputChange('cacheEnabled', checked)}
                                />
                                <Label htmlFor="cacheEnabled">Enable Caching</Label>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
