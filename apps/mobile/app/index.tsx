import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import { Colors } from '../constants/theme';

export default function Index() {
  const [ready,      setReady]      = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={hasSession ? '/(tabs)' : '/(auth)/sign-in'} />;
}
