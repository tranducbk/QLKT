# Claude Code Instructions

## Project Overview
This is a QLKT (Quản Lý Kho Thuốc) project - a pharmacy/medicine inventory management system.

## Code Style & Formatting
- Always format code with Prettier before saving
- Follow the .prettierrc configuration in the project root
- Use ESLint rules when available
- Write clean, readable, and maintainable code

## Development Workflow
- Check existing code structure before making changes
- Follow the project's architectural patterns
- Test changes thoroughly before committing
- Use proper error handling and validation

## Allowed Operations
Auto-approved commands (no confirmation needed):
- `npx prisma migrate dev` - Database migrations
- `psql` - Database operations
- `npm run init-super-admin` - Initialize admin user
- `npm run dev` - Start development server
- `lsof` & `xargs kill` - Process management
- `curl` - API testing
- `python3` - Python scripts

## Best Practices
- Use TypeScript for type safety
- Implement proper authentication and authorization
- Validate all inputs
- Handle errors gracefully
- Write meaningful commit messages
- Keep components/functions small and focused
- Document complex logic

## Git Workflow
- Only commit when explicitly requested
- Write clear commit messages
- Don't commit sensitive data (.env files, credentials)
- Review changes before committing

## API Development
- Follow RESTful conventions
- Return appropriate HTTP status codes
- Validate request payloads
- Use proper error responses
- Implement pagination for list endpoints

## Database
- Use Prisma for database operations
- Write migrations for schema changes
- Use transactions for complex operations
- Index frequently queried fields
