import { Controller, Get } from "@nestjs/common"
import { SkillsService } from "./agent.gateway"

@Controller("api/skills")
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  async getSkills() {
    const skills = await this.skillsService.getAllSkills()
    return { skills }
  }
}
