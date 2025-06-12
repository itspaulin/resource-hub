import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validations.pipe';
import { z } from 'zod';
import { AutheticateUserUseCase } from '@/domain/user/application/use-cases/authenticate-user.service';
import { UserAlreadyExistsError } from '@/domain/user/application/use-cases/errors/user-already-exists';
import { Public } from '@/infra/auth/public';

const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>;

@Controller('/sessions')
@Public()
export class AuthenticateController {
  constructor(private authenticateUser: AutheticateUserUseCase) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const { email, password } = body;

    const result = await this.authenticateUser.execute({ email, password });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case UserAlreadyExistsError:
          throw new ConflictException(error.message);

        default:
          throw new BadRequestException(error.message);
      }
    }

    const { accessToken } = result.value;

    return {
      access_token: accessToken,
    };
  }
}
