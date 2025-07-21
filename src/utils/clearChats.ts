// Clear Chat Data Script
// Run this in the browser console while authenticated

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const clearAllChats = async () => {
  try {
    console.log('Starting to clear chat data...');
    
    // Clear messages collection
    const messagesSnapshot = await getDocs(collection(db, 'messages'));
    const messageDeletePromises = messagesSnapshot.docs.map(document => 
      deleteDoc(doc(db, 'messages', document.id))
    );
    await Promise.all(messageDeletePromises);
    console.log(`Deleted ${messagesSnapshot.docs.length} messages`);
    
    // Clear chats collection  
    const chatsSnapshot = await getDocs(collection(db, 'chats'));
    const chatDeletePromises = chatsSnapshot.docs.map(document => 
      deleteDoc(doc(db, 'chats', document.id))
    );
    await Promise.all(chatDeletePromises);
    console.log(`Deleted ${chatsSnapshot.docs.length} chat rooms`);
    
    console.log('All chat data cleared successfully!');
    return { success: true, messagesDeleted: messagesSnapshot.docs.length, chatsDeleted: chatsSnapshot.docs.length };
  } catch (error) {
    console.error('Error clearing chat data:', error);
    return { success: false, error };
  }
};

// Usage: Call this function in browser console after importing
// clearAllChats();
