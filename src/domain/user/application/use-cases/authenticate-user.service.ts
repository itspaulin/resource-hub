import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/user-repository';
import { HashComparer } from '../cryptography/hash-comparer';
import { Encrypter } from '../cryptography/encrypter';
import { WrongCredentialsError } from './errors/wrong-credentials-error';

interface AutheticateUserUseCaseRequest {
  email: string;
  password: string;
}

type AutheticateUserUseCaseResponse = Either<
  WrongCredentialsError,
  {
    accessToken: string;
  }
>;

@Injectable()
export class AutheticateUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private hashCompare: HashComparer,
    private encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: AutheticateUserUseCaseRequest): Promise<AutheticateUserUseCaseResponse> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      return left(new WrongCredentialsError());
    }

    const isPasswordValid = await this.hashCompare.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return left(new WrongCredentialsError());
    }

    const accessToken = await this.encrypter.encrypt({
      sub: user.id.toString(),
    });

    return right({
      accessToken,
    });
  }
}
