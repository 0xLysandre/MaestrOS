import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { BrowserWindow, safeStorage } from 'electron';
import Store from 'electron-store';
import { calendarEventQueries } from '../database/queries';
import type { CalendarEvent, GoogleTokens } from '../../shared/types';

const store = new Store();

// These would normally be in environment variables
// For development, you'll need to set these up in Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/oauth/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
];

let oauth2Client: OAuth2Client | null = null;
let syncInterval: NodeJS.Timeout | null = null;

function getOAuth2Client(): OAuth2Client {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
  }
  return oauth2Client;
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
  const client = getOAuth2Client();

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  return new Promise((resolve, reject) => {
    // Create auth window
    const authWindow = new BrowserWindow({
      width: 600,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    authWindow.loadURL(authUrl);

    // Handle redirect
    authWindow.webContents.on('will-redirect', async (event, url) => {
      if (url.startsWith(REDIRECT_URI)) {
        event.preventDefault();

        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');

        if (error) {
          authWindow.close();
          reject(new Error(error));
          return;
        }

        if (code) {
          try {
            const { tokens } = await client.getToken(code);
            client.setCredentials(tokens);

            storeTokens({
              accessToken: tokens.access_token!,
              refreshToken: tokens.refresh_token!,
              expiryDate: tokens.expiry_date!,
            });

            authWindow.close();
            resolve();
          } catch (err) {
            authWindow.close();
            reject(err);
          }
        }
      }
    });

    authWindow.on('closed', () => {
      reject(new Error('Authentication window was closed'));
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
