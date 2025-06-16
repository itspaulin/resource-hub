import {
  Body,
  Controller,
  Post,
  UsePipes,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validations.pipe';
import { RegisterUserService } from '@/domain/user/application/use-cases/register-user.service';
import { WrongCredentialsError } from '@/domain/user/application/use-cases/errors/wrong-credentials-error';
import { Public } from '@/infra/auth/public';

const createAccountBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
});

type CreateAccountSchema = z.infer<typeof createAccountBodySchema>;

@Controller('/accounts')
@Public()
export class CreateAccountController {
  constructor(private readonly registerUserService: RegisterUserService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(@Body() body: CreateAccountSchema) {
    const { name, email, password } = createAccountBodySchema.parse(body);

    const result = await this.registerUserService.execute({
      name,
      email,
      password,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message);

        default:
          throw new BadRequestException(error.message);
      }
    }
  }
}
