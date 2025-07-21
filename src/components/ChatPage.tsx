import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  where,
  doc,
  getDoc,
  updateDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  chatId: string;
}

interface ChatUser {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface ChatRoom {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage?: string;
  lastMessageTime?: any;
  otherUser: ChatUser;
}

interface ChatPageProps {
  selectedChatId?: string;
  selectedUserId?: string;
  onChatStart?: (chatId: string) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ selectedChatId, selectedUserId, onChatStart }) => {
  const { currentUser } = useAuth();
  const { userId: urlUserId } = useParams<{ userId: string }>();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(selectedChatId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat rooms
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Query for chats where current user is a participant
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      console.log('Chat rooms snapshot received, docs count:', snapshot.docs.length);
      const rooms: ChatRoom[] = [];
      
      for (const chatDoc of snapshot.docs) {
        const chatData = chatDoc.data();
        console.log('Processing chat:', chatDoc.id, chatData);
        const otherUserId = chatData.participants.find((id: string) => id !== currentUser.uid);
        
        // Skip if no other user found or if it's a self-chat (additional security)
        if (!otherUserId || otherUserId === currentUser.uid) {
          console.log('Skipping chat due to self-chat or no other user');
          continue;
        }
        
        // Get other user's info
        try {
          const userDocRef = doc(db, 'users', otherUserId);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data() as any;
          
          rooms.push({
            id: chatDoc.id,
            participants: chatData.participants,
            participantNames: chatData.participantNames || [],
            lastMessage: chatData.lastMessage,
            lastMessageTime: chatData.lastMessageTime,
            otherUser: {
              id: otherUserId,
              name: userData?.displayName || userData?.email?.split('@')[0] || 'Unknown User',
              email: userData?.email || '',
              profilePicture: userData?.profilePicture
            }
          });
        } catch (error) {
          console.warn('Failed to fetch user data for chat:', otherUserId, error);
        }
      }
      
      // Sort by last message time
      rooms.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.toDate() - a.lastMessageTime.toDate();
      });
      
      console.log('Setting chat rooms:', rooms);
      setChatRooms(rooms);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Start new chat with selected user from URL or prop
  useEffect(() => {
    const targetUserId = urlUserId || selectedUserId;
    if (targetUserId && currentUser?.uid && targetUserId !== currentUser.uid) {
      startChatWithUser(targetUserId);
    }
  }, [urlUserId, selectedUserId, currentUser]);

  // Load messages for selected chat
  useEffect(() => {
    console.log('useEffect triggered with selectedChat:', selectedChat);
    
    if (!selectedChat) {
      console.log('No selectedChat, clearing messages');
      setMessages([]);
      return;
    }

    console.log('Setting up message listener for chat:', selectedChat);

    // Simple query without orderBy to avoid index requirement
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', selectedChat)
    );

    const unsubscribe = onSnapshot(
      messagesQuery, 
      (snapshot) => {
        console.log('Messages snapshot received, docs count:', snapshot.docs.length);
        const messagesList: Message[] = [];
        
        snapshot.docs.forEach((doc) => {
          const messageData = doc.data();
          console.log('Message data:', messageData);
          messagesList.push({ 
            id: doc.id, 
            ...messageData 
          } as Message);
        });

        // Sort by timestamp manually after fetching
        messagesList.sort((a, b) => {
          if (!a.timestamp || !b.timestamp) return 0;
          // Handle serverTimestamp which might be null initially
          const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
          const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
          return aTime.getTime() - bTime.getTime();
        });

        console.log('Setting messages:', messagesList);
        setMessages(messagesList);
      },
      (error) => {
        console.error('Error listening to messages:', error);
      }
    );

    return unsubscribe;
  }, [selectedChat]);

  const startChatWithUser = async (userId: string) => {
    if (!currentUser?.uid || userId === currentUser.uid || creatingChat) return;
    
    setCreatingChat(true);
    
    try {
      // Use a transaction to ensure atomicity and prevent race conditions
      const chatId = await runTransaction(db, async (transaction) => {
        // Create a deterministic chat ID based on sorted user IDs
        const participants = [currentUser.uid, userId].sort();
        const deterministicChatId = `${participants[0]}_${participants[1]}`;
        const chatDocRef = doc(db, 'chats', deterministicChatId);
        
        // Check if chat already exists
        const chatDoc = await transaction.get(chatDocRef);
        
        if (chatDoc.exists()) {
          // Chat already exists, return its ID
          return deterministicChatId;
        }
        
        // Get user info for participant names
        const [userDocRef, currentUserDocRef] = [
          doc(db, 'users', userId),
          doc(db, 'users', currentUser.uid)
        ];
        
        const [userDoc, currentUserDoc] = await Promise.all([
          transaction.get(userDocRef),
          transaction.get(currentUserDocRef)
        ]);
        
        const userData = userDoc.data();
        const currentUserData = currentUserDoc.data();
        
        // Create new chat with deterministic ID
        const chatData = {
          participants: participants,
          participantNames: [
            currentUserData?.displayName || currentUser.email?.split('@')[0] || 'Unknown',
            userData?.displayName || userData?.email?.split('@')[0] || 'Unknown'
          ].sort(), // Sort names to match participant order
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastMessageTime: serverTimestamp()
        };
        
        transaction.set(chatDocRef, chatData);
        return deterministicChatId;
      });
      
      // Navigate to the chat
      setSelectedChat(chatId);
      onChatStart?.(chatId);
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setCreatingChat(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser?.uid || sending) return;

    console.log('Sending message:', {
      text: newMessage.trim(),
      senderId: currentUser.uid,
      chatId: selectedChat
    });

    try {
      setSending(true);
      
      // Add message to messages collection
      const messageRef = await addDoc(collection(db, 'messages'), {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown',
        chatId: selectedChat,
        timestamp: serverTimestamp()
      });

      console.log('Message sent successfully with ID:', messageRef.id);

      // Update chat room with last message
      const chatRef = doc(db, 'chats', selectedChat);
      await updateDoc(chatRef, {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp()
      });

      console.log('Chat room updated with last message');

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 transform hover:rotate-12 transition-transform duration-500">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
          <p className="text-gray-400">Connect and chat with other gamers</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex h-[600px]">
            {/* Chat List Sidebar */}
            <div className="w-1/3 border-r border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Conversations</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {chatRooms.length === 0 ? (
                  <div className="p-6 text-center">
                    <svg className="h-12 w-12 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-400 text-sm">No conversations yet</p>
                    <p className="text-gray-500 text-xs mt-1">Connect with other gamers to start chatting!</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {chatRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedChat(room.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors duration-200 ${
                          selectedChat === room.id
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {room.otherUser.profilePicture ? (
                            <img
                              src={room.otherUser.profilePicture}
                              alt={room.otherUser.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {room.otherUser.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{room.otherUser.name}</p>
                            {room.lastMessage && (
                              <p className="text-sm opacity-75 truncate">{room.lastMessage}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      {(() => {
                        const currentRoom = chatRooms.find(room => room.id === selectedChat);
                        if (!currentRoom) return null;
                        
                        return (
                          <>
                            {currentRoom.otherUser.profilePicture ? (
                              <img
                                src={currentRoom.otherUser.profilePicture}
                                alt={currentRoom.otherUser.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {currentRoom.otherUser.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-white">{currentRoom.otherUser.name}</h3>
                              <p className="text-sm text-gray-400">{currentRoom.otherUser.email}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-900/50">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No messages yet</p>
                        <p className="text-gray-500 text-sm">Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isCurrentUser = message.senderId === currentUser?.uid;
                        const prevMessage = messages[index - 1];
                        const showTimestamp = !prevMessage || 
                          (message.timestamp && prevMessage.timestamp && 
                           Math.abs(message.timestamp.toDate() - prevMessage.timestamp.toDate()) > 300000); // 5 minutes
                        
                        return (
                          <div key={message.id}>
                            {showTimestamp && (
                              <div className="text-center py-2">
                                <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                                  {message.timestamp && new Date(message.timestamp.toDate()).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            <div
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl relative ${
                                  isCurrentUser
                                    ? 'bg-indigo-600 text-white rounded-tr-md'
                                    : 'bg-gray-700 text-gray-100 rounded-tl-md'
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{message.text}</p>
                                <div className={`flex items-center justify-end mt-1 space-x-1`}>
                                  <span
                                    className={`text-xs ${
                                      isCurrentUser ? 'text-indigo-200' : 'text-gray-400'
                                    }`}
                                  >
                                    {formatTime(message.timestamp)}
                                  </span>
                                  {isCurrentUser && (
                                    <svg className="w-4 h-4 text-indigo-200" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                    <div className="flex items-end space-x-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className="w-full bg-gray-700 border border-gray-600 text-white px-4 py-3 pr-12 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-colors duration-300 resize-none"
                          disabled={sending}
                          maxLength={1000}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-xs text-gray-500">
                            {newMessage.length}/1000
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                        title={sending ? 'Sending...' : 'Send message'}
                      >
                        {sending ? (
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-400 text-lg mb-2">Select a conversation</p>
                    <p className="text-gray-500">Choose a conversation from the sidebar to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
