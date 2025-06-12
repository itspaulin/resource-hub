import { Either, left, right } from '@/core/either';
import { UserRole } from '../../enterprise/entities/enums/role.enum';
import { UserAlreadyExistsError } from './errors/user-already-exists';
import { User } from '../../enterprise/entities/user';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/user-repository';
import { HashGenerator } from '../cryptography/hash-generator';

interface RegisterUserServiceRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

type RegisterUserServiceResponse = Either<
  UserAlreadyExistsError,
  {
    user: User;
  }
>;

@Injectable()
export class RegisterUserService {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute({
    name,
    email,
    password,
    role = UserRole.USER,
  }: RegisterUserServiceRequest): Promise<RegisterUserServiceResponse> {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      return left(new UserAlreadyExistsError(email));
    }

    const hashedPassword = await this.hashGenerator.hash(password);

    const user = User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await this.userRepository.create(user);

    return right({ user });
  }
}
