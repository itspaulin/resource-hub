import { UsersRepository } from '@/domain/user/application/repositories/user-repository';
import { User } from '@/domain/user/enterprise/entities/user';

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    const user = this.items.find((item) => item.email === email);

    return user ?? null;
  }

  async create(user: User): Promise<void> {
    this.items.push(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = this.items.find((item) => item.id.toString() === id);

    return user ?? null;
  }

  async findAll(): Promise<User[]> {
    return this.items;
  }

  async delete(id: string): Promise<void> {
    const userIndex = this.items.findIndex((item) => item.id.toString() === id);

    if (userIndex >= 0) {
      this.items.splice(userIndex, 1);
    }
  }

  async update(user: User): Promise<void> {
    const userIndex = this.items.findIndex((item) => item.id.equals(user.id));

    if (userIndex >= 0) {
      this.items[userIndex] = user;
    }
  }

  clear(): void {
    this.items = [];
  }
}
