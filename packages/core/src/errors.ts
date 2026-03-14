export class InvalidTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTransitionError';
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
