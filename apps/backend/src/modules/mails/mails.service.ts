import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: MailAttachment[];
}

@Injectable()
export class MailsService implements OnModuleInit {
  private readonly logger = new Logger(MailsService.name);
  private transporter!: Transporter;
  private from!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const host = this.config.get<string>('mail.smtpHost') ?? 'localhost';
    const port = this.config.get<number>('mail.smtpPort') ?? 1025;
    const user = this.config.get<string | undefined>('mail.smtpUser');
    const password = this.config.get<string | undefined>('mail.smtpPassword');
    const secure = this.config.get<boolean>('mail.smtpSecure') ?? false;
    this.from = this.config.get<string>('mail.from') ?? 'noreply@sesur.bj';

    const hasAuth = Boolean(user && password);
    const isMailhog = host === 'localhost' && port === 1025;
    const fromName = this.config.get<string | undefined>('mail.fromName');
    if (fromName) {
      this.from = `"${fromName}" <${this.from}>`;
    }

    this.transporter = createTransport({
      host,
      port,
      secure,
      requireTLS: !secure && hasAuth,
      ignoreTLS: !secure && !hasAuth,
      auth: hasAuth ? { user: user!, pass: password! } : undefined,
      logger: true,
      debug: true,
    });
    this.logger.log(
      `Mailer configured: host=${host} port=${port} secure=${secure} auth=${hasAuth ? user : 'off'} from=${this.from}`,
    );
    if (isMailhog) {
      this.logger.warn(
        'SMTP host=localhost:1025 → mails captured by MailHog, NOT delivered to real inboxes. View at http://localhost:8025',
      );
    }
    this.transporter.verify().then(
      () => this.logger.log('SMTP connection verified ✓'),
      (err) => this.logger.error(`SMTP connection FAILED: ${err.message}`, err.stack),
    );
  }

  async send(input: SendMailInput): Promise<void> {
    this.logger.log(`→ Sending mail to ${input.to} subject="${input.subject}"`);
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
      this.logger.log(
        `✓ Mail sent to ${input.to} | messageId=${info.messageId} | accepted=[${info.accepted?.join(',')}] | rejected=[${info.rejected?.join(',')}] | response=${info.response}`,
      );
    } catch (err) {
      const e = err as Error;
      this.logger.error(`✗ Mail to ${input.to} FAILED: ${e.message}`, e.stack);
      throw err;
    }
  }
}
