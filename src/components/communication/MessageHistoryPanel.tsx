/**
 * MessageHistoryPanel
 *
 * Read-only list of sent messages with status badges.
 */
import { CheckCircle2, Clock, Mail } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

export interface Message {
    id: string;
    recipient: string;
    recipientEmail: string;
    subject: string;
    body: string;
    sentDate: string;
    sentBy: string;
    status: 'Sent' | 'Delivered' | 'Read';
    template?: string;
}

interface MessageHistoryPanelProps {
    messages: Message[];
}

const statusConfig: Record<Message['status'], { className: string; icon: React.ReactNode }> = {
    Sent: { className: 'bg-blue-100 text-blue-800', icon: <Mail className="w-3 h-3 mr-1" /> },
    Delivered: { className: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3 mr-1" /> },
    Read: { className: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> },
};

export function MessageHistoryPanel({ messages }: MessageHistoryPanelProps) {
    if (messages.length === 0) {
        return (
            <div className="text-center py-16">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No messages sent yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {messages.map(msg => {
                const cfg = statusConfig[msg.status];
                return (
                    <Card key={msg.id} className="shadow-sm border-0">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="text-gray-900 font-medium">{msg.subject}</p>
                                        {msg.template && (
                                            <Badge variant="outline" className="text-xs">{msg.template}</Badge>
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-sm mb-1">To: {msg.recipient} &lt;{msg.recipientEmail}&gt;</p>
                                    <p className="text-gray-500 text-sm line-clamp-2">{msg.body}</p>
                                    <p className="text-gray-400 text-xs mt-2">Sent by {msg.sentBy} on {msg.sentDate}</p>
                                </div>
                                <Badge className={`${cfg.className} hover:${cfg.className} flex items-center shrink-0`}>
                                    {cfg.icon}{msg.status}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
