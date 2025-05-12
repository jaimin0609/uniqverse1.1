import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, Award, Users, Heart } from "lucide-react";

export const metadata: Metadata = {
    title: "Careers | Uniqverse",
    description: "Join our team at Uniqverse and help bring unique products to customers worldwide. Explore current job openings and opportunities.",
};

// Current job openings data
const jobOpenings = [
    {
        id: "prod-manager-2025",
        title: "Product Manager",
        department: "Product",
        location: "New York, NY",
        type: "Full-time",
        description: "Lead product development initiatives for our e-commerce platform, working closely with design and engineering teams to deliver exceptional user experiences.",
        requirements: [
            "5+ years of product management experience",
            "Experience with e-commerce platforms",
            "Strong analytical and communication skills",
            "Bachelor's degree in related field"
        ]
    },
    {
        id: "sr-frontend-2025",
        title: "Senior Frontend Developer",
        department: "Engineering",
        location: "Remote (US)",
        type: "Full-time",
        description: "Build and maintain the user interfaces of our website and mobile applications using modern frontend technologies like React, Next.js, and TypeScript.",
        requirements: [
            "4+ years of frontend development experience",
            "Proficiency in React, Next.js, and TypeScript",
            "Experience with responsive design and accessibility",
            "Knowledge of state management solutions"
        ]
    },
    {
        id: "ux-designer-2025",
        title: "UX/UI Designer",
        department: "Design",
        location: "New York, NY",
        type: "Full-time",
        description: "Create intuitive and visually appealing user experiences for our digital platforms. Collaborate with product and engineering teams to implement designs.",
        requirements: [
            "3+ years of UX/UI design experience",
            "Proficiency in design tools (Figma, Adobe XD)",
            "Portfolio demonstrating e-commerce design",
            "Understanding of user research and testing"
        ]
    },
    {
        id: "marketing-specialist-2025",
        title: "Digital Marketing Specialist",
        department: "Marketing",
        location: "New York, NY",
        type: "Full-time",
        description: "Plan and execute digital marketing campaigns across various channels to drive user acquisition, engagement, and sales.",
        requirements: [
            "3+ years of digital marketing experience",
            "Experience with SEO, SEM, email marketing, and social media",
            "Data-driven approach with analytics experience",
            "E-commerce marketing background preferred"
        ]
    },
    {
        id: "customer-support-2025",
        title: "Customer Support Specialist",
        department: "Customer Experience",
        location: "Remote (US)",
        type: "Full-time",
        description: "Provide exceptional customer service through email, chat, and phone. Resolve customer inquiries and issues while maintaining our high standards of service.",
        requirements: [
            "2+ years of customer service experience",
            "Excellent written and verbal communication skills",
            "Problem-solving abilities",
            "Experience with CRM systems"
        ]
    },
    {
        id: "operations-intern-2025",
        title: "Operations Intern",
        department: "Operations",
        location: "New York, NY",
        type: "Internship (Summer 2025)",
        description: "Support our operations team with inventory management, order fulfillment, and logistics coordination. Learn about e-commerce operations in a fast-paced environment.",
        requirements: [
            "Currently enrolled in a Bachelor's program",
            "Interest in e-commerce and operations",
            "Strong organizational skills",
            "Available for summer 2025 (May-August)"
        ]
    }
];

// Benefits data
const benefits = [
    {
        icon: <Heart className="h-6 w-6 text-blue-600" />,
        title: "Health & Wellness",
        description: "Comprehensive medical, dental, and vision insurance, plus wellness programs and gym reimbursements."
    },
    {
        icon: <Award className="h-6 w-6 text-blue-600" />,
        title: "Professional Growth",
        description: "Learning stipend, conference budgets, and clear career progression paths."
    },
    {
        icon: <Clock className="h-6 w-6 text-blue-600" />,
        title: "Work-Life Balance",
        description: "Flexible work hours, generous PTO, paid parental leave, and remote work options."
    },
    {
        icon: <Users className="h-6 w-6 text-blue-600" />,
        title: "Team Building",
        description: "Regular team events, retreats, and social activities to foster collaboration."
    }
];

export default function CareersPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
                {/* Hero Section */}
                <section className="bg-gradient-to-r from-purple-100 to-blue-100 py-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-block p-3 bg-white rounded-full mb-6">
                            <Briefcase className="h-8 w-8 text-blue-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
                        <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
                            Help us bring unique products to customers worldwide and grow your career with a passionate team.
                        </p>
                        <Button size="lg" asChild>
                            <a href="#openings">View Open Positions</a>
                        </Button>
                    </div>
                </section>

                {/* Why Work With Us */}
                <section className="py-16 bg-white">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Why Work With Us?</h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                At Uniqverse, we're building a team as unique as our products. Join us and be part of creating exceptional shopping experiences.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">Collaborative Culture</h3>
                                        <p className="text-gray-600">
                                            Work alongside talented professionals in a supportive environment that values your input and encourages innovation.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                                        <Award className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">Growth Opportunities</h3>
                                        <p className="text-gray-600">
                                            Develop your skills and advance your career through mentorship, professional development resources, and challenging projects.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                                        <Heart className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">Impactful Work</h3>
                                        <p className="text-gray-600">
                                            Make a real difference in how people discover and purchase products they love, bringing joy to thousands of customers.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative h-80 md:h-96 rounded-xl overflow-hidden">
                                <Image
                                    src="/careers-team.jpg"
                                    alt="Team working together at Uniqverse"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits */}
                <section className="py-16 bg-gray-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Our Benefits</h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                We offer competitive compensation and a comprehensive benefits package designed to support your well-being and professional growth.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="bg-blue-100 p-3 inline-flex rounded-full mb-4">
                                        {benefit.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                                    <p className="text-gray-600">{benefit.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Open Positions */}
                <section id="openings" className="py-16 bg-white">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Open Positions</h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                Browse our current openings and find your next career opportunity with Uniqverse.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {jobOpenings.map((job) => (
                                <div key={job.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <h3 className="text-xl font-semibold text-blue-700">{job.title}</h3>
                                    <div className="flex flex-wrap gap-3 my-3">
                                        <span className="inline-flex items-center bg-blue-100 px-2.5 py-0.5 rounded-full text-sm font-medium text-blue-800">
                                            {job.department}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4" />
                                            {job.location}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            {job.type}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-4">{job.description}</p>
                                    <div className="mb-4">
                                        <h4 className="font-medium text-gray-800 mb-2">Requirements:</h4>
                                        <ul className="list-disc pl-5 text-gray-600 space-y-1">
                                            {job.requirements.map((req, index) => (
                                                <li key={index}>{req}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="mt-auto">
                                        <Button className="w-full" asChild>
                                            <Link href={`/careers/${job.id}`}>Apply Now</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Application Process */}
                <section className="py-16 bg-gray-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Our Application Process</h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                We've designed a straightforward process to help you find your place at Uniqverse.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative">
                                    <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                                        1
                                    </div>
                                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-blue-600"></div>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Application</h3>
                                <p className="text-gray-600">
                                    Submit your application with your resume and a brief introduction about yourself.
                                </p>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="relative">
                                    <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                                        2
                                    </div>
                                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-blue-600"></div>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Initial Interview</h3>
                                <p className="text-gray-600">
                                    A conversation with our recruiting team to discuss your experience and goals.
                                </p>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="relative">
                                    <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                                        3
                                    </div>
                                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-blue-600"></div>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Skills Assessment</h3>
                                <p className="text-gray-600">
                                    Depending on the role, you may complete a skills assessment or case study.
                                </p>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div>
                                    <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                                        4
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Final Interview</h3>
                                <p className="text-gray-600">
                                    Meet with the team you'll be working with and discuss next steps.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Diversity & Inclusion */}
                <section className="py-16 bg-blue-600 text-white">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-bold mb-6">Diversity & Inclusion</h2>
                                <div className="space-y-4">
                                    <p>
                                        At Uniqverse, we believe that our strength comes from our diversity. We're committed to creating an inclusive workplace where all employees feel welcomed, valued, and heard.
                                    </p>
                                    <p>
                                        We actively seek to build a team with diverse backgrounds, experiences, and perspectives. This diversity not only reflects our global customer base but also drives innovation and creativity in everything we do.
                                    </p>
                                    <p>
                                        We're proud to be an equal opportunity employer. All qualified applicants will receive consideration for employment without regard to race, color, religion, gender, gender identity or expression, sexual orientation, national origin, genetics, disability, age, or veteran status.
                                    </p>
                                </div>
                            </div>
                            <div className="relative h-80 rounded-xl overflow-hidden">
                                <Image
                                    src="/careers-diversity.jpg"
                                    alt="Diverse team at Uniqverse"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-16 bg-white">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                Have questions about working at Uniqverse? Find answers to common questions below.
                            </p>
                        </div>

                        <div className="max-w-3xl mx-auto">
                            <div className="space-y-4">
                                <details className="group border border-gray-200 rounded-lg">
                                    <summary className="flex justify-between items-center p-4 cursor-pointer">
                                        <h3 className="text-lg font-medium text-gray-900">What's the interview process like?</h3>
                                        <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </summary>
                                    <div className="p-4 pt-0 border-t border-gray-200">
                                        <p className="text-gray-600">
                                            Our interview process typically consists of an initial phone screen, followed by one or more interviews with the hiring team, and potentially a skills assessment depending on the role. We aim to make the process as transparent and efficient as possible, and you'll have opportunities to ask questions at each stage.
                                        </p>
                                    </div>
                                </details>

                                <details className="group border border-gray-200 rounded-lg">
                                    <summary className="flex justify-between items-center p-4 cursor-pointer">
                                        <h3 className="text-lg font-medium text-gray-900">Do you offer remote work options?</h3>
                                        <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </summary>
                                    <div className="p-4 pt-0 border-t border-gray-200">
                                        <p className="text-gray-600">
                                            Yes, we offer remote work options for many positions, as well as hybrid arrangements. Some roles may require on-site presence in our New York office, but we're flexible and focus on results rather than location. Each job posting will specify the location requirements.
                                        </p>
                                    </div>
                                </details>

                                <details className="group border border-gray-200 rounded-lg">
                                    <summary className="flex justify-between items-center p-4 cursor-pointer">
                                        <h3 className="text-lg font-medium text-gray-900">What's the company culture like?</h3>
                                        <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </summary>
                                    <div className="p-4 pt-0 border-t border-gray-200">
                                        <p className="text-gray-600">
                                            Our culture is collaborative, innovative, and customer-focused. We value open communication, diversity of thought, and a healthy work-life balance. We celebrate achievements together and support each other through challenges. We're fast-paced but thoughtful, and we encourage continuous learning and professional growth.
                                        </p>
                                    </div>
                                </details>

                                <details className="group border border-gray-200 rounded-lg">
                                    <summary className="flex justify-between items-center p-4 cursor-pointer">
                                        <h3 className="text-lg font-medium text-gray-900">Do you offer internships or entry-level positions?</h3>
                                        <span className="text-blue-600 group-open:rotate-180 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </summary>
                                    <div className="p-4 pt-0 border-t border-gray-200">
                                        <p className="text-gray-600">
                                            Yes, we offer both internships and entry-level positions across various departments. Our internship program runs primarily during summer months, and we're committed to providing meaningful projects and mentorship to help interns develop practical skills. For entry-level roles, we look for candidates with the right attitude and aptitude, and we provide training and support to help them succeed.
                                        </p>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 bg-gray-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Join Our Team?</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                            We're looking for talented individuals to help us continue growing and innovating. Explore our open positions and take the next step in your career.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild>
                                <a href="#openings">View Open Positions</a>
                            </Button>
                            <Button variant="outline" size="lg" asChild>
                                <Link href="/contact">Contact Us</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}