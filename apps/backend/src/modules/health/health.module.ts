import { Controller, Get, Module } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok', service: 'sesur-flow-api', timestamp: new Date().toISOString() };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
