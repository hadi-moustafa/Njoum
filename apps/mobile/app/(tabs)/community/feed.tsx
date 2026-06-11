// ============================================================
// Group Feed — posts + reactions + compose
// ============================================================
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, Switch } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { StarField } from '../../../components/home/StarField';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface Post {
  id: string;
  content: string;
  is_anonymous: boolean;
  is_flagged: boolean;
  created_at: string;
  author_name?: string;
  reaction_counts?: Record<string, number>;
}

const REACTIONS: { type: string; emoji: string; label: string }[] = [
  { type: 'heart',   emoji: '❤️', label: 'قلب'   },
  { type: 'hug',     emoji: '🤗', label: 'عناق'  },
  { type: 'support', emoji: '💪', label: 'دعم'   },
  { type: 'star',    emoji: '⭐', label: 'نجمة'  },
];

export default function FeedScreen() {
  const { isDark, colors } = useColorScheme();
  const qc            = useQueryClient();
  const params        = useLocalSearchParams<{ groupId: string; groupName: string }>();
  const groupId       = params.groupId ?? '';
  const groupName     = decodeURIComponent(params.groupName ?? 'المجموعة');

  const [showCompose, setShowCompose] = useState(false);
  const [postText,    setPostText]    = useState('');
  const [isAnon,      setIsAnon]      = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['posts', groupId],
    queryFn:  () => api.get<Post[]>(`/community/groups/${groupId}/posts`),
    enabled:  !!groupId,
  });

  const posts = data?.data ?? [];

  const createPost = useMutation({
    mutationFn: () => api.post(`/community/groups/${groupId}/posts`, {
      content: postText,
      is_anonymous: isAnon,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts', groupId] });
      setPostText(''); setIsAnon(false); setShowCompose(false);
    },
    onError: () => Alert.alert('خطأ', 'تعذّر نشر المنشور.'),
  });

  const reactMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: string }) =>
      api.post(`/community/posts/${postId}/reactions`, { reaction_type: type }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts', groupId] }),
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isDark && <StarField />}
      <ScreenHeader title={groupName} showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* Compose toggle */}
        {!showCompose ? (
          <Pressable
            style={[styles.composePlaceholder, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => setShowCompose(true)}
          >
            <Text style={{ color: colors.textMuted, fontSize: FontSize.sm, textAlign: 'right' }}>
              شاركي أفكاركِ مع المجموعة…
            </Text>
          </Pressable>
        ) : (
          <Card style={{ marginBottom: Spacing.md }}>
            <TextInput
              style={[styles.composeInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="اكتبي منشوركِ…"
              placeholderTextColor={colors.textMuted}
              value={postText}
              onChangeText={setPostText}
              multiline
              textAlign="right"
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.anonRow}>
              <Switch
                value={isAnon}
                onValueChange={setIsAnon}
                trackColor={{ true: Colors.primary }}
              />
              <Text style={[styles.anonLabel, { color: colors.textMuted }]}>نشر بشكل مجهول</Text>
            </View>
            {isAnon && (
              <Text style={[styles.anonNote, { color: colors.textMuted }]}>
                اسمكِ لن يظهر للأعضاء — لكنه محفوظ للمشرفين.
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Button label="إلغاء" variant="outline" onPress={() => { setShowCompose(false); setPostText(''); }} style={{ flex: 1 }} />
              <Button label="نشر" onPress={() => createPost.mutate()} loading={createPost.isPending} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        {/* Posts */}
        {isLoading && <Text style={{ color: colors.textMuted, textAlign: 'center' }}>جارٍ التحميل…</Text>}

        {posts.map(post => (
          <Card key={post.id} style={{ marginBottom: Spacing.sm }}>
            <Text style={[styles.authorLine, { color: colors.textMuted }]}>
              {post.is_anonymous ? '🌸 عضوة مجهولة' : (post.author_name ?? 'عضوة')}
              {'  ·  '}
              {new Date(post.created_at).toLocaleDateString('ar-LB', { dateStyle: 'short' })}
            </Text>
            <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>

            {/* Reactions */}
            <View style={styles.reactRow}>
              {REACTIONS.map(r => (
                <Pressable
                  key={r.type}
                  style={styles.reactBtn}
                  onPress={() => reactMutation.mutate({ postId: post.id, type: r.type })}
                >
                  <Text style={{ fontSize: 16 }}>{r.emoji}</Text>
                  {(post.reaction_counts?.[r.type] ?? 0) > 0 && (
                    <Text style={[styles.reactCount, { color: colors.textMuted }]}>
                      {post.reaction_counts![r.type]}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </Card>
        ))}

        {posts.length === 0 && !isLoading && (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xl }}>
            لا توجد منشورات بعد. كوني أول من يشارك!
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1 },
  composePlaceholder:{ borderWidth: 1, borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.md },
  composeInput:      { borderWidth: 1, borderRadius: 8, padding: Spacing.sm, minHeight: 100, fontSize: FontSize.md, marginBottom: Spacing.sm },
  anonRow:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'flex-end' },
  anonLabel:         { fontSize: FontSize.sm },
  anonNote:          { fontSize: FontSize.xs, textAlign: 'right', marginTop: 4 },
  authorLine:        { fontSize: FontSize.xs, textAlign: 'right', marginBottom: Spacing.xs },
  postContent:       { fontSize: FontSize.md, textAlign: 'right', lineHeight: 24 },
  reactRow:          { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, justifyContent: 'flex-end' },
  reactBtn:          { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reactCount:        { fontSize: FontSize.xs },
});
