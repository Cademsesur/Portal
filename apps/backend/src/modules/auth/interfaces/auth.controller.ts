import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, type AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { SsoLoginUseCase } from '../application/sso-login.usecase';
import type { SsoProfile } from '../domain/sso-profile.vo';

const MS_STATE_COOKIE = 'sesur_oauth_state';
const GOOGLE_STATE_COOKIE = 'sesur_google_oauth_state';
const STATE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;
const MS_SCOPES = 'openid profile email User.Read offline_access';
const GOOGLE_SCOPES = 'openid email profile';

interface OidcTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly ssoLogin: SsoLoginUseCase,
    private readonly config: ConfigService,
  ) {}

  // ─────────────────────────── Microsoft ───────────────────────────

  @Public()
  @Get('microsoft')
  microsoftRedirect(@Res() res: Response): void {
    const { tenantId, clientId, redirectUri } = this.getEntraConfig();

    const state = randomBytes(32).toString('base64url');
    res.cookie(MS_STATE_COOKIE, state, {
      ...this.cookieBase(),
      maxAge: STATE_COOKIE_MAX_AGE_MS,
      path: '/api/v1/auth/microsoft/callback',
    });

    const authorizeUrl = new URL(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
    );
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('response_mode', 'query');
    authorizeUrl.searchParams.set('scope', MS_SCOPES);
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('prompt', 'select_account');

    res.redirect(authorizeUrl.toString());
  }

  @Public()
  @Get('microsoft/callback')
  async microsoftCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (error) {
      throw new UnauthorizedException(`Microsoft SSO error: ${error} — ${errorDescription ?? ''}`);
    }
    if (!code || !state) {
      throw new BadRequestException('Paramètres OIDC manquants (code/state)');
    }

    const cookieState = (req.cookies as Record<string, string> | undefined)?.[MS_STATE_COOKIE];
    res.clearCookie(MS_STATE_COOKIE, { path: '/api/v1/auth/microsoft/callback' });
    if (!cookieState || cookieState !== state) {
      throw new UnauthorizedException('State OIDC invalide (CSRF)');
    }

    const tokens = await this.exchangeMicrosoftCode(code);
    const profile = this.decodeMicrosoftIdToken(tokens.id_token);

    const pair = await this.ssoLogin.execute(profile);
    this.setAuthCookies(res, pair.accessToken, pair.refreshToken, pair.expiresInSec);

    const frontendUrl = this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard`);
  }

  private async exchangeMicrosoftCode(code: string): Promise<OidcTokenResponse> {
    const { tenantId, clientId, clientSecret, redirectUri } = this.getEntraConfig();

    const body = new URLSearchParams({
      client_id: clientId,
      scope: MS_SCOPES,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      client_secret: clientSecret,
    });

    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new UnauthorizedException(`Échec échange code Microsoft: ${detail}`);
    }
    return (await response.json()) as OidcTokenResponse;
  }

  private decodeMicrosoftIdToken(idToken: string): SsoProfile {
    const payload = decodeJwtPayload(idToken) as {
      oid?: string;
      preferred_username?: string;
      email?: string;
      upn?: string;
      name?: string;
    };

    const email = payload.email ?? payload.preferred_username ?? payload.upn;
    if (!payload.oid || !email) {
      throw new UnauthorizedException('Profil Microsoft incomplet (oid/email)');
    }
    return {
      provider: 'microsoft',
      providerId: payload.oid,
      email,
      displayName: payload.name ?? email,
    };
  }

  // ───────────────────────────── Google ─────────────────────────────

  @Public()
  @Get('google')
  googleRedirect(@Res() res: Response): void {
    const { clientId, redirectUri } = this.getGoogleConfig();

    const state = randomBytes(32).toString('base64url');
    res.cookie(GOOGLE_STATE_COOKIE, state, {
      ...this.cookieBase(),
      maxAge: STATE_COOKIE_MAX_AGE_MS,
      path: '/api/v1/auth/google/callback',
    });

    const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', GOOGLE_SCOPES);
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('access_type', 'offline');
    authorizeUrl.searchParams.set('prompt', 'select_account');

    res.redirect(authorizeUrl.toString());
  }

  @Public()
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (error) {
      throw new UnauthorizedException(`Google SSO error: ${error}`);
    }
    if (!code || !state) {
      throw new BadRequestException('Paramètres OIDC manquants (code/state)');
    }

    const cookieState = (req.cookies as Record<string, string> | undefined)?.[GOOGLE_STATE_COOKIE];
    res.clearCookie(GOOGLE_STATE_COOKIE, { path: '/api/v1/auth/google/callback' });
    if (!cookieState || cookieState !== state) {
      throw new UnauthorizedException('State OIDC invalide (CSRF)');
    }

    const tokens = await this.exchangeGoogleCode(code);
    const profile = this.decodeGoogleIdToken(tokens.id_token);

    const pair = await this.ssoLogin.execute(profile);
    this.setAuthCookies(res, pair.accessToken, pair.refreshToken, pair.expiresInSec);

    const frontendUrl = this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard`);
  }

  private async exchangeGoogleCode(code: string): Promise<OidcTokenResponse> {
    const { clientId, clientSecret, redirectUri } = this.getGoogleConfig();

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new UnauthorizedException(`Échec échange code Google: ${detail}`);
    }
    return (await response.json()) as OidcTokenResponse;
  }

  private decodeGoogleIdToken(idToken: string): SsoProfile {
    const payload = decodeJwtPayload(idToken) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Profil Google incomplet (sub/email)');
    }
    if (payload.email_verified === false) {
      throw new UnauthorizedException('Email Google non vérifié');
    }
    return {
      provider: 'google',
      providerId: payload.sub,
      email: payload.email,
      displayName: payload.name ?? payload.email,
    };
  }

  // ─────────────────────────────── Common ───────────────────────────

  private cookieBase(): {
    httpOnly: true;
    sameSite: 'lax' | 'none';
    secure: boolean;
  } {
    const crossSite = this.config.get<boolean>('auth.crossSite') ?? false;
    return {
      httpOnly: true,
      sameSite: crossSite ? 'none' : 'lax',
      secure: crossSite || this.isProd(),
    };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    accessTtlSec: number,
  ): void {
    const base = {
      ...this.cookieBase(),
      path: '/',
    };
    res.cookie('sesur_at', accessToken, { ...base, maxAge: accessTtlSec * 1000 });
    res.cookie('sesur_rt', refreshToken, { ...base, maxAge: 7 * 24 * 3600 * 1000 });
  }

  private getEntraConfig(): {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  } {
    const tenantId = this.config.get<string>('entra.tenantId');
    const clientId = this.config.get<string>('entra.clientId');
    const clientSecret = this.config.get<string>('entra.clientSecret');
    const redirectUri = this.config.get<string>('entra.redirectUri');
    if (!tenantId || !clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException(
        'Microsoft SSO non configuré: renseignez ENTRA_TENANT_ID, ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET, ENTRA_REDIRECT_URI dans .env',
      );
    }
    return { tenantId, clientId, clientSecret, redirectUri };
  }

  private getGoogleConfig(): {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  } {
    const clientId = this.config.get<string>('google.clientId');
    const clientSecret = this.config.get<string>('google.clientSecret');
    const redirectUri = this.config.get<string>('google.redirectUri');
    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException(
        'Google SSO non configuré: renseignez GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI dans .env',
      );
    }
    return { clientId, clientSecret, redirectUri };
  }

  private isProd(): boolean {
    return this.config.get<string>('nodeEnv') === 'production';
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie('sesur_at');
    res.clearCookie('sesur_rt');
  }
}

function decodeJwtPayload(idToken: string): Record<string, unknown> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedException('id_token invalide');
  }
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
}
