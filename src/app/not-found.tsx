
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="mt-4 text-lg">The page you are looking for doesn't exist or has been moved.</p>
      
      <div className="mt-8 space-y-4">
        <p>Debug Information:</p>
        <ul className="list-disc text-left inline-block">
          <li>Timestamp: {new Date().toISOString()}</li>
          <li>Environment: {process.env.NODE_ENV}</li>
          <li>NEXTAUTH_URL is: {process.env.NEXTAUTH_URL || 'not set'}</li>
        </ul>
      </div>
      
      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Home
        </Link>
      </div>
      
      <script src="/route-debug.js" async></script>
    </div>
  );
}
