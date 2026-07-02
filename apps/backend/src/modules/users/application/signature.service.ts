import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { StorageService } from '../../files/storage.service';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_BYTES = 2_000_000; // 2 Mo

/**
 * Gère la signature manuscrite d'un utilisateur (image PNG stockée dans MinIO,
 * clé référencée sur le compte). Apposée ensuite sur les fiches générées.
 */
@Injectable()
export class SignatureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async set(userId: string, dataUrl: string): Promise<void> {
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length === 0) {
      throw new BadRequestException('Signature vide.');
    }
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException('Signature trop volumineuse (max 2 Mo).');
    }
    if (!this.storage.isReady()) {
      throw new ServiceUnavailableException('Stockage indisponible.');
    }

    const key = `signatures/${userId}.png`;
    await this.storage.putObject(key, buffer, 'image/png');
    await this.prisma.user.update({
      where: { id: userId },
      data: { signatureKey: key },
    });
  }

  async get(userId: string): Promise<Buffer | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { signatureKey: true },
    });
    if (!user?.signatureKey) return null;
    return this.storage.getObject(user.signatureKey);
  }

  async remove(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { signatureKey: true },
    });
    if (!user?.signatureKey) return;
    await this.storage.removeObject(user.signatureKey);
    await this.prisma.user.update({
      where: { id: userId },
      data: { signatureKey: null },
    });
  }
}
