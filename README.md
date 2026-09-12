# Bitget AI Trading Desk

Implementation workspace for the first Decision Stress Testing vertical slice.

## Current task scope

This initial implementation establishes:

- Next.js + TypeScript application shell
- runtime/domain contracts
- deterministic financial calculations
- deterministic scenario engine
- liquidity classification
- data-quality validation
- deterministic decision-policy skeleton
- rNVDA development fixture
- dependency-free core tests

The following are intentionally not implemented yet:

- Bitget live integration
- NVDA reference provider
- fresh evidence retrieval
- LLM integration
- authentication
- persistence/database
- autonomous trading
- MCP/agents

## Development checkpoint

The development page is intentionally minimal. It exists only to prove the shell and deterministic foundation before external integrations are added.

## Environment note

The application dependency manifest is present, but dependency installation and full Next.js build verification require network access to the npm registry.
