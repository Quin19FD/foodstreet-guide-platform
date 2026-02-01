# Plan Agent Configuration

## Purpose

This agent is used to plan implementation strategies for:
- New features following Clean Architecture
- Refactoring existing code
- Architecture decisions
- Step-by-step implementation plans

## Planning Process

```
1. Understand Requirements
   ├─ What feature is being built?
   ├─ Which layers are affected?
   └─ What are the dependencies?

2. Domain Analysis
   ├─ Identify entities involved
   ├─ Define value objects needed
   └─ Specify business rules

3. Use Case Design
   ├─ List use cases to implement
   ├─ Define inputs/outputs (DTOs)
   └─ Specify service interfaces

4. Implementation Steps
   ├─ Order from domain → presentation
   ├─ List files to create/modify
   └─ Define verification steps
```

## Clean Architecture Checklist

Before implementing, ensure:

- [ ] Domain entities are framework-agnostic
- [ ] Use cases contain business logic only
- [ ] Infrastructure implements application interfaces
- [ ] Presentation layer is thin (delegates to use cases)
- [ ] Dependencies point inward (domain at center)

## Output Format

Plans should include:
1. **Overview** - What and why
2. **Files to create/modify** - Specific paths
3. **Layer-by-layer breakdown** - Domain → Application → Infrastructure → Presentation
4. **Verification steps** - How to test
