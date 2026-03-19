---
name: refactor
description: Refactors code to improve readability, performance, or maintainability.
context: inline
builtin: true
allowed_tools:
  - read
  - edit
  - write
---

# Refactor Code Skill

Refactor code to improve quality without changing behavior.

## When to Use

- When code is difficult to read or understand
- When there are code smells or anti-patterns
- When simplifying complex logic
- When improving performance bottlenecks
- When reducing code duplication

## Process

1. **Read and understand** - Thoroughly understand the existing code
2. **Identify issues** - Find code smells, duplication, complexity
3. **Plan refactor** - Determine the safest approach
4. **Make changes** - Apply refactoring in small steps
5. **Verify** - Ensure behavior unchanged

## Common Refactorings

| Issue                | Refactor                        |
| -------------------- | ------------------------------- |
| Long function        | Extract to smaller functions    |
| Duplicated code      | Extract to shared function      |
| Magic numbers        | Extract to constants            |
| Complex conditionals | Extract to well-named variables |
| Nested conditionals  | Use early returns               |
| Long parameter list  | Group into objects              |

## Guidelines

- Make one change at a time
- Keep functions small and focused (ideally < 30 lines)
- Use meaningful variable/function names
- Remove dead code
- Add comments only when intent is unclear
- Preserve behavior - don't change what the code does
