import type { BaseChatModel } from "@langchain/core/language_models/chat_models"
import { ChatOllama } from "@langchain/ollama"
import { ChatOpenAI } from "@langchain/openai"

import { config } from "./config.js"

/**
 * Turn a "provider:model" spec into something createDeepAgent accepts.
 * Local providers get explicit clients; hosted ones are passed through as
 * strings and resolved by LangChain's initChatModel.
 */
export function resolveModel(spec: string): BaseChatModel | string {
  const separator = spec.indexOf(":")
  const provider = spec.slice(0, separator)
  // Model names may contain colons themselves, e.g. "qwen3:32b"
  const model = spec.slice(separator + 1)

  switch (provider) {
    case "ollama":
      return new ChatOllama({
        model,
        baseUrl: config.OLLAMA_BASE_URL,
        numCtx: config.OLLAMA_NUM_CTX,
        keepAlive: config.OLLAMA_KEEP_ALIVE,
      })
    case "openai-compatible":
      return new ChatOpenAI({
        model,
        // Local servers usually ignore the key, but the client requires one
        apiKey: config.OPENAI_COMPATIBLE_API_KEY || "not-needed",
        configuration: { baseURL: config.OPENAI_COMPATIBLE_BASE_URL },
        // Local servers implement Chat Completions, not the Responses API
        useResponsesApi: false,
      })
    default:
      return spec
  }
}
