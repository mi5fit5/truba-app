import { useEffect, useRef } from 'react';

import type { TMessage } from '../../../types';
import { formatMessageDate } from '../../../utils/formatMessageDate';

import { MessageItem } from '../../MessageItem';
import { Text } from '../../ui/Text';

import styles from './MessageList.module.scss';

interface MessageListProps {
  messages: TMessage[];
  currentUserId: string;
  currentUsername: string;
  friendUsername: string;
}

export const MessageList = ({
  messages,
  currentUserId,
  currentUsername,
  friendUsername,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.container}>
      <div className={styles.listWrapper}>
        <div className={styles.contentWrapper}>
          <Text as='p' size={30} lowercase>
            Начало вашего общения:
          </Text>
          <div className={styles.messagesGroup}>
            {messages.map((msg) => {
              const isMe = msg.sender === currentUserId;

              const type = isMe ? 'me' : 'friend';
              const senderName = isMe ? currentUsername : friendUsername;

              return (
                <MessageItem
                  key={msg._id}
                  type={type}
                  timestamp={formatMessageDate(msg.createdAt)}
                  senderName={senderName}
                  text={msg.text}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
};
