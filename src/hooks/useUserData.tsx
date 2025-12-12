import { useEffect } from 'react';
import { useFileStore } from '@/stores/fileStore';
import { useAuth } from '@/hooks/useAuth';
import { loadUserFiles, loadChatMessages } from '@/lib/dataService';

export function useUserData() {
  const { user, loading: authLoading } = useAuth();
  const { isLoaded, loadFromDatabase, clearStore } = useFileStore();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      clearStore();
      return;
    }

    if (isLoaded) return;

    const loadData = async () => {
      try {
        const [filesData, chatMessagesData] = await Promise.all([
          loadUserFiles(user.id),
          loadChatMessages(user.id),
        ]);

        loadFromDatabase({
          ...filesData,
          chatMessages: chatMessagesData,
        });
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadData();
  }, [user, authLoading, isLoaded, loadFromDatabase, clearStore]);

  return { isLoaded, isLoading: authLoading || (!isLoaded && !!user) };
}
