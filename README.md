# **Equipment Management SaaS**
A multi-tenant equipment tracking system for event rental companies.

## **Features**
- ✅ Multi-tenant authentication & user management
- ✅ User management with role-based permissions
- ✅ Equipment type management (full CRUD)
- ✅ Equipment management (full CRUD with status tracking)
- ✅ Audit logging and middleware system
- 📋 Event management (planned)
- 🔧 Maintenance tracking (planned)
- 👥 Team management (planned)

## **Tech Stack**
- **Backend:** NestJS, TypeScript, Prisma ORM
- **Database:** PostgreSQL with UUID primary keys
- **Authentication:** JWT with role-based access control
- **Validation:** class-validator, class-transformer
- **Architecture:** Multi-tenant SaaS with company isolation

## **API Endpoints**

### **Authentication**
- `POST /auth/register-company` - Register new company + admin user
- `POST /auth/login` - User login with JWT
- `POST /auth/invite` - Invite team members (Admin/Manager)
- `GET /auth/invitation/:token` - Get invitation details
- `POST /auth/accept-invitation/:token` - Accept invitation
- `GET /auth/me` - Current user info

### **User Management**
- `GET /users` - List company users (Admin/Manager)
- `GET /users/:id` - Get single user
- `PUT /users/profile` - Update own profile
- `PUT /users/change-password` - Change password
- `PATCH /users/:id/role` - Update user role (Admin only)
- `DELETE /users/:id` - Deactivate user (Admin only)

### **Equipment Types**
- `POST /equipment-types` - Create type (Admin/Manager)
- `GET /equipment-types` - List all types
- `GET /equipment-types/:id` - Get single type
- `PUT /equipment-types/:id` - Update type (Admin/Manager)
- `DELETE /equipment-types/:id` - Soft delete type (Admin only)

### **Equipment Management**
- `POST /equipment` - Create equipment (Admin/Manager)
- `GET /equipment` - List with filtering & pagination
- `GET /equipment/:id` - Get detailed equipment info
- `PUT /equipment/:id` - Update equipment (Admin/Manager)
- `PATCH /equipment/:id/status` - Update status only (Any user)
- `DELETE /equipment/:id` - Soft delete equipment (Admin only)

## **Key Features**
- **Multi-tenant architecture** with complete company data isolation
- **Role-based permissions** (Admin > Manager > Staff)
- **Equipment status tracking** with audit history
- **QR code generation** for equipment identification  
- **Advanced filtering** and search capabilities
- **Soft delete patterns** preserving historical data
- **Audit logging** for all user actions
- **Request rate limiting** and security middleware

## **Business Logic**
- Equipment types must be unique per company
- Serial numbers must be unique per company
- Equipment cannot be deleted if currently assigned
- All status changes create audit trail entries
- Company isolation enforced on all operations

## **Local Setup**
```bash
npm install
npm run start:dev