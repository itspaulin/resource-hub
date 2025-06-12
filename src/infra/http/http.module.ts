import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CryptograpyModule } from '../cryptography/cryptography.module';
import { RegisterUserService } from '@/domain/user/application/use-cases/register-user.service';
import { CreateAccountController } from './controllers/create-accout.controller';

@Module({
  imports: [DatabaseModule, CryptograpyModule],
  controllers: [CreateAccountController],
  providers: [RegisterUserService],
})
export class HttpModule {}
