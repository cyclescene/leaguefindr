# Next Session: IaC & CI/CD Setup

## Overview
This session focuses on setting up Infrastructure as Code (IaC) for the backend and CI/CD pipelines for automated testing and deployment of the dashboard to Vercel.

## Current State
- ✅ Frontend refactor to Supabase client complete (feat/frontend-supabase-client merged to dev)
- ✅ Backend notifications system functional with proper RLS policies
- ✅ Admin approval/rejection workflow with decision change capability
- ✅ Dynamic skill level field (text input instead of select)
- ✅ All builds passing
- 🔲 No IaC yet (manual database management)
- 🔲 No CI/CD pipelines (manual deployment)

## Completed Work Summary

### Backend Changes
1. **League Approval/Rejection**: Allows admins to change decisions
   - Backend validates that approved leagues can't be re-approved
   - Backend validates that rejected leagues can't be re-rejected
   - But allows changing from approved → rejected and vice versa

2. **Notifications System**: Full implementation with proper permissions
   - Uses service role client to bypass RLS for backend operations
   - Sends admin notifications when leagues are submitted
   - User preferences are respected before broadcasting

3. **Form Data Handling**: Extracts sport_name and venue_name from JSONB form_data
   - Creates missing sports/venues during approval
   - Proper null checking and error handling

4. **RLS Policies**: Optimized for performance
   - Cached auth.jwt() evaluations to avoid row-by-row evaluation
   - Role-based access control using JWT claims
   - Service role client for backend operations

### Frontend Changes
1. **Supabase Client Integration**: Migrated read operations from REST API to Supabase client
   - All league, organization, draft, and template queries use Supabase directly
   - Proper JWT-based authentication and RLS enforcement

2. **UI Improvements**:
   - Truncated text fields (20 chars) with hover tooltips for org name, sport, venue, league name
   - Conditional approve/reject buttons based on league status
   - Both in table view and modal review view

3. **Dynamic Fields**: Skill level changed from select dropdown to text input
   - Allows organizations to define custom skill levels
   - Better flexibility across different organization needs

## Next Steps

### Phase 1: Backend IaC (Priority: High)
Set up infrastructure management for the backend:

1. **Database Migrations Management**
   - Supabase already has migrations in place
   - Consider using Terraform or similar to manage:
     - Database backups
     - RLS policies version control
     - Environment-specific configuration
   - Options:
     - Supabase Terraform provider (if available)
     - Custom migration deployment scripts
     - Database state management

2. **Environment Configuration**
   - Document all required environment variables
   - Set up `.env.example` template
   - Create environment-specific configuration files

3. **Backend Service Deployment**
   - Document current Go binary deployment
   - Consider containerization (Docker)
   - Set up deployment configurations

### Phase 2: Frontend CI/CD Pipeline (Priority: High)
Set up automated testing and deployment to Vercel:

1. **GitHub Actions Setup**
   - Create `.github/workflows/` directory
   - Set up workflows for:
     - Frontend build & test on PR
     - Frontend deployment to Vercel on merge to dev/main
     - Backend build & test on PR
     - Database migration validation

2. **Frontend Tests**
   - Set up basic test framework (if not present)
   - Create tests for critical components (LeagueActions, AdminLeagueReviewModal, etc.)
   - Ensure build passes before deployment

3. **Vercel Deployment**
   - Set up Vercel account and project
   - Configure environment variables in Vercel
   - Link GitHub repository
   - Set up automatic deployments:
     - Preview deploys on PR
     - Production deploy on main branch merge

4. **Environment Variables Management**
   - Supabase URL
   - Supabase anon key
   - Clerk API keys
   - Any other secrets

### Phase 3: Backend Service Deployment (Optional but Recommended)
Set up automated backend deployment:

1. **Docker Setup**
   - Create Dockerfile for Go backend
   - Set up docker-compose for local development
   - Consider deployment to:
     - Fly.io
     - Railway
     - AWS (ECS/Lambda)
     - DigitalOcean

2. **Deployment Automation**
   - GitHub Actions workflow for backend deployment
   - Health checks and monitoring
   - Rollback procedures

## Key Files to Review

### Backend
- `/backend/internal/leagues/service.go` - Approval/rejection logic with status checks
- `/backend/internal/notifications/service.go` - Notification creation and broadcasting
- `/backend/cmd/api/router.go` - Service initialization
- `/backend/supabase/migrations/` - All database schema and RLS policies

### Frontend
- `/frontend/dashboard/components/admin/AdminLeagueReviewModal.tsx` - Review modal with conditional buttons
- `/frontend/dashboard/components/admin/LeagueActions.tsx` - Table actions with status-based visibility
- `/frontend/dashboard/components/forms/AddLeagueForm.tsx` - Skill level as text input
- `/frontend/dashboard/hooks/useAdminLeagues.ts` - Admin league queries using Supabase client
- `/frontend/dashboard/hooks/useOrganizations.ts` - Organization queries using Supabase client
- `/frontend/dashboard/context/SupabaseContext.tsx` - Supabase provider initialization

## Recommended Tools & Services

### IaC Options
- **Terraform**: Industry standard for infrastructure management
  - Supabase Terraform provider available
  - Can manage multiple cloud providers
- **Pulumi**: Python/TypeScript-based IaC
  - More programmatic approach
- **CloudFormation/ARM**: If using AWS/Azure

### CI/CD Platform
- **GitHub Actions**: Already have GitHub repo, free for public/private repos
- **GitLab CI**: If switching to GitLab
- **CircleCI**: Alternative with good documentation

### Deployment Platforms
- **Vercel**: Already planning for frontend (excellent Next.js support)
- **Fly.io**: Good for containerized backends, generous free tier
- **Railway**: Simple deployment, good DX
- **DigitalOcean**: VPS + App Platform
- **AWS**: More complex but scalable

## Testing Priorities

### Frontend Tests to Implement
1. LeagueActions conditional rendering based on status
2. AdminLeagueReviewModal conditional button visibility
3. Supabase client queries return correct data
4. RLS policies prevent unauthorized access
5. Text truncation working correctly with tooltips

### Backend Tests
1. Approval validation (can't re-approve approved league)
2. Rejection validation (can't re-reject rejected league)
3. Status change (can go from approved → rejected)
4. Notification creation for all admins
5. Form data extraction and sport/venue creation

## Deployment Checklist

Before deploying to production:
- [ ] All tests passing in CI/CD
- [ ] Environment variables configured correctly
- [ ] Database migrations applied
- [ ] RLS policies enforced
- [ ] Error logging configured
- [ ] Monitoring/alerts set up
- [ ] Rollback procedure documented
- [ ] Load testing completed
- [ ] Security audit completed

## Notes for Session

- Start with GitHub Actions setup as it's free and well-integrated with repo
- Vercel integration is straightforward for Next.js projects
- Consider setting up dev and main branch deployment strategies:
  - dev → deploy to staging/preview
  - main → deploy to production
- Document all environment variables needed for each environment
- Set up proper secret management (GitHub Secrets for Actions, Vercel Environment Variables)
- Consider setting up monitoring/error tracking (Sentry, LogRocket, etc.)

## Related Issue/PRs
- Merged feat/frontend-supabase-client to dev
- All changes committed and working

---

Good luck with the IaC and CI/CD setup! This will make the project much more maintainable and deployable.
