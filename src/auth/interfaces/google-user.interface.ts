export interface GoogleUser {
  id: string;
  displayName: string;
  email?: string;
  photoUrl?: string;
  accessToken?: string;
  refreshToken?: string;
}
