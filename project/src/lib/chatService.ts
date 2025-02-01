import { supabase } from './supabase';

export interface ChatResponseData {
  conversation_id: number;
  response: string;
}

export interface ConversationMeta {
  id: number;
  title: string;
}

export interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: string;
}

export interface Conversation {
  id: number;
  title: string;
  messages: Message[];
}

export async function getConversations(userId: string): Promise<ConversationMeta[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getConversation(conversationId: number): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, messages')
    .eq('id', conversationId)
    .single();

  if (error) throw error;
  return data;
}

export async function createConversation(userId: string, title: string): Promise<number> {
  const { data, error } = await supabase
    .from('conversations')
    .insert([
      { user_id: userId, title, messages: [] }
    ])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateConversation(
  conversationId: number,
  messages: Message[]
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ messages })
    .eq('id', conversationId);

  if (error) throw error;
}

export async function deleteConversation(conversationId: number): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) throw error;
}