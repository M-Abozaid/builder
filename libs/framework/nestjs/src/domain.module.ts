import { AppModule } from '@codelab/modules/app-api'
import { AtomModule } from '@codelab/modules/atom-api'
import { LambdaApiModule } from '@codelab/modules/lambda-api'
import { PageModule } from '@codelab/modules/page-api'
import { PageElementModule } from '@codelab/modules/page-element-api'
import { PropModule } from '@codelab/modules/prop-api'
import { TypeModule } from '@codelab/modules/type-api'
import { UserModule } from '@codelab/modules/user-api'
import { ValueTypeModule } from '@codelab/modules/value-type-api'
import { Module } from '@nestjs/common'

@Module({
  imports: [
    AppModule,
    LambdaApiModule,
    UserModule,
    PageModule,
    PageElementModule,
    AtomModule,
    ValueTypeModule,
    PropModule,
    TypeModule,
  ],
})
export class DomainModule {}
