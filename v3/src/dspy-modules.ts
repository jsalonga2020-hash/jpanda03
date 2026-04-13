/**
 * @module dspy-modules
 * dspy.ts integration for ezra v3 — ReAct and ProgramOfThought modules
 * for enhanced agent reasoning capabilities.
 */
import {
  ReAct,
  ProgramOfThought,
  ChainOfThought,
  configureLM,
  AnthropicLM,
  OpenAILM,
} from 'dspy.ts/dist/src';

export interface DspyModuleConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model?: string;
}

let configured = false;

/** Initialize dspy LM (call once at startup) */
export function initDspyModules(config: DspyModuleConfig): void {
  if (configured) return;
  if (config.provider === 'anthropic') {
    configureLM(new AnthropicLM({
      apiKey: config.apiKey,
      model: config.model || 'claude-sonnet-4-5-20250929',
    }));
  } else {
    configureLM(new OpenAILM({
      apiKey: config.apiKey,
      model: config.model || 'gpt-4o-mini',
    }));
  }
  configured = true;
}

/**
 * ReAct module for tool-using agents.
 * Replaces manual ReAct prompt patterns in ezra agent definitions.
 * Provides structured Thought → Action → Observation loops.
 */
export function createReActAgent(options: {
  tools: Array<{ name: string; description: string; execute: (input: string) => Promise<string> }>;
  signature?: string;
  maxIterations?: number;
}): InstanceType<typeof ReAct> {
  return new ReAct({
    signature: options.signature || 'task -> result',
    tools: options.tools,
    maxIterations: options.maxIterations || 5,
  });
}

/**
 * ProgramOfThought module for the architect agent.
 * Generates structured execution plans as code-like pseudocode.
 */
export function createPlannerModule(instructions?: string): InstanceType<typeof ProgramOfThought> {
  return new ProgramOfThought({
    signature: 'task, context -> plan, steps, dependencies',
    instructions: instructions ||
      'Break down the task into a structured execution plan. ' +
      'Identify parallel vs sequential steps, agent assignments, and data dependencies. ' +
      'Output plan as structured text, steps as numbered list, dependencies as DAG edges.',
  });
}

/**
 * ChainOfThought module for any agent needing step-by-step reasoning.
 */
export function createReasoningModule(signature: string, instructions?: string): InstanceType<typeof ChainOfThought> {
  return new ChainOfThought({
    signature,
    instructions: instructions || 'Think step by step to produce a thorough, accurate response.',
  });
}
