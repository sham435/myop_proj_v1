---
name: test
description: Creates and improves tests for code.
context: inline
builtin: true
allowed_tools:
  - read
  - glob
  - edit
  - write
---

# Test Skill

Create and improve tests for code.

## When to Use

- When user asks to add tests
- When fixing bugs (write failing test first)
- When improving test coverage
- When reviewing existing tests

## Process

1. **Identify code under test** - Find what needs testing
2. **Understand behavior** - Know expected inputs/outputs
3. **Check existing tests** - See testing patterns used
4. **Write tests** - Cover happy path and edge cases
5. **Verify** - Run tests to ensure they pass

## Test Structure

```typescript
describe('functionName', () => {
  it('should do X when Y', () => {
    // Arrange
    const input = ...

    // Act
    const result = functionName(input)

    // Assert
    expect(result).toBe(...)
  })
})
```

## What to Test

| Priority | Type           | Examples                    |
| -------- | -------------- | --------------------------- |
| High     | Unit tests     | Pure functions, utilities   |
| High     | Edge cases     | Empty input, null, extremes |
| Medium   | Integration    | Component interactions      |
| Low      | Snapshot tests | UI rendering                |

## Guidelines

- Test behavior, not implementation
- One assertion per test when practical
- Use descriptive test names
- Arrange-Act-Assert pattern
- Test edge cases and error conditions
- Mock external dependencies
- Keep tests fast and isolated
