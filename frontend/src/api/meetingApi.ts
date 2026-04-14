import { API_BASE_URL } from './config';

export interface CreateMeetingResponse {
  status: string;
  meeting_id: string;
  passcode: string;
  invite_link: string;
}

export interface JoinMeetingResponse {
  status: string;
  message?: string;
}

export const meetingApi = {
  createMeeting: async (name: string, mode: 'instant' | 'scheduled', scheduledAt?: string): Promise<CreateMeetingResponse> => {
    const response = await fetch(`${API_BASE_URL}/meeting/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mode, scheduled_at: scheduledAt }),
    });

    if (!response.ok) {
      throw new Error('Failed to create meeting');
    }

    return response.json();
  },

  joinMeeting: async (meetingId: string, passcode: string): Promise<JoinMeetingResponse> => {
    const response = await fetch(`${API_BASE_URL}/meeting/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id: meetingId, passcode }),
    });

    if (!response.ok) {
      throw new Error('Failed to join meeting');
    }

    return response.json();
  },
};
