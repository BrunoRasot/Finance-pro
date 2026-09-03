export interface Identity {
  userId: string;
}

export abstract class TokenVerifier {
  abstract verify(token: string): Promise<Identity>;
}
