import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChatInterface } from '@/components/chat-interface';

export default async function ChatPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            💬 PawaEye AI Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Unified interface for all threat intelligence capabilities
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
