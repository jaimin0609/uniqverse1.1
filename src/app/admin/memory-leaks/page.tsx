import { MemoryLeakDashboard } from '@/components/admin/memory-leak-dashboard';

export default function MemoryLeaksPage() {
    return (
        <div className="container mx-auto py-6">
            <MemoryLeakDashboard />
        </div>
    );
}
