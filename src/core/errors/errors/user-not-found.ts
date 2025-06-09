import { UseCaseError } from '../use-case-error';

export class UserNotFound extends Error implements UseCaseError {
  constructor() {
    super('User not found');
  }
}
