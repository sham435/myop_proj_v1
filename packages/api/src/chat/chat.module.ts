import { Module } from "@nestjs/common"
import { HttpModule } from "@nestjs/axios"
import { ChatController } from "./chat.controller"
import { SkillsController } from "./skills.controller"
import { OpenRouterService } from "./openrouter.service"
import { ZhipuService } from "./zhipu.service"
import { AgentGateway } from "./agent.gateway"
import { SkillsService } from "./agent.gateway"

@Module({
  imports: [HttpModule.register({ timeout: 30000 })],
  controllers: [ChatController, SkillsController],
  providers: [OpenRouterService, ZhipuService, AgentGateway, SkillsService],
  exports: [SkillsService],
})
export class ChatModule {}
