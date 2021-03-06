import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Ax, Attachment } from '@leaa/common/src/entrys';
import { AxResolver } from '@leaa/api/src/modules/ax/ax.resolver';
import { AxService } from '@leaa/api/src/modules/ax/ax.service';
import { AxProperty } from '@leaa/api/src/modules/ax/ax.property';
import { AttachmentModule } from '@leaa/api/src/modules/attachment/attachment.module';
import { AuthTokenModule } from '@leaa/api/src/modules/auth-token/auth-token.module';

// TIPS!
// ax === ad (advertising), avoid word 'ad' being blocked by adblock.

@Module({
  imports: [TypeOrmModule.forFeature([Ax, Attachment]), AuthTokenModule, AttachmentModule],
  providers: [AxResolver, AxService, AxProperty],
  exports: [AxService],
})
export class AxModule {}
