import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { UserRole } from '@/domain/user/enterprise/entities/enums/role.enum';
import { User } from '@/domain/user/enterprise/entities/user';
import { User as PrismaUser, Prisma } from '@prisma/client';

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create(
      {
        name: raw.name,
        email: raw.email,
        password: raw.password,
        role: UserRole[raw.role],
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(user: User): Prisma.UserUncheckedCreateInput {
    return {
      id: user.id.toString(),
      name: user.name.toString(),
      email: user.email.toString(),
      password: user.password,
      role: user.role,
    };
  }
}
