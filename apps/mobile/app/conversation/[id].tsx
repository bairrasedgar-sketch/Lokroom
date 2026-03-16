import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  imageUrl?: string;
}

async function fetchMessages(conversationId: string) {
  const { data } = await api.get(`/messages/list?conversationId=${conversationId}`);
  return data.messages as Message[];
}

export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);
  const qc = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", id],
    queryFn: () => fetchMessages(id),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      api.post("/messages/stream", { conversationId: id, content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    sendMutation.mutate(trimmed);
  };

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.msgImage} resizeMode="cover" />
        )}
        {item.content ? (
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.content}
          </Text>
        ) : null}
        <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
          {new Date(item.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  }, [user?.id]);

  return (
    <>
      <Stack.Screen options={{ title: "Conversation", headerShown: true }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 44}
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563EB" />
        ) : (
          <FlatList
            ref={listRef}
            data={messages || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  list: { padding: 16, gap: 8 },
  bubble: { maxWidth: "75%", borderRadius: 18, padding: 12, marginBottom: 4 },
  bubbleMe: { alignSelf: "flex-end", backgroundColor: "#2563EB", borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: "flex-start", backgroundColor: "#fff", borderBottomLeftRadius: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextMe: { color: "#fff" },
  bubbleTextThem: { color: "#111827" },
  bubbleTime: { fontSize: 11, marginTop: 4 },
  bubbleTimeMe: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  bubbleTimeThem: { color: "#9CA3AF" },
  msgImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F3F4F6", gap: 8 },
  input: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: "#111827", maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#2563EB", justifyContent: "center", alignItems: "center" },
  sendBtnDisabled: { backgroundColor: "#BFDBFE" },
  sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "700" },
});
