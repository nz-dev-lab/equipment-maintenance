# Equipment Management SaaS

A multi-tenant equipment tracking system for event rental companies.

## Features
- ✅ Multi-tenant authentication & user management
- ✅ Equipment type management (CRUD)
- 🚧 Equipment tracking (in progress)
- 📋 Event management (planned)
- 🔧 Maintenance tracking (planned)

## Tech Stack
- **Backend:** NestJS, TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** JWT with role-based access
- **Validation:** class-validator

## API Endpoints
### Authentication
- `POST /auth/register-company` - Register new company
- `POST /auth/login` - User login
- `POST /auth/invite` - Invite team members

### Equipment Types
- `POST /equipment-types` - Create type (Admin/Manager)
- `GET /equipment-types` - List all types
- `PUT /equipment-types/:id` - Update type
- `DELETE /equipment-types/:id` - Delete type (Admin only)

## Local Setup
```bash
npm install
npm run dev
