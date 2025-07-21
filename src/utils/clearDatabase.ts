import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase';

export const clearAllData = async () => {
  try {
    console.log('Starting database cleanup...');
    
    // Clear posts collection
    console.log('Clearing posts...');
    const postsSnapshot = await getDocs(collection(db, 'posts'));
    const postsCount = postsSnapshot.docs.length;
    
    for (const postDoc of postsSnapshot.docs) {
      await deleteDoc(doc(db, 'posts', postDoc.id));
    }
    console.log(`✅ Deleted ${postsCount} posts`);
    
    // Clear messages collection
    console.log('Clearing messages...');
    const messagesSnapshot = await getDocs(collection(db, 'messages'));
    const messagesCount = messagesSnapshot.docs.length;
    
    for (const messageDoc of messagesSnapshot.docs) {
      await deleteDoc(doc(db, 'messages', messageDoc.id));
    }
    console.log(`✅ Deleted ${messagesCount} messages`);
    
    // Clear chats collection
    console.log('Clearing chats...');
    const chatsSnapshot = await getDocs(collection(db, 'chats'));
    const chatsCount = chatsSnapshot.docs.length;
    
    for (const chatDoc of chatsSnapshot.docs) {
      await deleteDoc(doc(db, 'chats', chatDoc.id));
    }
    console.log(`✅ Deleted ${chatsCount} chats`);
    
    console.log('🎉 Database cleanup completed successfully!');
    console.log(`Total items deleted: ${postsCount + messagesCount + chatsCount}`);
    
    return {
      success: true,
      deletedCounts: {
        posts: postsCount,
        messages: messagesCount,
        chats: chatsCount,
        total: postsCount + messagesCount + chatsCount
      }
    };
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    return {
      success: false,
      error: error
    };
  }
};
