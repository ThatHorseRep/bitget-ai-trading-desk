import type { EvidenceProvider } from "../evidence/types";
import { CompositeEvidenceProvider } from "../evidence/provider";
import { ResearchProviderRegistry } from "./registry";
import { LegacyEvidenceProviderAdapter } from "./legacyAdapter";
import { BitgetUsEquityMcpProvider } from "./bitgetUsEquityMcpProvider";
import { BitgetSignalAgentBridge } from "./bitgetSignalAgentBridge";
import { BitgetSignalProvider } from "./bitgetSignalProvider";
import type { ResearchProvider } from "./types";

/**
 * PRE24-01 — Optional external research provider composition root.
 *
 * This is the single authoritative place where the optional external
 * research providers are assembled for production use. Each provider
 * occupies an explicit, documented slot:
 *
 * 1. current evidence provider (legacy Yahoo-backed evidence, adapted) — live;
 * 2. Bitget US Equity MCP provider (PRE24-02) — endpoint reachability unproven,
 *    degrades gracefully to [] when unreachable;
 * 3. Bitget Signal provider (PRE24-03) — default is the DOCUMENTED
 *    programmatic path: Bitget's public market-data MCP server over HTTP
 *    (datahub.noxiaohao.com/mcp, registered by @bitget-ai/bitget-signal;
 *    no credentials). The AI-host file bridge (bitgetSignalAgentBridge)
 *    remains available as an opt-in alternative for environments where the
 *    five Skills run inside an AI host that writes observations to disk;
 *    pass `signalBridgePath` to select it.
 * 4. Chainbase AgentKey provider — RESERVED SLOT. The provider is not
 *    implemented yet; when it exists it must implement ResearchProvider and
 *    can be registered here without touching the core or the service.
 *
 * Every slot is optional at the type level: a caller may pass `undefined`
 * (or the provider itself may be omitted via the `providers` override) and
 * the registry simply contains fewer providers. Absent providers are a
 * supported, first-class state — the workflow proceeds with whatever
 * evidence remains.
 */

export interface DefaultResearchRegistryOptions {
  /**
   * Backing evidence provider for the legacy slot. Defaults to the
   * production CompositeEvidenceProvider when omitted.
   */
  evidenceProvider?: EvidenceProvider;
  /**
   * Bitget US Equity MCP endpoint override (testing/seam). Omit for the
   * documented default endpoint.
   */
  usEquityMcpEndpoint?: string;
  /**
   * Bitget Signal MCP endpoint override (testing/seam). Omit for the
   * documented default endpoint from @bitget-ai/bitget-signal.
   */
  signalMcpEndpoint?: string;
  /**
   * Full override of the Bitget Signal slot (testing/seam). When set, it
   * replaces both the live MCP provider and the AI-host bridge.
   */
  signalProvider?: ResearchProvider;
  /**
   * Bitget Signal bridge file name override (testing/seam). When set, the
   * slot uses the AI-host file bridge instead of the live MCP provider.
   */
  signalBridgePath?: string;
  /**
   * The Chainbase AgentKey provider slot. Not implemented yet — the type
   * exists so the composition is explicit and the slot is documented.
   * When the real provider lands, wire it here; the core never changes.
   */
  chainbaseProvider?: ResearchProvider;
  /**
   * Full override: when provided, these providers replace the default set
   * entirely (used by tests to prove absence/failure/isolation semantics).
   */
  providers?: ResearchProvider[];
}

/**
 * Build the default research provider registry used by DecisionDeskService.
 *
 * Behavior is identical to the previous inline construction in the service
 * constructor — this factory only makes the slots explicit and adds the
 * reserved Chainbase slot so future providers plug in without core changes.
 */
export function createDefaultResearchRegistry(
  options: DefaultResearchRegistryOptions = {},
): ResearchProviderRegistry {
  const registry = new ResearchProviderRegistry();

  if (options.providers) {
    for (const provider of options.providers) {
      registry.register(provider);
    }
    return registry;
  }

  // Slot 1 — current evidence provider (legacy adapter over the composite).
  registry.register(
    new LegacyEvidenceProviderAdapter(options.evidenceProvider ?? new CompositeEvidenceProvider()),
  );

  // Slot 2 — Bitget US Equity MCP provider.
  registry.register(new BitgetUsEquityMcpProvider(options.usEquityMcpEndpoint));

  // Slot 3 — Bitget Signal provider. Default: the documented programmatic
  // MCP path. Opt-in: the AI-host file bridge (pass signalBridgePath), or a
  // fully custom provider (pass signalProvider, e.g. tests).
  if (options.signalProvider) {
    registry.register(options.signalProvider);
  } else if (options.signalBridgePath) {
    registry.register(new BitgetSignalAgentBridge(options.signalBridgePath));
  } else {
    registry.register(new BitgetSignalProvider(options.signalMcpEndpoint));
  }

  // Slot 4 — Chainbase AgentKey provider (reserved; not implemented yet).
  if (options.chainbaseProvider) {
    registry.register(options.chainbaseProvider);
  }

  return registry;
}
