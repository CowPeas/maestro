import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { threats } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import SystemAnalyzer from '@/components/system-analyzer';
import ThreatsListEnhanced from '@/components/threats-list-enhanced';
import Header from '@/components/header';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id);

  // Fetch user's threats
  const userThreats = await db.query.threats.findMany({
    where: eq(threats.userId, userId),
    orderBy: [desc(threats.createdAt)],
    with: {
      mitigations: true,
    },
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {session.user.name}!
          </h1>
          <p className="text-gray-600">
            Analyze systems and manage security threats using the MAESTRO framework.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - System Analyzer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                System Analysis
              </h2>
              <SystemAnalyzer />
            </div>

            {/* Threats List */}
            {userThreats.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Threat Management
                </h2>
                <ThreatsListEnhanced threats={userThreats} />
              </div>
            )}
          </div>

          {/* Right column - Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Overview
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-600 font-medium">
                    High Risk
                  </div>
                  <div className="text-2xl font-bold text-red-700">
                    {userThreats.filter(t => t.classification === 'High').length}
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-600 font-medium">
                    Medium Risk
                  </div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {userThreats.filter(t => t.classification === 'Medium').length}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">
                    Low Risk
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {userThreats.filter(t => t.classification === 'Low').length}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">
                    Total Threats
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {userThreats.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
