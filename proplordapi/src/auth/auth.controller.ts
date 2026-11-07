import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LoginDTO, RefreshDTO, SignupDTO } from './auth.dto';
import { Auth, Authed, type AuthContext } from './auth.guard';
import { AuthService } from './auth.service';

const strict = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Creates a landlord account. Tenants join through invitations or landlord-created logins. */
  @Throttle(strict)
  @Post('signup')
  signup(@Body() dto: SignupDTO) {
    return this.auth.signup(dto);
  }

  @Throttle(strict)
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDTO) {
    return this.auth.login(dto.identifier, dto.password);
  }

  @Throttle(strict)
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshDTO) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Authed()
  @Get('me')
  me(@Auth() ctx: AuthContext) {
    return this.auth.profile(ctx.token, ctx.userId);
  }
}
