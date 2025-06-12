# Job Management System

## Overview

The Job Management System is a comprehensive solution that allows administrators to create and manage job positions dynamically, while providing a seamless application process for candidates. This system replaces the previously hard-coded job postings with a fully dynamic, database-driven approach.

## Features

### Admin Features
- **Dynamic Job Creation**: Create, edit, and delete job positions
- **Application Management**: Review and manage job applications
- **Status Tracking**: Track application progress through different stages
- **Resume Management**: Download and view candidate resumes
- **Publishing Control**: Publish/unpublish job positions
- **Application Analytics**: View application counts per position

### Public Features
- **Dynamic Career Page**: Automatically displays published job positions
- **Job Application Form**: Comprehensive application form with file upload
- **Resume Upload**: Support for PDF, DOC, and DOCX files
- **Application Tracking**: Users can track their application status
- **Responsive Design**: Optimized for all devices

## System Architecture

### Database Schema

#### JobPosition Model
```prisma
model JobPosition {
  id           String              @id @default(cuid())
  title        String
  department   String
  location     String
  type         JobType
  description  String
  requirements String[]
  benefits     String[]
  salaryMin    Float?
  salaryMax    Float?
  isPublished  Boolean             @default(false)
  closingDate  DateTime?
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
  applications JobApplication[]
}
```

#### JobApplication Model
```prisma
model JobApplication {
  id             String                @id @default(cuid())
  jobPositionId  String
  userId         String
  firstName      String
  lastName       String
  email          String
  phone          String
  resumeUrl      String?
  coverLetter    String?
  experience     String?
  education      String?
  availability   String?
  expectedSalary String?
  status         JobApplicationStatus  @default(PENDING)
  submittedAt    DateTime              @default(now())
  reviewedAt     DateTime?
  reviewedBy     String?
  notes          String?
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt
  jobPosition    JobPosition           @relation(fields: [jobPositionId], references: [id], onDelete: Cascade)
  user           User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviewer       User?                 @relation("JobApplicationReviewer", fields: [reviewedBy], references: [id])
}
```

### API Endpoints

#### Job Positions
- `GET /api/jobs` - Get all published jobs (public) or all jobs (admin)
- `POST /api/jobs` - Create new job position (admin only)
- `GET /api/jobs/[id]` - Get specific job position
- `PATCH /api/jobs/[id]` - Update job position (admin only)
- `DELETE /api/jobs/[id]` - Delete job position (admin only)

#### Job Applications
- `GET /api/jobs/applications` - Get applications (admin: all, user: own)
- `POST /api/jobs/applications` - Submit job application
- `GET /api/jobs/applications/[id]` - Get specific application
- `PATCH /api/jobs/applications/[id]` - Update application status (admin only)

#### File Upload
- `POST /api/upload` - Upload resume files (PDF, DOC, DOCX)

## File Structure

```
src/
├── app/
│   ├── careers/
│   │   ├── page.tsx                    # Public careers page
│   │   └── [id]/
│   │       └── page.tsx                # Individual job application page
│   ├── admin/
│   │   └── jobs/
│   │       ├── page.tsx                # Job management dashboard
│   │       └── applications/
│   │           └── page.tsx            # Application management
│   └── api/
│       ├── jobs/
│       │   ├── route.ts                # Job CRUD operations
│       │   ├── [id]/
│       │   │   └── route.ts            # Individual job operations
│       │   └── applications/
│       │       ├── route.ts            # Application operations
│       │       └── [id]/
│       │           └── route.ts        # Individual application operations
│       └── upload/
│           └── route.ts                # File upload handler
├── components/
│   ├── admin/
│   │   ├── JobsManagement.tsx          # Admin job management interface
│   │   └── JobApplicationsManagement.tsx # Admin application management
│   └── careers/
│       └── JobApplicationForm.tsx      # Public application form
```

## Usage Guide

### For Administrators

#### Creating a Job Position
1. Navigate to `/admin/jobs`
2. Click "Create Job" button
3. Fill in job details:
   - Title, Department, Location
   - Job Type (Full Time, Part Time, Contract, Internship, Remote)
   - Description and Requirements
   - Optional: Benefits, Salary Range, Closing Date
4. Choose to publish immediately or save as draft
5. Click "Create Job"

#### Managing Applications
1. Navigate to `/admin/jobs/applications`
2. Filter applications by status or job position
3. Click "View Details" to see full application
4. Update application status:
   - Pending → Reviewing → Interviewed → Offered → Accepted/Rejected
5. Add notes for internal tracking
6. Download resumes for review

#### Job Position Management
- **Edit**: Click edit button to modify job details
- **Publish/Unpublish**: Toggle visibility on careers page
- **Delete**: Remove job (only if no applications exist)
- **View Applications**: Direct link to applications for specific job

### For Job Applicants

#### Applying for a Position
1. Visit `/careers` to view open positions
2. Click "Apply Now" on desired position
3. Sign in or create account
4. Fill application form:
   - Personal information
   - Upload resume (PDF, DOC, DOCX)
   - Cover letter and experience details
   - Availability and salary expectations
5. Submit application

#### Tracking Application Status
- Applications are tracked in user's account
- Status updates: Pending → Reviewing → Interviewed → Offered → Accepted/Rejected

## Security Features

### Authentication & Authorization
- Admin-only access to job management features
- User authentication required for job applications
- Role-based access control (ADMIN, USER)

### Data Validation
- Zod schema validation for all API endpoints
- File type and size validation for uploads
- Input sanitization and validation

### Privacy Protection
- Users can only view their own applications
- Admins have full access for management purposes
- Secure file storage for resumes

## Technical Implementation

### Frontend Technologies
- **Next.js 14**: App Router, Server Components
- **TypeScript**: Type safety and better development experience
- **Tailwind CSS**: Responsive design and styling
- **Shadcn/ui**: Consistent UI components
- **React Hook Form**: Form handling and validation

### Backend Technologies
- **Prisma**: Database ORM and migrations
- **PostgreSQL**: Primary database
- **NextAuth.js**: Authentication and session management
- **Zod**: Runtime validation and type safety

### File Upload System
- Support for PDF, DOC, DOCX formats
- File size limits (5MB for resumes)
- Secure file storage with generated URLs
- File type validation and error handling

## Integration with Existing Systems

### Vendor Application System
The job management system coexists with the existing vendor application functionality on the careers page. The vendor application section remains unchanged and fully functional.

### User Management
- Integrates with existing user authentication system
- Uses existing user roles and permissions
- Leverages current user profile data

### Admin Dashboard
- New "Jobs" section added to admin navigation
- Consistent styling with existing admin components
- Follows established admin UI patterns

## Future Enhancements

### Potential Features
1. **Email Notifications**: Automatic emails for application status updates
2. **Interview Scheduling**: Built-in calendar integration
3. **Application Analytics**: Detailed reporting and metrics
4. **Bulk Actions**: Mass status updates and communications
5. **Application Templates**: Predefined application forms per job type
6. **Reference System**: Contact and verify references
7. **Skills Assessment**: Built-in testing capabilities
8. **Video Interviews**: Integrated video calling
9. **AI Screening**: Automated initial screening based on criteria
10. **Mobile App**: Dedicated mobile application for job seekers

### Scalability Considerations
- Database indexing for large volumes of applications
- File storage optimization for resume management
- Caching strategies for public job listings
- API rate limiting for public endpoints

## Maintenance and Monitoring

### Regular Tasks
- Monitor application volumes and response times
- Clean up expired job postings
- Archive old applications based on retention policy
- Update file storage and cleanup unused files

### Backup and Recovery
- Regular database backups including job and application data
- File storage backup for uploaded resumes
- Recovery procedures for data restoration

## Troubleshooting

### Common Issues

#### Upload Failures
- Check file format (PDF, DOC, DOCX only)
- Verify file size (max 5MB)
- Ensure upload API route is functioning
- Check file permissions and storage configuration

#### Application Submission Errors
- Verify user authentication
- Check required field validation
- Ensure job position is published and not expired
- Validate email format and phone number

#### Admin Access Issues
- Confirm user has ADMIN role
- Check session authentication
- Verify API endpoint permissions

## Performance Optimization

### Database Optimization
- Indexed fields: `isPublished`, `department`, `type`, `closingDate`
- Efficient queries with proper includes and selects
- Pagination for large result sets

### Frontend Optimization
- Server-side rendering for SEO
- Optimized images and file loading
- Lazy loading for application lists
- Efficient state management

## Testing Strategy

### Unit Tests
- API endpoint testing
- Form validation testing
- File upload functionality
- Database operations

### Integration Tests
- End-to-end application flow
- Admin management workflows
- User application process
- Authentication and authorization

### User Acceptance Testing
- Admin user experience
- Job applicant experience
- Mobile responsiveness
- Cross-browser compatibility

---

*This documentation was created on December 12, 2024. For updates or questions, please refer to the development team or create an issue in the project repository.*
