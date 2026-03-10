import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  MessageSquare,
  Send,
  Paperclip,
  Mic,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Trash2,
  FileText,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

interface AskLexiPageProps {
  onBack: () => void;
  userName?: string;
}

interface Message {
  id: string;
  sender: 'lexi' | 'user';
  text: string;
  timestamp: Date;
  suggestions?: string[];
  fileAttachment?: {
    name: string;
    type: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
}

export function AskLexiPage({ onBack, userName = 'Student' }: AskLexiPageProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  // Load conversations and messages from localStorage on mount
  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem('lexi_conversations');
      if (savedConversations) {
        setConversations(JSON.parse(savedConversations));
      }

      const savedCurrentConvId = localStorage.getItem('lexi_current_conversation_id');
      if (savedCurrentConvId && savedCurrentConvId !== 'null') {
        setCurrentConversationId(savedCurrentConvId);
        
        // Load messages for the current conversation
        const savedMessages = localStorage.getItem(`lexi_messages_${savedCurrentConvId}`);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        }
      }
    } catch (error) {
      console.error('Error loading chat history from localStorage:', error);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lexi_conversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversations to localStorage:', error);
    }
  }, [conversations]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      try {
        localStorage.setItem(`lexi_messages_${currentConversationId}`, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
    }
  }, [messages, currentConversationId]);

  // Save current conversation ID to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lexi_current_conversation_id', currentConversationId || '');
    } catch (error) {
      console.error('Error saving current conversation ID to localStorage:', error);
    }
  }, [currentConversationId]);

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent clicking the conversation item
    
    // Remove from conversations list
    setConversations(conversations.filter(c => c.id !== convId));
    
    // Delete messages from localStorage
    try {
      localStorage.removeItem(`lexi_messages_${convId}`);
    } catch (error) {
      console.error('Error deleting conversation from localStorage:', error);
    }
    
    // If we're deleting the current conversation, reset to empty state
    if (currentConversationId === convId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  const handleConversationClick = (convId: string) => {
    setCurrentConversationId(convId);
    
    // Load messages for this conversation
    try {
      const savedMessages = localStorage.getItem(`lexi_messages_${convId}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // If this is the first message, create a new conversation
    if (!currentConversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
        timestamp: 'Just now',
        preview: messageText
      };
      setConversations([newConversation, ...conversations]);
      setCurrentConversationId(newConversation.id);
    }

    // Simulate Lexi's response
    setTimeout(() => {
      const lexiResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'lexi',
        text: getLexiResponse(messageText),
        timestamp: new Date(),
        suggestions: ['Tell me more', 'What documents do I need?', 'Contact my DSO']
      };
      setMessages(prev => [...prev, lexiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const getLexiResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('cpt') || lowerQuestion.includes('work')) {
      return "Great question about CPT (Curricular Practical Training)! CPT allows F-1 students to work off-campus in positions directly related to their major. Here are the key points:\n\n• You must be enrolled full-time for at least one academic year\n• The work must be an integral part of your curriculum\n• You need DSO authorization before starting work\n• CPT can be full-time or part-time\n\nFor remote work specifically, it depends on your university's policy and how the position relates to your program. Would you like me to help you submit a CPT authorization request?";
    }
    
    if (lowerQuestion.includes('opt')) {
      return "OPT (Optional Practical Training) is temporary employment authorization for F-1 students. Here's what you need to know:\n\n• Apply 90 days before graduation, but no earlier\n• Must apply at least 30 days before your program end date\n• Processing takes 3-5 months typically\n• STEM majors may qualify for 24-month extension\n\nI can help you check your eligibility and prepare your application. Would you like to proceed?";
    }
    
    if (lowerQuestion.includes('travel') || lowerQuestion.includes('signature')) {
      return "For international travel on F-1 status, you need a valid travel signature on your I-20. Here's the process:\n\n• Travel signatures are valid for 1 year (or 6 months if on OPT)\n• Request from your DSO before traveling\n• Also ensure your visa stamp and passport are valid\n• Keep all original documents with you when traveling\n\nWould you like me to help you request a travel signature from your DSO?";
    }
    
    if (lowerQuestion.includes('i-20') || lowerQuestion.includes('i20')) {
      return "Your I-20 is the most important document for maintaining F-1 status. I can help you with:\n\n• Requesting I-20 updates (program extension, personal info changes)\n• Getting travel signatures\n• Understanding information on your I-20\n• Replacing lost or damaged I-20s\n\nWhat specific help do you need with your I-20?";
    }
    
    return "I understand you're asking about your F-1 status and immigration journey. As your AI assistant, I can help with questions about:\n\n• CPT and OPT work authorization\n• I-20 documents and travel signatures\n• SEVIS compliance and status\n• Document requirements\n• General F-1 guidance\n\nCould you provide more details about your specific situation so I can give you the most accurate guidance?";
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleFileUpload = () => {
    setShowUploadSuccess(true);
    setTimeout(() => setShowUploadSuccess(false), 3000);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const quickSuggestions = [
    'What is CPT?',
    'How do I apply for OPT?',
    'Need a travel signature',
    'I-20 questions'
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      {/* Left Sidebar - Conversation History */}
      <aside className={`bg-[#F4F4F4] border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'
      } flex flex-col h-screen fixed left-0 top-0 z-30`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900">Ask Lexi</h2>
              <p className="text-gray-600">Your AI assistant for F-1 guidance</p>
            </div>
          </div>
          <Button 
            className="w-full bg-[#2A73E8] hover:bg-[#1557b0]"
            onClick={handleNewConversation}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-300">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search your conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A73E8] bg-white"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No conversations yet</p>
              <p className="text-gray-400 mt-1">Start a new chat with Lexi</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleConversationClick(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentConversationId === conv.id
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 truncate">{conv.title}</p>
                    <p className="text-gray-500 text-sm truncate">{conv.preview}</p>
                    <p className="text-gray-400 text-xs mt-1">{conv.timestamp}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Collapse Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`fixed top-1/2 -translate-y-1/2 z-40 bg-white border border-gray-200 rounded-r-lg p-2 shadow-sm hover:bg-gray-50 transition-all ${
          sidebarCollapsed ? 'left-0' : 'left-80'
        }`}
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-0' : 'ml-80'
      }`}>
        {/* Chat Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-gray-900">
                {currentConversationId 
                  ? conversations.find(c => c.id === currentConversationId)?.title 
                  : 'New Conversation'}
              </h1>
              <p className="text-gray-500">AI advising assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Success Toast */}
        {showUploadSuccess && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                File uploaded successfully
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              // Empty State - Clean and Elegant
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-gray-900 mb-4">Ask Lexi anything about your F-1 journey</h2>
                <p className="text-gray-600 max-w-2xl mx-auto mb-12">
                  Get instant, personalized guidance on visas, compliance, CPT, OPT, travel signatures, 
                  documents, and all aspects of your international student experience.
                </p>
                
                <div className="max-w-xl mx-auto">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Lexi provides general guidance. For official decisions, your DSO will review your specific case.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            ) : (
              // Messages
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'lexi' && (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    <div className={`flex-1 max-w-2xl ${message.sender === 'user' ? 'flex justify-end' : ''}`}>
                      <div
                        className={`p-4 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-[#2A73E8] text-white'
                            : 'bg-[#F1F1F1] text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-line">{message.text}</p>
                        {message.fileAttachment && (
                          <div className="mt-3 pt-3 border-t border-white/20">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">{message.fileAttachment.name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="px-4 py-2 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {message.sender === 'user' && (
                      <div className="w-10 h-10 bg-[#2A73E8] rounded-full flex items-center justify-center flex-shrink-0 text-white">
                        {userInitials}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-[#F1F1F1] text-gray-900 p-4 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="border-t border-gray-200 bg-white px-6 py-4 sticky bottom-0">
          <div className="max-w-4xl mx-auto">
            {/* Quick Suggestions (before typing) */}
            {messages.length === 0 && inputValue === '' && (
              <div className="flex flex-wrap gap-2 mb-4">
                {quickSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="px-4 py-2 bg-[#F1F1F1] rounded-full text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask Lexi anything..."
                  className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A73E8] resize-none max-h-32"
                  rows={1}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                  <button
                    onClick={handleFileUpload}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className="bg-[#2A73E8] hover:bg-[#1557b0] h-12 w-12 rounded-full p-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}