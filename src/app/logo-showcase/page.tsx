import { Logo } from '@/components/ui/logo';

export default function LogoShowcase() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                    UselfUnik Logo Showcase
                </h1>

                {/* Logo Variants */}
                <div className="grid gap-12">

                    {/* Default Theme */}
                    <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
                            Default Theme
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-600 dark:text-gray-400">Small Full</h3>
                                <Logo variant="full" size="sm" href="#" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-600 dark:text-gray-400">Medium Full</h3>
                                <Logo variant="full" size="md" href="#" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-600 dark:text-gray-400">Large Full</h3>
                                <Logo variant="full" size="lg" href="#" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-600 dark:text-gray-400">XL Full</h3>
                                <Logo variant="full" size="xl" href="#" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-600 dark:text-gray-400">Icon Only</h3>
                                <Logo variant="icon" size="lg" href="#" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-600 dark:text-gray-400">Text Only</h3>
                                <Logo variant="text" size="lg" href="#" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-600 dark:text-gray-400">With Tagline</h3>
                                <Logo variant="full" size="lg" href="#" showTagline />
                            </div>
                        </div>
                    </section>

                    {/* Dark Theme */}
                    <section className="bg-gray-900 rounded-lg p-8 shadow-lg">
                        <h2 className="text-2xl font-semibold mb-6 text-white">
                            Mono White Theme (for dark backgrounds)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-400">Full Logo</h3>
                                <Logo variant="full" size="lg" theme="mono-white" href="#" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-400">Icon Only</h3>
                                <Logo variant="icon" size="lg" theme="mono-white" href="#" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-400">With Tagline</h3>
                                <Logo variant="full" size="lg" theme="mono-white" href="#" showTagline />
                            </div>
                        </div>
                    </section>

                    {/* Light Theme */}
                    <section className="bg-gray-100 rounded-lg p-8 shadow-lg">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                            Mono Dark Theme (for light backgrounds)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-600">Full Logo</h3>
                                <Logo variant="full" size="lg" theme="mono-dark" href="#" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-600">Icon Only</h3>
                                <Logo variant="icon" size="lg" theme="mono-dark" href="#" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-sm font-medium mb-4 text-gray-600">With Tagline</h3>
                                <Logo variant="full" size="lg" theme="mono-dark" href="#" showTagline />
                            </div>
                        </div>
                    </section>

                    {/* Usage Examples */}
                    <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
                            Usage Examples
                        </h2>
                        <div className="space-y-6">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Header Navigation</h3>
                                <div className="bg-white dark:bg-gray-900 border rounded p-4">
                                    <Logo variant="full" size="md" href="#" />
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Footer</h3>
                                <div className="bg-gray-900 rounded p-4">
                                    <Logo variant="full" size="lg" theme="mono-white" href="#" showTagline />
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Mobile Menu</h3>
                                <div className="bg-white dark:bg-gray-900 border rounded p-4">
                                    <Logo variant="icon" size="md" href="#" />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}