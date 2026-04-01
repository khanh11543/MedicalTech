import { Redirect } from 'expo-router';

/**
 * Fallback when the app is opened via OAuth deep link outside an active auth session.
 * Normal flow: WebBrowser.openAuthSessionAsync captures the URL and never needs this screen.
 */
export default function OAuthFallbackScreen() {
  return <Redirect href="/sign-in" />;
}
