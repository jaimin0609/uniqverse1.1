// Add this button to any page to generate reports manually
"use client";

import { useMemoryLeakDetection } from '@/lib/memory-leak-detector';
import { Button } from '@/components/ui/button';

export function MemoryReportButton() {
    const { generateReport } = useMemoryLeakDetection('ReportButton');

    const handleGenerateReport = () => {
        const report = generateReport();
        console.log('🔍 Manual Memory Leak Report:', report);

        // Also show in alert for immediate visibility
        alert(`Memory Report Generated! 
Total Leaks: ${report.totalLeaks}
Risk Level: ${report.riskLevel}
Check console for full details.`);
    };

    return (
        <Button
            onClick={handleGenerateReport}
            variant="outline"
            className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
        >
            🔍 Generate Memory Report
        </Button>
    );
}
