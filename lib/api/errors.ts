export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number = 400, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return typeof err === 'object' && err !== null && (err as any).name === 'ApiError';
}



