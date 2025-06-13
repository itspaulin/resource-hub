import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { faker } from '@faker-js/faker';
import { User, UserProps } from '@/domain/user/enterprise/entities/user';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { PrismaUserMapper } from '@/infra/database/prisma/mappers/prisma-user-mapper';
import { UserRole } from '@/domain/user/enterprise/entities/enums/role.enum';

export function makeStudent(
  override: Partial<UserProps> = {},
  id?: UniqueEntityId,
) {
  const question = User.create(
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      role: faker.helpers.enumValue(UserRole),
      ...override,
    },
    id,
  );

  return question;
}

@Injectable()
export class UserFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaStudent(data: Partial<UserProps> = {}): Promise<User> {
    const user = makeStudent(data);

    await this.prisma.user.create({
      data: PrismaUserMapper.toPrisma(user),
    });

    return user;
  }
}
