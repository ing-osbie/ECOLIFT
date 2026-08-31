import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { GradientBackground } from '@/components/gradient-background';
import { GlassCard } from '@/components/glass-card';
import { getColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, Send } from 'lucide-react-native';

interface Message {
  id: string;
  sender: 'me' | 'other';
  text: string;
  time: string;
}

export default function Chat() {
  const router = useRouter();
  const { isDarkMode, selectedCollector } = useApp();
  const C = getColors(isDarkMode);

  const flatListRef = useRef<FlatList>(null);
  const collectorName = selectedCollector?.name || 'Kwame Mensah';

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'other', text: 'Hello, I have accepted your pickup request and am en route.', time: '02:30 PM' },
    { id: '2', sender: 'me', text: 'Great, thanks! Please let me know when you arrive.', time: '02:31 PM' },
    { id: '3', sender: 'other', text: 'Sure, I should be there in about 10 minutes.', time: '02:31 PM' },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = {
      id: Math.random().toString(),
      sender: 'me',
      text: input.trim(),
      time,
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Simulate reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'other',
        text: 'Received! Turning into your street now.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF', borderColor: C.border }]}>
            <ArrowLeft size={24} color={C.text} />
          </TouchableOpacity>
          
          <View style={styles.headerDetails}>
            <View style={[styles.avatarCircle, { backgroundColor: C.primary }]}>
              <Text style={styles.avatarText}>{collectorName[0]}</Text>
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: C.text }]}>{collectorName}</Text>
              <Text style={[styles.headerSub, { color: C.greyText }]}>Active Pickup Agent</Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Chat Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isMe = item.sender === 'me';
              return (
                <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
                  <GlassCard style={[
                    styles.bubble,
                    isMe 
                      ? { backgroundColor: C.primary, borderBottomRightRadius: 4 } 
                      : { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF', borderBottomLeftRadius: 4 }
                  ]}>
                    <Text style={[
                      styles.messageText, 
                      isMe ? { color: isDarkMode ? '#000000' : '#FFFFFF' } : { color: C.text }
                    ]}>
                      {item.text}
                    </Text>
                    <Text style={[
                      styles.messageTime,
                      isMe ? { color: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' } : { color: C.greyText }
                    ]}>
                      {item.time}
                    </Text>
                  </GlassCard>
                </View>
              );
            }}
          />

          {/* Input Bar */}
          <View style={[styles.inputBar, { backgroundColor: isDarkMode ? '#1E1E22' : '#FFFFFF', borderColor: C.border }]}>
            <TextInput
              style={[styles.textInput, { color: C.text }]}
              placeholder="Type your message..."
              placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(11,61,46,0.3)'}
              value={input}
              onChangeText={setInput}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, { backgroundColor: C.primary }]}
              onPress={handleSend}
            >
              <Send size={18} color={isDarkMode ? '#000000' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>

      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#000000',
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
  },
  headerSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
  messageList: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    padding: 14,
    borderRadius: 18,
  },
  messageText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  textInput: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
