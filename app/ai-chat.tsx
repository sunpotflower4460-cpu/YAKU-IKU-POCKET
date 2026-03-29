import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/colors';
import { DisclaimerBanner } from '../src/components/DisclaimerBanner';
import { useGameStore } from '../src/store/useGameStore';
import { sendHealthChat, ChatMessage } from '../src/utils/claudeChat';

const STARTER_QUESTIONS = [
  '最近疲れやすいのですが...',
  '冷え性を改善したい',
  'ストレスが多くて眠れない',
  '胃の調子が悪い',
  '今の季節の養生法は？',
  '収集した植物でできることを教えて',
];

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: `こんにちは！やくいくコンシェルジュです🌿

東洋医学・薬膳・アーユルヴェーダなど、さまざまな伝統医学の知恵をもとに、あなたの健康をサポートします。

あなたが収集した植物・ハーブの情報も活用しながら、個別のアドバイスをお伝えします。

気になること、何でもお気軽に相談してください！`,
};

export default function AIChatScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const { discoveredPlantIds, playerName, getLevel } = useGameStore();
  const level = getLevel();

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msgText = (text ?? inputText).trim();
    if (!msgText || loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');

    const userMsg: ChatMessage = { role: 'user', content: msgText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build conversation history (exclude welcome message for API calls)
      const apiMessages = newMessages.filter(
        (m, i) => !(i === 0 && m.role === 'assistant')
      );
      const reply = await sendHealthChat(apiMessages, discoveredPlantIds, playerName, level);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '申し訳ありません、接続に問題が発生しました。しばらくしてからもう一度お試しください。',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <DisclaimerBanner />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textWhite} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>健康相談AI</Text>
          <Text style={styles.headerSub}>{discoveredPlantIds.length}種の植物を記憶中</Text>
        </View>
        <Pressable onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        {loading && (
          <View style={styles.typingBubble}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.typingText}>考えています...</Text>
          </View>
        )}
      </ScrollView>

      {/* Starter questions (only when conversation is fresh) */}
      {messages.length <= 1 && !loading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.starterScroll}
        >
          {STARTER_QUESTIONS.map((q) => (
            <Pressable
              key={q}
              style={styles.starterChip}
              onPress={() => handleSend(q)}
            >
              <Text style={styles.starterText}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="健康のことを相談する..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => handleSend()}
        />
        <Pressable
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons name="send" size={18} color={Colors.textWhite} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>🌿</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: { padding: 4 },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  clearButton: {
    padding: 4,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bubbleAI: {
    backgroundColor: Colors.bgCard,
    borderBottomLeftRadius: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: Colors.primaryDark,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: Colors.textWhite,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgCard,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  starterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  starterChip: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  starterText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
