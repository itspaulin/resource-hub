import { Entity } from 'src/core/entites/entity';
import { UserRole } from './enums/role.enum';
import { Optional } from 'src/core/@types/Optional';
import { UniqueEntityId } from 'src/core/entites/unique-entity-id';

interface UserProps {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date | null;
}

export class User extends Entity<UserProps> {
  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }

  get password() {
    return this.props.password;
  }

  get role() {
    return this.props.role;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<UserProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityId,
  ) {
    const user = new User(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
    return user;
  }
}
