import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { BrowserWindow, safeStorage, app } from 'electron';
import Store from 'electron-store';
import * as http from 'http';
import * as path from 'path';
import { calendarEventQueries } from '../database/queries';
import type { CalendarEvent, GoogleTokens } from '../../shared/types';

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(app.getAppPath(), '.env') });

const store = new Store();

// For desktop apps, we use loopback redirect with a local server
const LOOPBACK_HOST = '127.0.0.1';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
];

let oauth2Client: OAuth2Client | null = null;
let syncInterval: NodeJS.Timeout | null = null;
let currentRedirectUri: string = '';

// Get Google credentials from settings or environment variables
function getGoogleCredentials(): { clientId: string; clientSecret: string } {
  // First try to get from settings (stored via electron-store)
  const settings = store.get('settings') as { googleClientId?: string; googleClientSecret?: string } | undefined;

  const clientId = settings?.googleClientId || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = settings?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '';

  return { clientId, clientSecret };
}

function getOAuth2Client(redirectUri?: string): OAuth2Client {
  const { clientId, clientSecret } = getGoogleCredentials();
  const uri = redirectUri || currentRedirectUri || `http://${LOOPBACK_HOST}:3000/callback`;

  // Always recreate if credentials might have changed
  if (!oauth2Client || (redirectUri && redirectUri !== currentRedirectUri)) {
    currentRedirectUri = uri;
    oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      uri
    );
  }
  return oauth2Client;
}

// Check if Google credentials are configured
export function hasGoogleCredentials(): boolean {
  const { clientId, clientSecret } = getGoogleCredentials();
  return !!(clientId && clientSecret &&
    clientId !== 'your_client_id_here.apps.googleusercontent.com' &&
    clientSecret !== 'your_client_secret_here' &&
    clientId.length > 0 && clientSecret.length > 0);
}

// Securely store tokens
function storeTokens(tokens: GoogleTokens): void {
  const encrypted = safeStorage.encryptString(JSON.stringify(tokens));
  store.set('google_tokens', encrypted.toString('base64'));
}

// Retrieve stored tokens
function getStoredTokens(): GoogleTokens | null {
  const encrypted = store.get('google_tokens') as string | undefined;
  if (!encrypted) return null;

  try {
    const decrypted = safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
    return JSON.parse(decrypted) as GoogleTokens;
  } catch {
    return null;
  }
}

// Clear stored tokens
function clearTokens(): void {
  store.delete('google_tokens');
}

export async function isAuthenticated(): Promise<boolean> {
  const tokens = getStoredTokens();
  if (!tokens) return false;

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate,
  });

  // Check if token is expired and try to refresh
  if (tokens.expiryDate && tokens.expiryDate < Date.now()) {
    try {
      const { credentials } = await client.refreshAccessToken();
      storeTokens({
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token || tokens.refreshToken,
        expiryDate: credentials.expiry_date!,
      });
      return true;
    } catch {
      clearTokens();
      return false;
    }
  }

  return true;
}

export async function authenticate(): Promise<void> {
  // Check if credentials are configured
  if (!hasGoogleCredentials()) {
    throw new Error(
      'Google Calendar credentials not configured. Please go to Settings → Google API Configuration and enter your Client ID and Client Secret from Google Cloud Console.'
    );
  }

  return new Promise((resolve, reject) => {
    // Create a local HTTP server to receive the OAuth callback
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '', `http://${LOOPBACK_HOST}`);

        if (url.pathname === '/callback') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: system-ui; text-align: center; padding: 50px;">
                  <h1 style="color: #ef4444;">Authentication Failed</h1>
                  <p>Error: ${error}</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error(error));
            return;
          }

          if (code) {
            try {
              const client = getOAuth2Client();
              const { tokens } = await client.getToken(code);
              client.setCredentials(tokens);

              storeTokens({
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token!,
                expiryDate: tokens.expiry_date!,
              });

              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body style="font-family: system-ui; text-align: center; padding: 50px;">
                    <h1 style="color: #22c55e;">Connected Successfully!</h1>
                    <p>Your Google Calendar is now connected to MedPlanOS.</p>
                    <p>You can close this window and return to the app.</p>
                    <script>setTimeout(() => window.close(), 2000);</script>
                  </body>
                </html>
              `);

              server.close();
              resolve();
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body style="font-family: system-ui; text-align: center; padding: 50px;">
                    <h1 style="color: #ef4444;">Authentication Failed</h1>
                    <p>Could not exchange code for tokens.</p>
                    <p>You can close this window.</p>
                  </body>
                </html>
              `);
              server.close();
              reject(err);
            }
          }
        }
      } catch (err) {
        server.close();
        reject(err);
      }
    });

    // Find an available port and start the server
    server.listen(0, LOOPBACK_HOST, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Failed to start local OAuth server'));
        return;
      }

      const port = address.port;
      const redirectUri = `http://${LOOPBACK_HOST}:${port}/callback`;

      // Create OAuth client with this redirect URI
      const client = getOAuth2Client(redirectUri);

      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
      });

      // Open the auth URL in a new browser window
      const authWindow = new BrowserWindow({
        width: 600,
        height: 700,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      authWindow.loadURL(authUrl);

      // Handle window close
      authWindow.on('closed', () => {
        // Give a short delay to check if auth completed
        setTimeout(() => {
          server.close();
        }, 1000);
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error('Authentication timed out'));
      }, 5 * 60 * 1000);
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

export function disconnect(): void {
  clearTokens();
  stopAutoSync();
  calendarEventQueries.clearAll();
}

export async function fetchCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const isAuthed = await isAuthenticated();
  if (!isAuthed) {
    throw new Error('Not authenticated with Google Calendar');
  }

  const client = getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth: client });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    const events = response.data.items || [];
    const calendarEvents: CalendarEvent[] = [];

    for (const event of events) {
      if (!event.id || !event.summary) continue;

      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;

      if (!startTime || !endTime) continue;

      const calendarEvent = calendarEventQueries.upsert({
        googleEventId: event.id,
        title: event.summary,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        location: event.location || undefined,
        description: event.description || undefined,
        lastSynced: new Date().toISOString(),
        isGoogleEvent: true,
      });

      calendarEvents.push(calendarEvent);
    }

    return calendarEvents;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

export async function syncCalendar(): Promise<CalendarEvent[]> {
  // Sync events for the current week and next 4 weeks
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endDate = new Date(startOfWeek);
  endDate.setDate(endDate.getDate() + 35); // 5 weeks

  return fetchCalendarEvents(startOfWeek, endDate);
}

export function startAutoSync(intervalMinutes: number): void {
  stopAutoSync();

  syncInterval = setInterval(
    async () => {
      try {
        await syncCalendar();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    },
    intervalMinutes * 60 * 1000
  );
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export function getEventsFromDb(startDate: string, endDate: string): CalendarEvent[] {
  return calendarEventQueries.getByDateRange(startDate, endDate);
}
