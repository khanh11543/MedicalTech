import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getApiBaseUrl } from '@/constants/api';
import { ApiError } from '@/services/apiClient';

export default function ModalScreen() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const base = getApiBaseUrl();

    (async () => {
      setStatus('loading');
      setMessage('');
      try {
        if (!base) {
          throw new ApiError(
            'Chưa có EXPO_PUBLIC_API_BASE_URL trên điện thoại thật. Xem hướng dẫn trong constants/api.ts.',
            0
          );
        }
        const res = await fetch(`${base}/v3/api-docs`, { method: 'GET' });
        if (cancelled) return;
        const text = await res.text();
        if (!res.ok) {
          let errMsg = res.statusText || 'Unreachable';
          try {
            const j = JSON.parse(text) as { message?: string };
            if (j?.message) errMsg = j.message;
          } catch {
            /* not JSON */
          }
          throw new ApiError(errMsg, res.status);
        }
        try {
          JSON.parse(text);
        } catch {
          throw new ApiError('Unexpected response from API', res.status);
        }
        setStatus('ok');
        setMessage(`API reachable at ${base}`);
      } catch (e) {
        if (cancelled) return;
        setStatus('err');
        setMessage(e instanceof ApiError ? e.message : 'Could not reach API. Check server and EXPO_PUBLIC_API_BASE_URL.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const openDocs = () => {
    const u = `${getApiBaseUrl().replace(/\/api$/, '')}/api/swagger-ui.html`;
    Linking.openURL(u).catch(() => {});
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">API check</ThemedText>
      <ThemedText style={styles.hint}>Loads OpenAPI spec from the same base URL as sign-in.</ThemedText>

      <View style={styles.statusBox}>
        {status === 'loading' ? (
          <ActivityIndicator size="small" />
        ) : (
          <ThemedText
            style={[
              styles.statusText,
              status === 'ok' ? styles.ok : status === 'err' ? styles.err : undefined,
            ]}
          >
            {status === 'idle' ? '…' : message}
          </ThemedText>
        )}
      </View>

      <TouchableOpacity onPress={openDocs} style={styles.linkBtn}>
        <ThemedText type="link">Open Swagger UI</ThemedText>
      </TouchableOpacity>

      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  hint: {
    textAlign: 'center',
    opacity: 0.75,
    marginBottom: 8,
  },
  statusBox: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 14,
  },
  ok: {
    color: '#27ae60',
  },
  err: {
    color: '#c0392b',
  },
  linkBtn: {
    marginTop: 8,
    paddingVertical: 8,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
