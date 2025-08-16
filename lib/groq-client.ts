import { Groq } from "groq-sdk"

class GroqChat {
  private groq: Groq

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set")
    }
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }

  public async chat(options: Groq.Chat.ChatCompletionCreateParams) {
    return await this.groq.chat.completions.create(options)
  }
}

export { GroqChat }
