import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';

/**
 * Service de stockage objet (S3 / MinIO).
 * Crée le bucket au démarrage s'il n'existe pas. Toutes les opérations sont
 * « best-effort » côté appelant : un échec de stockage ne doit pas bloquer
 * le flux métier (génération de documents, envoi d'emails…).
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client!: MinioClient;
  private bucket!: string;
  private ready = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const endpoint = this.config.get<string>('storage.endpoint') ?? 'http://localhost:9000';
    const url = new URL(endpoint);
    this.bucket = this.config.get<string>('storage.bucket') ?? 'sesur-flow';

    this.client = new MinioClient({
      endPoint: url.hostname,
      port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
      useSSL: url.protocol === 'https:',
      accessKey: this.config.get<string>('storage.accessKey') ?? 'minioadmin',
      secretKey: this.config.get<string>('storage.secretKey') ?? 'minioadmin',
    });

    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(
          this.bucket,
          this.config.get<string>('storage.region') ?? 'us-east-1',
        );
        this.logger.log(`Bucket "${this.bucket}" créé`);
      }
      this.ready = true;
      this.logger.log(`Object storage prêt (bucket=${this.bucket})`);
    } catch (err) {
      this.logger.error(
        `Object storage indisponible: ${(err as Error).message} — le stockage des documents sera ignoré`,
      );
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    if (!this.ready) return;
    await this.client.putObject(this.bucket, key, body, body.length, {
      'Content-Type': contentType,
    });
  }

  /** Récupère un objet sous forme de Buffer, ou null si absent/indisponible. */
  async getObject(key: string): Promise<Buffer | null> {
    if (!this.ready) return null;
    try {
      const stream = await this.client.getObject(this.bucket, key);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }

  /** Supprime un objet (best-effort). */
  async removeObject(key: string): Promise<void> {
    if (!this.ready) return;
    await this.client.removeObject(this.bucket, key).catch(() => undefined);
  }
}
