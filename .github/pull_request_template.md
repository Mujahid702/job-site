## Pull Request Template

### Description
Provide a summary of the changes, the problem statement solved, and context.
- What issue is resolved?
- What are the architectural implications of this change?

### Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation Update
- [ ] Code Refactoring / Performance Optimization

### Implementation Details
List any files created, deleted, or heavily modified:
- Created:
- Modified:

### Database Changes
Does this PR introduce any database schema, function, index, RLS policy, or seeding updates?
- [ ] Yes (attach SQL files / explain the migration)
- [ ] No
*If yes, list the relevant migration file names: e.g. `supabase_*.sql`*

### API Changes
Does this PR add, remove, or modify any API routes?
- [ ] Yes
- [ ] No
*If yes, list affected endpoints, input parameters, and response updates.*

### Verification & Testing
Describe the tests that you ran to verify your changes. Provide instructions so we can reproduce.
- [ ] TypeScript Check: `npx tsc --noEmit` compiles successfully
- [ ] Local build runs successfully: `npm run build` succeeds
- [ ] Visual UI verified (responsive layout, hover effects, dark/light modes check)

### Checklist
- [ ] My code follows the [Coding Guidelines](file:///docs/CODING_GUIDELINES.md) of this project.
- [ ] I have updated the documentation (/docs) to reflect my changes.
- [ ] I have updated the Module Status Tracker if completion % changed.
- [ ] I have verified that no environment variables are leaked in logs/code.
- [ ] No duplicate logic has been introduced.

### Reviewer Notes
Any special instructions, notes, or credentials to test this work.
