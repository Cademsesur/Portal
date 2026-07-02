import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Put,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { SignatureService } from '../application/signature.service';
import { SetSignatureDto } from '../dto/set-signature.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly signature: SignatureService) {}

  /** Enregistre / remplace la signature de l'utilisateur courant. */
  @Put('me/signature')
  @HttpCode(204)
  async setSignature(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetSignatureDto,
  ): Promise<void> {
    await this.signature.set(user.id, dto.image);
  }

  /** Renvoie l'image de signature (PNG), ou 204 si aucune. */
  @Get('me/signature')
  async getSignature(
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.signature.get(user.id);
    if (!buffer) {
      res.status(204).end();
      return;
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.end(buffer);
  }

  @Delete('me/signature')
  @HttpCode(204)
  async deleteSignature(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.signature.remove(user.id);
  }
}
