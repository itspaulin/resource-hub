import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CryptograpyModule } from '../cryptography/cryptography.module';
import { CreateAccountController } from './controllers/create-accout.controller';
import { AuthenticateController } from './controllers/authenticate.controller';

import { RegisterUserService } from '@/domain/user/application/use-cases/register-user.service';
import { AutheticateUserUseCase } from '@/domain/user/application/use-cases/authenticate-user.service';

@Module({
  imports: [DatabaseModule, CryptograpyModule],
  controllers: [CreateAccountController, AuthenticateController],
  providers: [RegisterUserService, AutheticateUserUseCase],
})
export class HttpModule {}
