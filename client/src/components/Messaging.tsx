import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { messagesAPI, doctorsAPI, usersAPI } from '@/lib/api';
import { Label } from './ui/label';
import { useSocket } from '@/hooks/use-socket';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface User {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  specialty?: string; // Fix: allow specialty for doctors
  role?: string;
}

interface Message {
  _id: string;
  senderId: User;
  receiverId: User;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  _id: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

interface MessagingProps {
  role?: 'patient' | 'doctor';
}

interface DoctorDropdownUser extends User {
  specialty?: string;
  isAvailable?: boolean;
  consultationFee?: number;
  role?: string;
}

const Messaging = ({ role }: MessagingProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State for users list
  const [searchTerm, setSearchTerm] = useState('');
  const [userOptions, setUserOptions] = useState<DoctorDropdownUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchConversationsError, setFetchConversationsError] = useState<string | null>(null);
  
  // Track if users are being fetched to prevent multiple calls
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // Notification state for new messages
  const [messageNotifications, setMessageNotifications] = useState<Set<string>>(new Set());

  // Ref to always have the latest selectedUser in socket handler
  const selectedUserRef = useRef<User | null>(null);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Get current user ID from localStorage
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const currentUserId = currentUser?._id || currentUser?.id;

  // Conversation ID is a sorted combination of user IDs
  const getConversationId = (userId1: string, userId2: string) => [userId1, userId2].sort().join('-');

  // Define fetchConversations function with useCallback to ensure stable reference
  const fetchConversations = useCallback(async () => {
    console.log('=== FETCHING CONVERSATIONS ===');
    console.log('Current user ID:', currentUserId);
    
    setLoadingConversations(true);
    setFetchConversationsError(null);
    try {
      const res = await messagesAPI.getConversations();
      console.log('Raw conversations response:', res.data);
      
      if (res.data.conversations && res.data.conversations.length > 0) {
        console.log('Found conversations:', res.data.conversations);
        setConversations(res.data.conversations);
        setFetchConversationsError(null);
      } else {
        console.log('No conversations found in response');
        setConversations([]);
        setFetchConversationsError('No conversations found. Start a new conversation!');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      console.error('Error details:', err.response?.data || err.message);
      setConversations([]);
      setFetchConversationsError('Failed to fetch conversations. Please check your connection or try again.');
    } finally {
      setLoadingConversations(false);
    }
  }, [currentUserId]);

  // Function to fetch user details by ID
  const fetchUserDetails = useCallback(async (userId: string) => {
    try {
      const response = await usersAPI.getUserById(userId);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }, []);

  // Enhanced addUserToConversations function that can handle user objects or IDs
  const addUserToConversations = useCallback(async (userOrId: User | string, lastMessage?: Message) => {
    console.log('=== ADDING USER TO CONVERSATIONS ===');
    console.log('User or ID to add:', userOrId);
    console.log('Current conversations:', conversations);
    
    let user: User;
    
    // If we have a string (user ID), fetch the user details
    if (typeof userOrId === 'string') {
      user = await fetchUserDetails(userOrId);
      if (!user) {
        console.error('Could not fetch user details for ID:', userOrId);
        return;
      }
    } else {
      user = userOrId;
    }
    
    setConversations(prevConversations => {
      const conversationExists = prevConversations.find(conv => conv.user._id === user._id);
      if (!conversationExists) {
        // Calculate unread count - if this is a received message, increment unread count
        const isReceivedMessage = lastMessage && lastMessage.senderId._id !== currentUserId;
        const unreadCount = isReceivedMessage ? 1 : 0;
        
        const newConversation = {
          _id: `${currentUserId}-${user._id}`,
          user: user,
          lastMessage: lastMessage || {
            _id: `temp-${Date.now()}`,
            content: 'New conversation',
            createdAt: new Date().toISOString(),
            senderId: { _id: currentUserId, name: currentUser.name, email: currentUser.email },
            receiverId: { _id: user._id, name: user.name, email: user.email },
            isRead: false
          },
          unreadCount: unreadCount
        };
        console.log('Adding new conversation:', newConversation);
        return [newConversation, ...prevConversations];
      } else {
        // Update existing conversation with new message and unread count
        const updatedConversations = prevConversations.map(conv => {
          if (conv.user._id === user._id) {
            const isReceivedMessage = lastMessage && lastMessage.senderId._id !== currentUserId;
            const newUnreadCount = isReceivedMessage ? conv.unreadCount + 1 : conv.unreadCount;
            
            return {
              ...conv,
              lastMessage: lastMessage || conv.lastMessage,
              unreadCount: newUnreadCount
            };
          }
          return conv;
        });
        console.log('Updated existing conversation');
        return updatedConversations;
      }
    });
  }, [currentUserId, currentUser, conversations, fetchUserDetails]);

  // Define socket message handler with useCallback
  const handleMessageReceived = useCallback((data: any) => {
    console.log('Message received via socket:', data);
    
    // Extract the sender and receiver from the message
    const messageSender = data.message.senderId;
    const messageReceiver = data.message.receiverId;
    
    // Determine which user to add to conversations (the other person in the conversation)
    const otherUser = messageSender._id === currentUserId ? messageReceiver : messageSender;
    
    // Always set notification for received messages
    if (messageSender._id !== currentUserId) {
      setMessageNotifications(prev => new Set([...prev, messageSender._id]));
    }
    
    // Add the other user to conversations list immediately
    addUserToConversations(otherUser, data.message);
    
    // If the conversation is currently open, clear the notification and add the message
    if (
      selectedUserRef.current &&
      (messageSender._id === selectedUserRef.current._id || messageReceiver._id === selectedUserRef.current._id)
    ) {
      setMessages((prev) => [...prev, data.message]);
      setMessageNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedUserRef.current!._id);
        return newSet;
      });
    }
    
    // Refresh conversations to get the latest data with unread counts
    fetchConversations();
  }, [currentUserId, addUserToConversations, fetchConversations]);

  // Real-time socket.io integration - moved to top level
  const { joinConversation, leaveConversation } = useSocket({
    userId: currentUserId,
    onMessageReceived: handleMessageReceived
  });

  // Join/leave conversation room on selectedUser change
  useEffect(() => {
    if (selectedUser && currentUserId) {
      const conversationId = getConversationId(currentUserId, selectedUser._id);
      joinConversation(conversationId);
      return () => leaveConversation(conversationId);
    }
  }, [selectedUser, currentUserId, joinConversation, leaveConversation]);

  useEffect(() => {
    if (!currentUserId) {
      setFetchConversationsError('User not found or not logged in. Please log in again.');
      return;
    }
    console.log('Fetching conversations on mount...');
    fetchConversations();
  }, [currentUserId, fetchConversations]);

  // Refresh conversations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUserId) {
        console.log('Periodic conversation refresh...');
        fetchConversations();
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [currentUserId, fetchConversations]);

  // Reset state when role changes
  useEffect(() => {
    setUserOptions([]);
    setHasAttemptedFetch(false);
    setFetchError(null);
  }, [role]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch all doctors or patients for new conversation
  const fetchUserOptions = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingUsers) {
      console.log('Already fetching users, skipping...');
      return;
    }
    
    console.log('=== FETCHING USERS ===');
    console.log('Current role:', role);
    console.log('Current user ID:', currentUserId);
    
    setIsFetchingUsers(true);
    setLoadingUsers(true);
    setFetchError(null);
    setHasAttemptedFetch(true);
    
    try {
      // Simple approach: Get all users for messaging
      console.log('Fetching all users for messaging...');
      const usersRes = await usersAPI.getUsersForMessaging();
      console.log('Users API response:', usersRes.data);
      
      if (usersRes.data.users && usersRes.data.users.length > 0) {
        // Filter based on role
        let filteredUsers = usersRes.data.users;
        
        if (role === 'patient') {
          // Patients can see doctors
          filteredUsers = usersRes.data.users.filter((user: any) => user.role === 'doctor');
          console.log('Filtered doctors for patient:', filteredUsers);
        } else if (role === 'doctor') {
          // Doctors can see patients
          filteredUsers = usersRes.data.users.filter((user: any) => user.role === 'patient');
          console.log('Filtered patients for doctor:', filteredUsers);
        }
        
        if (filteredUsers.length === 0) {
          console.log('No users found after filtering');
          setFetchError(`No ${role === 'patient' ? 'doctors' : 'patients'} found in the system.`);
        } else {
          setUserOptions(filteredUsers);
          console.log('Final user options:', filteredUsers);
        }
      } else {
        console.log('No users found in API response');
        setUserOptions([]);
        setFetchError('No users found in the system. Please create some users first.');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      if (err.response?.status === 403) {
        setFetchError('Access denied. Please log out and log in again.');
      } else if (err.response?.status === 401) {
        setFetchError('Not authenticated. Please log out and log in again.');
      } else {
        setFetchError('Failed to fetch users. Please try again.');
      }
      setUserOptions([]);
    } finally {
      setLoadingUsers(false);
      setIsFetchingUsers(false);
    }
  }, [role, currentUserId, isFetchingUsers]);

  // Load users on component mount
  useEffect(() => {
    if (role && currentUserId && !hasAttemptedFetch) {
      fetchUserOptions();
    }
  }, [role, currentUserId, hasAttemptedFetch, fetchUserOptions]);

  // Filter user options by search term and exclude users who already have conversations
  const filteredUserOptions: DoctorDropdownUser[] = userOptions.filter(u => {
    // First check if user matches search term
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Then check if user already has a conversation
    const hasConversation = conversations.some(conv => conv.user._id === u._id);
    
    // Only show users who don't have conversations yet
    return !hasConversation;
  });
  console.log('Filtered user options:', filteredUserOptions);

  const fetchMessages = async (userId: string) => {
    console.log('=== FETCHING MESSAGES ===');
    console.log('Fetching messages for user:', userId);
    
    setLoadingMessages(true);
    try {
      const res = await messagesAPI.getConversation(userId);
      console.log('Messages response:', res.data);
      
      if (res.data.messages && res.data.messages.length > 0) {
        console.log('Found messages:', res.data.messages.length);
        setMessages(res.data.messages || []);
      } else {
        console.log('No messages found');
        setMessages([]);
      }
      
      // Mark as read
      await messagesAPI.markAsRead(userId);
      
      // Refresh conversations after fetching messages
      await fetchConversations();
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle user selection from users list
  const handleUserSelect = useCallback(async (user: User) => {
    setSelectedUser(user);
    setMessageNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(user._id);
      return newSet;
    });
    await addUserToConversations(user);
  }, [addUserToConversations]);

  // Handle conversation selection
  const handleConversationSelect = useCallback((user: User) => {
    setSelectedUser(user);
    setMessageNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(user._id);
      return newSet;
    });
  }, []);

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedUser) return;
    
    console.log('=== SENDING MESSAGE ===');
    console.log('To user:', selectedUser.name);
    console.log('Content:', messageInput);
    
    setSending(true);
    try {
      const response = await messagesAPI.sendMessage({ receiverId: selectedUser._id, content: messageInput });
      console.log('Message sent successfully:', response.data);
      
      setMessageInput('');
      
      // Add user to conversations list immediately if not already there
      await addUserToConversations(selectedUser, response.data.message);
      
      // Refresh messages and conversations immediately
      await fetchMessages(selectedUser._id);
      await fetchConversations();
      
    } catch (err) {
      console.error('Error sending message:', err);
      setFetchConversationsError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row border rounded-lg min-h-[400px] bg-white">
      {/* Left Sidebar with Users and Conversations */}
      <div className="w-full sm:w-1/3 border-r p-2 overflow-y-auto min-w-0 sm:min-w-[200px] sm:max-w-[300px] bg-white sm:bg-transparent">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-4">
            <TabsTrigger value="users" className="text-xs">
              New Chat
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-2">
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2 sm:gap-0">
                <h3 className="text-sm font-medium">Available Users</h3>
                {!loadingUsers && userOptions.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {filteredUserOptions.length} of {userOptions.length} available
                  </span>
                )}
              </div>
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            {loadingUsers ? (
              <div className="text-center text-muted-foreground py-4">Loading users...</div>
            ) : fetchError ? (
              <div className="text-center text-red-500 py-4">{fetchError}</div>
            ) : filteredUserOptions.length > 0 ? (
              <ul className="space-y-2">
                {filteredUserOptions.map(u => (
                  <li
                    key={u && u._id ? u._id : Math.random()}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors`}
                    onClick={() => handleUserSelect(u)}
                  >
                    <Avatar className="h-8 w-8 min-w-[2rem]">
                      <AvatarFallback>{u && u.name ? u.name.charAt(0) : '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                        {u && u.name}
                        {u.specialty && (
                          <span className="text-xs text-blue-600">({u.specialty})</span>
                        )}
                        {u.role === 'doctor' && (
                          <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Dr.</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      {u.consultationFee && (
                        <div className="text-xs text-green-600">KSH {u.consultationFee}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : userOptions.length > 0 ? (
              <div className="text-center text-muted-foreground py-4">
                {searchTerm ? 'No users found matching your search.' : 'All users already have conversations!'}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">No users found</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      {/* Chat Window */}
      <div className="w-full sm:flex-1 flex flex-col bg-white sm:bg-transparent">
        <CardHeader className="px-2 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-base">
            {selectedUser ? (
              <>
                {selectedUser.name}
                {selectedUser.specialty && (
                  <span className="text-xs text-blue-600 ml-2">({selectedUser.specialty})</span>
                )}
              </>
            ) : 'Select a user to start messaging'}
          </CardTitle>
          {selectedUser && <CardDescription className="truncate">{selectedUser.email}</CardDescription>}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-2 sm:px-4" style={{ minHeight: 200, maxHeight: 400 }}>
          {loadingMessages ? (
            <div className="text-center text-muted-foreground py-8">Loading messages...</div>
          ) : !selectedUser ? (
            <div className="text-center text-muted-foreground py-8">Select a user to start messaging</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No messages yet</div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => {
                const isOwnMessage = msg.senderId._id === currentUserId;
                const showSenderInfo = index === 0 || 
                  messages[index - 1]?.senderId._id !== msg.senderId._id ||
                  new Date(msg.createdAt).getTime() - new Date(messages[index - 1]?.createdAt).getTime() > 5 * 60 * 1000; // 5 minutes
                
                return (
                  <div key={msg._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80vw] sm:max-w-xs ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {!isOwnMessage && showSenderInfo && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{msg.senderId.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-xs font-medium text-gray-600">
                            {msg.senderId.name}
                            {msg.senderId.specialty && (
                              <span className="text-blue-600 ml-1">({msg.senderId.specialty})</span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className={`rounded-lg px-3 py-2 ${
                        isOwnMessage 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="text-sm break-words">{msg.content}</div>
                        <div className={`text-[10px] mt-1 text-right ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                          {msg.isRead && isOwnMessage && (
                            <span className="ml-1">✓✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
        {/* Message Input */}
        {selectedUser && (
          <form
            className="flex items-center gap-2 border-t p-2 bg-white sm:bg-transparent"
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
          >
            <Input
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sending}
              maxLength={1000}
            />
            <Button type="submit" disabled={sending || !messageInput.trim()}>Send</Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Messaging; 