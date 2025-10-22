import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/header';
import DetectionMonitor from '@/components/detection-monitor';

export default async function DetectionPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚨 Real-Time Threat Detection
          </h1>
          <p className="text-gray-600">
            AI-powered monitoring and instant threat alerts
          </p>
        </div>

        <DetectionMonitor userId={parseInt(session.user.id)} />
      </main>
    </div>
  );
}
