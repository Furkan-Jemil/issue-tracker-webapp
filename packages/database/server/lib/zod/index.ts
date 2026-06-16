import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.NullTypes.DbNull;
  if (v === 'JsonNull') return Prisma.NullTypes.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.string(), z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.any() }),
    z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const PermissionScalarFieldEnumSchema = z.enum(['id','role','action','subject','inverted','createdAt','updatedAt']);

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','image','password','role','createdAt','updatedAt']);

export const SessionScalarFieldEnumSchema = z.enum(['id','userId','token','expiresAt','createdAt','updatedAt','ipAddress','userAgent']);

export const AccountScalarFieldEnumSchema = z.enum(['id','userId','accountId','providerId','accessToken','refreshToken','accessTokenExpiresAt','refreshTokenExpiresAt','scope','idToken','password','createdAt','updatedAt']);

export const VerificationScalarFieldEnumSchema = z.enum(['id','identifier','value','expiresAt','createdAt','updatedAt']);

export const IssueScalarFieldEnumSchema = z.enum(['id','title','description','type','priority','severity','url','sourceNotes','reportedAt','status','createdBy','assigneeId','createdAt','updatedAt']);

export const ScreenshotScalarFieldEnumSchema = z.enum(['id','issueId','url','filename','mimeType','sizeBytes','order','createdAt']);

export const AttachmentScalarFieldEnumSchema = z.enum(['id','issueId','uploaderId','url','filename','mimeType','sizeBytes','order','createdAt']);

export const CommentScalarFieldEnumSchema = z.enum(['id','issueId','userId','content','createdAt']);

export const IssueHistoryScalarFieldEnumSchema = z.enum(['id','issueId','actorId','eventType','description','metadata','createdAt']);

export const NotificationScalarFieldEnumSchema = z.enum(['id','userId','issueId','message','isRead','createdAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema: z.ZodType<Prisma.NullableJsonNullValueInput> = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema: z.ZodType<Prisma.JsonNullValueFilter> = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const RoleSchema = z.enum(['USER','TESTER','ADMIN']);

export type RoleType = `${z.infer<typeof RoleSchema>}`

export const IssueStatusSchema = z.enum(['OPEN','IN_PROGRESS','RESOLVED','CLOSED']);

export type IssueStatusType = `${z.infer<typeof IssueStatusSchema>}`

export const PrioritySchema = z.enum(['LOW','MEDIUM','HIGH']);

export type PriorityType = `${z.infer<typeof PrioritySchema>}`

export const SeveritySchema = z.enum(['MINOR','MAJOR','CRITICAL']);

export type SeverityType = `${z.infer<typeof SeveritySchema>}`

export const IssueTypeSchema = z.enum(['BUG','IMPROVEMENT']);

export type IssueTypeType = `${z.infer<typeof IssueTypeSchema>}`

export const HistoryEventSchema = z.enum(['CREATED','STATUS_CHANGED','UPDATED','COMMENTED']);

export type HistoryEventType = `${z.infer<typeof HistoryEventSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// PERMISSION SCHEMA
/////////////////////////////////////////

export const PermissionSchema = z.object({
  role: RoleSchema,
  id: z.uuid(),
  action: z.string(),
  subject: z.string(),
  inverted: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Permission = z.infer<typeof PermissionSchema>

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  role: RoleSchema,
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  password: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
})

export type Session = z.infer<typeof SessionSchema>

/////////////////////////////////////////
// ACCOUNT SCHEMA
/////////////////////////////////////////

export const AccountSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  accessTokenExpiresAt: z.coerce.date().nullable(),
  refreshTokenExpiresAt: z.coerce.date().nullable(),
  scope: z.string().nullable(),
  idToken: z.string().nullable(),
  password: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Account = z.infer<typeof AccountSchema>

/////////////////////////////////////////
// VERIFICATION SCHEMA
/////////////////////////////////////////

export const VerificationSchema = z.object({
  id: z.uuid(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Verification = z.infer<typeof VerificationSchema>

/////////////////////////////////////////
// ISSUE SCHEMA
/////////////////////////////////////////

export const IssueSchema = z.object({
  type: IssueTypeSchema,
  priority: PrioritySchema,
  severity: SeveritySchema,
  status: IssueStatusSchema,
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  url: z.string().nullable(),
  sourceNotes: z.string().nullable(),
  reportedAt: z.coerce.date().nullable(),
  createdBy: z.string(),
  assigneeId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Issue = z.infer<typeof IssueSchema>

/////////////////////////////////////////
// SCREENSHOT SCHEMA
/////////////////////////////////////////

export const ScreenshotSchema = z.object({
  id: z.uuid(),
  issueId: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int(),
  createdAt: z.coerce.date(),
})

export type Screenshot = z.infer<typeof ScreenshotSchema>

/////////////////////////////////////////
// ATTACHMENT SCHEMA
/////////////////////////////////////////

export const AttachmentSchema = z.object({
  id: z.uuid(),
  issueId: z.string(),
  uploaderId: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int(),
  createdAt: z.coerce.date(),
})

export type Attachment = z.infer<typeof AttachmentSchema>

/////////////////////////////////////////
// COMMENT SCHEMA
/////////////////////////////////////////

export const CommentSchema = z.object({
  id: z.uuid(),
  issueId: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.coerce.date(),
})

export type Comment = z.infer<typeof CommentSchema>

/////////////////////////////////////////
// ISSUE HISTORY SCHEMA
/////////////////////////////////////////

export const IssueHistorySchema = z.object({
  eventType: HistoryEventSchema,
  id: z.uuid(),
  issueId: z.string(),
  actorId: z.string(),
  description: z.string(),
  metadata: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
})

export type IssueHistory = z.infer<typeof IssueHistorySchema>

/////////////////////////////////////////
// NOTIFICATION SCHEMA
/////////////////////////////////////////

export const NotificationSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  issueId: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.coerce.date(),
})

export type Notification = z.infer<typeof NotificationSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// PERMISSION
//------------------------------------------------------

export const PermissionSelectSchema: z.ZodType<Prisma.PermissionSelect> = z.object({
  id: z.boolean().optional(),
  role: z.boolean().optional(),
  action: z.boolean().optional(),
  subject: z.boolean().optional(),
  inverted: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  sessions: z.union([z.boolean(),z.lazy(() => SessionFindManyArgsSchema)]).optional(),
  accounts: z.union([z.boolean(),z.lazy(() => AccountFindManyArgsSchema)]).optional(),
  issues: z.union([z.boolean(),z.lazy(() => IssueFindManyArgsSchema)]).optional(),
  assignedIssues: z.union([z.boolean(),z.lazy(() => IssueFindManyArgsSchema)]).optional(),
  attachments: z.union([z.boolean(),z.lazy(() => AttachmentFindManyArgsSchema)]).optional(),
  comments: z.union([z.boolean(),z.lazy(() => CommentFindManyArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  historyActions: z.union([z.boolean(),z.lazy(() => IssueHistoryFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  sessions: z.boolean().optional(),
  accounts: z.boolean().optional(),
  issues: z.boolean().optional(),
  assignedIssues: z.boolean().optional(),
  attachments: z.boolean().optional(),
  comments: z.boolean().optional(),
  notifications: z.boolean().optional(),
  historyActions: z.boolean().optional(),
}).strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  email: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  image: z.boolean().optional(),
  password: z.boolean().optional(),
  role: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  sessions: z.union([z.boolean(),z.lazy(() => SessionFindManyArgsSchema)]).optional(),
  accounts: z.union([z.boolean(),z.lazy(() => AccountFindManyArgsSchema)]).optional(),
  issues: z.union([z.boolean(),z.lazy(() => IssueFindManyArgsSchema)]).optional(),
  assignedIssues: z.union([z.boolean(),z.lazy(() => IssueFindManyArgsSchema)]).optional(),
  attachments: z.union([z.boolean(),z.lazy(() => AttachmentFindManyArgsSchema)]).optional(),
  comments: z.union([z.boolean(),z.lazy(() => CommentFindManyArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  historyActions: z.union([z.boolean(),z.lazy(() => IssueHistoryFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// SESSION
//------------------------------------------------------

export const SessionIncludeSchema: z.ZodType<Prisma.SessionInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const SessionArgsSchema: z.ZodType<Prisma.SessionDefaultArgs> = z.object({
  select: z.lazy(() => SessionSelectSchema).optional(),
  include: z.lazy(() => SessionIncludeSchema).optional(),
}).strict();

export const SessionSelectSchema: z.ZodType<Prisma.SessionSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  token: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  ipAddress: z.boolean().optional(),
  userAgent: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// ACCOUNT
//------------------------------------------------------

export const AccountIncludeSchema: z.ZodType<Prisma.AccountInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const AccountArgsSchema: z.ZodType<Prisma.AccountDefaultArgs> = z.object({
  select: z.lazy(() => AccountSelectSchema).optional(),
  include: z.lazy(() => AccountIncludeSchema).optional(),
}).strict();

export const AccountSelectSchema: z.ZodType<Prisma.AccountSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  accountId: z.boolean().optional(),
  providerId: z.boolean().optional(),
  accessToken: z.boolean().optional(),
  refreshToken: z.boolean().optional(),
  accessTokenExpiresAt: z.boolean().optional(),
  refreshTokenExpiresAt: z.boolean().optional(),
  scope: z.boolean().optional(),
  idToken: z.boolean().optional(),
  password: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// VERIFICATION
//------------------------------------------------------

export const VerificationSelectSchema: z.ZodType<Prisma.VerificationSelect> = z.object({
  id: z.boolean().optional(),
  identifier: z.boolean().optional(),
  value: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// ISSUE
//------------------------------------------------------

export const IssueIncludeSchema: z.ZodType<Prisma.IssueInclude> = z.object({
  creator: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  assignee: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  screenshots: z.union([z.boolean(),z.lazy(() => ScreenshotFindManyArgsSchema)]).optional(),
  attachments: z.union([z.boolean(),z.lazy(() => AttachmentFindManyArgsSchema)]).optional(),
  comments: z.union([z.boolean(),z.lazy(() => CommentFindManyArgsSchema)]).optional(),
  history: z.union([z.boolean(),z.lazy(() => IssueHistoryFindManyArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => IssueCountOutputTypeArgsSchema)]).optional(),
}).strict();

export const IssueArgsSchema: z.ZodType<Prisma.IssueDefaultArgs> = z.object({
  select: z.lazy(() => IssueSelectSchema).optional(),
  include: z.lazy(() => IssueIncludeSchema).optional(),
}).strict();

export const IssueCountOutputTypeArgsSchema: z.ZodType<Prisma.IssueCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => IssueCountOutputTypeSelectSchema).nullish(),
}).strict();

export const IssueCountOutputTypeSelectSchema: z.ZodType<Prisma.IssueCountOutputTypeSelect> = z.object({
  screenshots: z.boolean().optional(),
  attachments: z.boolean().optional(),
  comments: z.boolean().optional(),
  history: z.boolean().optional(),
  notifications: z.boolean().optional(),
}).strict();

export const IssueSelectSchema: z.ZodType<Prisma.IssueSelect> = z.object({
  id: z.boolean().optional(),
  title: z.boolean().optional(),
  description: z.boolean().optional(),
  type: z.boolean().optional(),
  priority: z.boolean().optional(),
  severity: z.boolean().optional(),
  url: z.boolean().optional(),
  sourceNotes: z.boolean().optional(),
  reportedAt: z.boolean().optional(),
  status: z.boolean().optional(),
  createdBy: z.boolean().optional(),
  assigneeId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  creator: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  assignee: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  screenshots: z.union([z.boolean(),z.lazy(() => ScreenshotFindManyArgsSchema)]).optional(),
  attachments: z.union([z.boolean(),z.lazy(() => AttachmentFindManyArgsSchema)]).optional(),
  comments: z.union([z.boolean(),z.lazy(() => CommentFindManyArgsSchema)]).optional(),
  history: z.union([z.boolean(),z.lazy(() => IssueHistoryFindManyArgsSchema)]).optional(),
  notifications: z.union([z.boolean(),z.lazy(() => NotificationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => IssueCountOutputTypeArgsSchema)]).optional(),
}).strict()

// SCREENSHOT
//------------------------------------------------------

export const ScreenshotIncludeSchema: z.ZodType<Prisma.ScreenshotInclude> = z.object({
  issue: z.union([z.boolean(),z.lazy(() => IssueArgsSchema)]).optional(),
}).strict();

export const ScreenshotArgsSchema: z.ZodType<Prisma.ScreenshotDefaultArgs> = z.object({
  select: z.lazy(() => ScreenshotSelectSchema).optional(),
  include: z.lazy(() => ScreenshotIncludeSchema).optional(),
}).strict();

export const ScreenshotSelectSchema: z.ZodType<Prisma.ScreenshotSelect> = z.object({
  id: z.boolean().optional(),
  issueId: z.boolean().optional(),
  url: z.boolean().optional(),
  filename: z.boolean().optional(),
  mimeType: z.boolean().optional(),
  sizeBytes: z.boolean().optional(),
  order: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  issue: z.union([z.boolean(),z.lazy(() => IssueArgsSchema)]).optional(),
}).strict()

// ATTACHMENT
//------------------------------------------------------

export const AttachmentIncludeSchema: z.ZodType<Prisma.AttachmentInclude> = z.object({
  issue: z.union([z.boolean(),z.lazy(() => IssueArgsSchema)]).optional(),
  uploader: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const AttachmentArgsSchema: z.ZodType<Prisma.AttachmentDefaultArgs> = z.object({
  select: z.lazy(() => AttachmentSelectSchema).optional(),
  include: z.lazy(() => AttachmentIncludeSchema).optional(),
}).strict();

export const AttachmentSelectSchema: z.ZodType<Prisma.AttachmentSelect> = z.object({
  id: z.boolean().optional(),
  issueId: z.boolean().optional(),
  uploaderId: z.boolean().optional(),
  url: z.boolean().optional(),
  filename: z.boolean().optional(),
  mimeType: z.boolean().optional(),
  sizeBytes: z.boolean().optional(),
  order: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  issue: z.union([z.boolean(),z.lazy(() => IssueArgsSchema)]).optional(),
  uploader: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// COMMENT
//------------------------------------------------------

export const CommentIncludeSchema: z.ZodType<Prisma.CommentInclude> = z.object({
  issue: z.union([z.boolean(),z.lazy(() => IssueArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const CommentArgsSchema: z.ZodType<Prisma.CommentDefaultArgs> = z.object({
  select: z.lazy(() => CommentSelectSchema).optional(),
  include: z.lazy(() => CommentIncludeSchema).optional(),
}).strict();

export const CommentSelectSchema: z.ZodType<Prisma.CommentSelect> = z.object({
  id: z.boolean().optional(),
  issueId: z.boolean().optional(),
  userId: z.boolean().optional(),
  content: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  issue: z.union([z.boolean(),z.lazy(() => IssueArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// ISSUE HISTORY
//------------------------------------------------------

export const IssueHistoryIncludeSchema: z.ZodType<Prisma.IssueHistoryInclude> = z.object({
  issue: z.union([z.boolean(),z.lazy(() => IssueArgsSchema)]).optional(),
  actor: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict();

export const IssueHistoryArgsSchema: z.ZodType<Prisma.IssueHistoryDefaultArgs> = z.object({
  select: z.lazy(() => IssueHistorySelectSchema).optional(),
  include: z.lazy(() => IssueHistoryIncludeSchema).optional(),
}).strict();

export const IssueHistorySelectSchema: z.ZodType<Prisma.IssueHistorySelect> = z.object({
  id: z.boolean().optional(),
  issueId: z.boolean().optional(),
  actorId: z.boolean().optional(),
  eventType: z.boolean().optional(),
  description: z.boolean().optional(),
  metadata: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  issue: z.union([z.boolean(),z.lazy(() => IssueArgsSchema)]).optional(),
  actor: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// NOTIFICATION
//------------------------------------------------------

export const NotificationIncludeSchema: z.ZodType<Prisma.NotificationInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  issue: z.union([z.boolean(),z.lazy(() => IssueArgsSchema)]).optional(),
}).strict();

export const NotificationArgsSchema: z.ZodType<Prisma.NotificationDefaultArgs> = z.object({
  select: z.lazy(() => NotificationSelectSchema).optional(),
  include: z.lazy(() => NotificationIncludeSchema).optional(),
}).strict();

export const NotificationSelectSchema: z.ZodType<Prisma.NotificationSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  issueId: z.boolean().optional(),
  message: z.boolean().optional(),
  isRead: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  issue: z.union([z.boolean(),z.lazy(() => IssueArgsSchema)]).optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const PermissionWhereInputSchema: z.ZodType<Prisma.PermissionWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PermissionWhereInputSchema), z.lazy(() => PermissionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PermissionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PermissionWhereInputSchema), z.lazy(() => PermissionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  action: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  subject: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  inverted: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const PermissionOrderByWithRelationInputSchema: z.ZodType<Prisma.PermissionOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  subject: z.lazy(() => SortOrderSchema).optional(),
  inverted: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PermissionWhereUniqueInputSchema: z.ZodType<Prisma.PermissionWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    role_action_subject: z.lazy(() => PermissionRoleActionSubjectCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    role_action_subject: z.lazy(() => PermissionRoleActionSubjectCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  role_action_subject: z.lazy(() => PermissionRoleActionSubjectCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => PermissionWhereInputSchema), z.lazy(() => PermissionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PermissionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PermissionWhereInputSchema), z.lazy(() => PermissionWhereInputSchema).array() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  action: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  subject: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  inverted: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export const PermissionOrderByWithAggregationInputSchema: z.ZodType<Prisma.PermissionOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  subject: z.lazy(() => SortOrderSchema).optional(),
  inverted: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PermissionCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PermissionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PermissionMinOrderByAggregateInputSchema).optional(),
});

export const PermissionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PermissionScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => PermissionScalarWhereWithAggregatesInputSchema), z.lazy(() => PermissionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PermissionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PermissionScalarWhereWithAggregatesInputSchema), z.lazy(() => PermissionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleWithAggregatesFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  action: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  subject: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  inverted: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  emailVerified: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  image: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  sessions: z.lazy(() => SessionListRelationFilterSchema).optional(),
  accounts: z.lazy(() => AccountListRelationFilterSchema).optional(),
  issues: z.lazy(() => IssueListRelationFilterSchema).optional(),
  assignedIssues: z.lazy(() => IssueListRelationFilterSchema).optional(),
  attachments: z.lazy(() => AttachmentListRelationFilterSchema).optional(),
  comments: z.lazy(() => CommentListRelationFilterSchema).optional(),
  notifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryListRelationFilterSchema).optional(),
});

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  sessions: z.lazy(() => SessionOrderByRelationAggregateInputSchema).optional(),
  accounts: z.lazy(() => AccountOrderByRelationAggregateInputSchema).optional(),
  issues: z.lazy(() => IssueOrderByRelationAggregateInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueOrderByRelationAggregateInputSchema).optional(),
  attachments: z.lazy(() => AttachmentOrderByRelationAggregateInputSchema).optional(),
  comments: z.lazy(() => CommentOrderByRelationAggregateInputSchema).optional(),
  notifications: z.lazy(() => NotificationOrderByRelationAggregateInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryOrderByRelationAggregateInputSchema).optional(),
});

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    email: z.string(),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    email: z.string(),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  email: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema), z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  emailVerified: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  image: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  sessions: z.lazy(() => SessionListRelationFilterSchema).optional(),
  accounts: z.lazy(() => AccountListRelationFilterSchema).optional(),
  issues: z.lazy(() => IssueListRelationFilterSchema).optional(),
  assignedIssues: z.lazy(() => IssueListRelationFilterSchema).optional(),
  attachments: z.lazy(() => AttachmentListRelationFilterSchema).optional(),
  comments: z.lazy(() => CommentListRelationFilterSchema).optional(),
  notifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryListRelationFilterSchema).optional(),
}));

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional(),
});

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema), z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  emailVerified: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  image: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  role: z.union([ z.lazy(() => EnumRoleWithAggregatesFilterSchema), z.lazy(() => RoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const SessionWhereInputSchema: z.ZodType<Prisma.SessionWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  token: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const SessionOrderByWithRelationInputSchema: z.ZodType<Prisma.SessionOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userAgent: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const SessionWhereUniqueInputSchema: z.ZodType<Prisma.SessionWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    token: z.string(),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    token: z.string(),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  token: z.string().optional(),
  AND: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionWhereInputSchema), z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const SessionOrderByWithAggregationInputSchema: z.ZodType<Prisma.SessionOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userAgent: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => SessionCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SessionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SessionMinOrderByAggregateInputSchema).optional(),
});

export const SessionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SessionScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SessionScalarWhereWithAggregatesInputSchema), z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionScalarWhereWithAggregatesInputSchema), z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  token: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
});

export const AccountWhereInputSchema: z.ZodType<Prisma.AccountWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accountId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const AccountOrderByWithRelationInputSchema: z.ZodType<Prisma.AccountOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  scope: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  idToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const AccountWhereUniqueInputSchema: z.ZodType<Prisma.AccountWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountWhereInputSchema), z.lazy(() => AccountWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accountId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const AccountOrderByWithAggregationInputSchema: z.ZodType<Prisma.AccountOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  scope: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  idToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  password: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AccountCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AccountMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AccountMinOrderByAggregateInputSchema).optional(),
});

export const AccountScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AccountScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AccountScalarWhereWithAggregatesInputSchema), z.lazy(() => AccountScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountScalarWhereWithAggregatesInputSchema), z.lazy(() => AccountScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  accountId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const VerificationWhereInputSchema: z.ZodType<Prisma.VerificationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => VerificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  identifier: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const VerificationOrderByWithRelationInputSchema: z.ZodType<Prisma.VerificationOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const VerificationWhereUniqueInputSchema: z.ZodType<Prisma.VerificationWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => VerificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VerificationWhereInputSchema), z.lazy(() => VerificationWhereInputSchema).array() ]).optional(),
  identifier: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export const VerificationOrderByWithAggregationInputSchema: z.ZodType<Prisma.VerificationOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => VerificationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => VerificationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => VerificationMinOrderByAggregateInputSchema).optional(),
});

export const VerificationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.VerificationScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema), z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema), z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  identifier: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const IssueWhereInputSchema: z.ZodType<Prisma.IssueWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => IssueWhereInputSchema), z.lazy(() => IssueWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => IssueWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => IssueWhereInputSchema), z.lazy(() => IssueWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumIssueTypeFilterSchema), z.lazy(() => IssueTypeSchema) ]).optional(),
  priority: z.union([ z.lazy(() => EnumPriorityFilterSchema), z.lazy(() => PrioritySchema) ]).optional(),
  severity: z.union([ z.lazy(() => EnumSeverityFilterSchema), z.lazy(() => SeveritySchema) ]).optional(),
  url: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  sourceNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  reportedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumIssueStatusFilterSchema), z.lazy(() => IssueStatusSchema) ]).optional(),
  createdBy: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  assigneeId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  creator: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  assignee: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
  screenshots: z.lazy(() => ScreenshotListRelationFilterSchema).optional(),
  attachments: z.lazy(() => AttachmentListRelationFilterSchema).optional(),
  comments: z.lazy(() => CommentListRelationFilterSchema).optional(),
  history: z.lazy(() => IssueHistoryListRelationFilterSchema).optional(),
  notifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
});

export const IssueOrderByWithRelationInputSchema: z.ZodType<Prisma.IssueOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  priority: z.lazy(() => SortOrderSchema).optional(),
  severity: z.lazy(() => SortOrderSchema).optional(),
  url: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sourceNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  reportedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdBy: z.lazy(() => SortOrderSchema).optional(),
  assigneeId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  creator: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  assignee: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotOrderByRelationAggregateInputSchema).optional(),
  attachments: z.lazy(() => AttachmentOrderByRelationAggregateInputSchema).optional(),
  comments: z.lazy(() => CommentOrderByRelationAggregateInputSchema).optional(),
  history: z.lazy(() => IssueHistoryOrderByRelationAggregateInputSchema).optional(),
  notifications: z.lazy(() => NotificationOrderByRelationAggregateInputSchema).optional(),
});

export const IssueWhereUniqueInputSchema: z.ZodType<Prisma.IssueWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => IssueWhereInputSchema), z.lazy(() => IssueWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => IssueWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => IssueWhereInputSchema), z.lazy(() => IssueWhereInputSchema).array() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumIssueTypeFilterSchema), z.lazy(() => IssueTypeSchema) ]).optional(),
  priority: z.union([ z.lazy(() => EnumPriorityFilterSchema), z.lazy(() => PrioritySchema) ]).optional(),
  severity: z.union([ z.lazy(() => EnumSeverityFilterSchema), z.lazy(() => SeveritySchema) ]).optional(),
  url: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  sourceNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  reportedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumIssueStatusFilterSchema), z.lazy(() => IssueStatusSchema) ]).optional(),
  createdBy: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  assigneeId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  creator: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  assignee: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
  screenshots: z.lazy(() => ScreenshotListRelationFilterSchema).optional(),
  attachments: z.lazy(() => AttachmentListRelationFilterSchema).optional(),
  comments: z.lazy(() => CommentListRelationFilterSchema).optional(),
  history: z.lazy(() => IssueHistoryListRelationFilterSchema).optional(),
  notifications: z.lazy(() => NotificationListRelationFilterSchema).optional(),
}));

export const IssueOrderByWithAggregationInputSchema: z.ZodType<Prisma.IssueOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  priority: z.lazy(() => SortOrderSchema).optional(),
  severity: z.lazy(() => SortOrderSchema).optional(),
  url: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  sourceNotes: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  reportedAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdBy: z.lazy(() => SortOrderSchema).optional(),
  assigneeId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => IssueCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => IssueMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => IssueMinOrderByAggregateInputSchema).optional(),
});

export const IssueScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.IssueScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => IssueScalarWhereWithAggregatesInputSchema), z.lazy(() => IssueScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => IssueScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => IssueScalarWhereWithAggregatesInputSchema), z.lazy(() => IssueScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumIssueTypeWithAggregatesFilterSchema), z.lazy(() => IssueTypeSchema) ]).optional(),
  priority: z.union([ z.lazy(() => EnumPriorityWithAggregatesFilterSchema), z.lazy(() => PrioritySchema) ]).optional(),
  severity: z.union([ z.lazy(() => EnumSeverityWithAggregatesFilterSchema), z.lazy(() => SeveritySchema) ]).optional(),
  url: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  sourceNotes: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  reportedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema), z.coerce.date() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumIssueStatusWithAggregatesFilterSchema), z.lazy(() => IssueStatusSchema) ]).optional(),
  createdBy: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  assigneeId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const ScreenshotWhereInputSchema: z.ZodType<Prisma.ScreenshotWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ScreenshotWhereInputSchema), z.lazy(() => ScreenshotWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ScreenshotWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ScreenshotWhereInputSchema), z.lazy(() => ScreenshotWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  filename: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sizeBytes: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  issue: z.union([ z.lazy(() => IssueScalarRelationFilterSchema), z.lazy(() => IssueWhereInputSchema) ]).optional(),
});

export const ScreenshotOrderByWithRelationInputSchema: z.ZodType<Prisma.ScreenshotOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  filename: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  issue: z.lazy(() => IssueOrderByWithRelationInputSchema).optional(),
});

export const ScreenshotWhereUniqueInputSchema: z.ZodType<Prisma.ScreenshotWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => ScreenshotWhereInputSchema), z.lazy(() => ScreenshotWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ScreenshotWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ScreenshotWhereInputSchema), z.lazy(() => ScreenshotWhereInputSchema).array() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  filename: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sizeBytes: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  issue: z.union([ z.lazy(() => IssueScalarRelationFilterSchema), z.lazy(() => IssueWhereInputSchema) ]).optional(),
}));

export const ScreenshotOrderByWithAggregationInputSchema: z.ZodType<Prisma.ScreenshotOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  filename: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ScreenshotCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ScreenshotAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ScreenshotMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ScreenshotMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ScreenshotSumOrderByAggregateInputSchema).optional(),
});

export const ScreenshotScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ScreenshotScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ScreenshotScalarWhereWithAggregatesInputSchema), z.lazy(() => ScreenshotScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ScreenshotScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ScreenshotScalarWhereWithAggregatesInputSchema), z.lazy(() => ScreenshotScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  filename: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  sizeBytes: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const AttachmentWhereInputSchema: z.ZodType<Prisma.AttachmentWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AttachmentWhereInputSchema), z.lazy(() => AttachmentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AttachmentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AttachmentWhereInputSchema), z.lazy(() => AttachmentWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  uploaderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  filename: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sizeBytes: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  issue: z.union([ z.lazy(() => IssueScalarRelationFilterSchema), z.lazy(() => IssueWhereInputSchema) ]).optional(),
  uploader: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const AttachmentOrderByWithRelationInputSchema: z.ZodType<Prisma.AttachmentOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  uploaderId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  filename: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  issue: z.lazy(() => IssueOrderByWithRelationInputSchema).optional(),
  uploader: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const AttachmentWhereUniqueInputSchema: z.ZodType<Prisma.AttachmentWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => AttachmentWhereInputSchema), z.lazy(() => AttachmentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AttachmentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AttachmentWhereInputSchema), z.lazy(() => AttachmentWhereInputSchema).array() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  uploaderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  filename: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sizeBytes: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  issue: z.union([ z.lazy(() => IssueScalarRelationFilterSchema), z.lazy(() => IssueWhereInputSchema) ]).optional(),
  uploader: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const AttachmentOrderByWithAggregationInputSchema: z.ZodType<Prisma.AttachmentOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  uploaderId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  filename: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AttachmentCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => AttachmentAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AttachmentMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AttachmentMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => AttachmentSumOrderByAggregateInputSchema).optional(),
});

export const AttachmentScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AttachmentScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AttachmentScalarWhereWithAggregatesInputSchema), z.lazy(() => AttachmentScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AttachmentScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AttachmentScalarWhereWithAggregatesInputSchema), z.lazy(() => AttachmentScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  uploaderId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  filename: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  sizeBytes: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntWithAggregatesFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const CommentWhereInputSchema: z.ZodType<Prisma.CommentWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CommentWhereInputSchema), z.lazy(() => CommentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CommentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CommentWhereInputSchema), z.lazy(() => CommentWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  issue: z.union([ z.lazy(() => IssueScalarRelationFilterSchema), z.lazy(() => IssueWhereInputSchema) ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const CommentOrderByWithRelationInputSchema: z.ZodType<Prisma.CommentOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  issue: z.lazy(() => IssueOrderByWithRelationInputSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const CommentWhereUniqueInputSchema: z.ZodType<Prisma.CommentWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => CommentWhereInputSchema), z.lazy(() => CommentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CommentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CommentWhereInputSchema), z.lazy(() => CommentWhereInputSchema).array() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  issue: z.union([ z.lazy(() => IssueScalarRelationFilterSchema), z.lazy(() => IssueWhereInputSchema) ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const CommentOrderByWithAggregationInputSchema: z.ZodType<Prisma.CommentOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => CommentCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CommentMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CommentMinOrderByAggregateInputSchema).optional(),
});

export const CommentScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CommentScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CommentScalarWhereWithAggregatesInputSchema), z.lazy(() => CommentScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => CommentScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CommentScalarWhereWithAggregatesInputSchema), z.lazy(() => CommentScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const IssueHistoryWhereInputSchema: z.ZodType<Prisma.IssueHistoryWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => IssueHistoryWhereInputSchema), z.lazy(() => IssueHistoryWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => IssueHistoryWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => IssueHistoryWhereInputSchema), z.lazy(() => IssueHistoryWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  actorId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventType: z.union([ z.lazy(() => EnumHistoryEventFilterSchema), z.lazy(() => HistoryEventSchema) ]).optional(),
  description: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  metadata: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  issue: z.union([ z.lazy(() => IssueScalarRelationFilterSchema), z.lazy(() => IssueWhereInputSchema) ]).optional(),
  actor: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
});

export const IssueHistoryOrderByWithRelationInputSchema: z.ZodType<Prisma.IssueHistoryOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  actorId: z.lazy(() => SortOrderSchema).optional(),
  eventType: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  metadata: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  issue: z.lazy(() => IssueOrderByWithRelationInputSchema).optional(),
  actor: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
});

export const IssueHistoryWhereUniqueInputSchema: z.ZodType<Prisma.IssueHistoryWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => IssueHistoryWhereInputSchema), z.lazy(() => IssueHistoryWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => IssueHistoryWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => IssueHistoryWhereInputSchema), z.lazy(() => IssueHistoryWhereInputSchema).array() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  actorId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventType: z.union([ z.lazy(() => EnumHistoryEventFilterSchema), z.lazy(() => HistoryEventSchema) ]).optional(),
  description: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  metadata: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  issue: z.union([ z.lazy(() => IssueScalarRelationFilterSchema), z.lazy(() => IssueWhereInputSchema) ]).optional(),
  actor: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
}));

export const IssueHistoryOrderByWithAggregationInputSchema: z.ZodType<Prisma.IssueHistoryOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  actorId: z.lazy(() => SortOrderSchema).optional(),
  eventType: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  metadata: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => IssueHistoryCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => IssueHistoryMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => IssueHistoryMinOrderByAggregateInputSchema).optional(),
});

export const IssueHistoryScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.IssueHistoryScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => IssueHistoryScalarWhereWithAggregatesInputSchema), z.lazy(() => IssueHistoryScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => IssueHistoryScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => IssueHistoryScalarWhereWithAggregatesInputSchema), z.lazy(() => IssueHistoryScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  actorId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  eventType: z.union([ z.lazy(() => EnumHistoryEventWithAggregatesFilterSchema), z.lazy(() => HistoryEventSchema) ]).optional(),
  description: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  metadata: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const NotificationWhereInputSchema: z.ZodType<Prisma.NotificationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationWhereInputSchema), z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationWhereInputSchema), z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  message: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isRead: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  issue: z.union([ z.lazy(() => IssueScalarRelationFilterSchema), z.lazy(() => IssueWhereInputSchema) ]).optional(),
});

export const NotificationOrderByWithRelationInputSchema: z.ZodType<Prisma.NotificationOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  message: z.lazy(() => SortOrderSchema).optional(),
  isRead: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  issue: z.lazy(() => IssueOrderByWithRelationInputSchema).optional(),
});

export const NotificationWhereUniqueInputSchema: z.ZodType<Prisma.NotificationWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => NotificationWhereInputSchema), z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationWhereInputSchema), z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  message: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isRead: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  issue: z.union([ z.lazy(() => IssueScalarRelationFilterSchema), z.lazy(() => IssueWhereInputSchema) ]).optional(),
}));

export const NotificationOrderByWithAggregationInputSchema: z.ZodType<Prisma.NotificationOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  message: z.lazy(() => SortOrderSchema).optional(),
  isRead: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => NotificationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => NotificationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => NotificationMinOrderByAggregateInputSchema).optional(),
});

export const NotificationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.NotificationScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema), z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema), z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  message: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  isRead: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export const PermissionCreateInputSchema: z.ZodType<Prisma.PermissionCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  role: z.lazy(() => RoleSchema),
  action: z.string(),
  subject: z.string(),
  inverted: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const PermissionUncheckedCreateInputSchema: z.ZodType<Prisma.PermissionUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  role: z.lazy(() => RoleSchema),
  action: z.string(),
  subject: z.string(),
  inverted: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const PermissionUpdateInputSchema: z.ZodType<Prisma.PermissionUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subject: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  inverted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PermissionUncheckedUpdateInputSchema: z.ZodType<Prisma.PermissionUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subject: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  inverted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PermissionCreateManyInputSchema: z.ZodType<Prisma.PermissionCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  role: z.lazy(() => RoleSchema),
  action: z.string(),
  subject: z.string(),
  inverted: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const PermissionUpdateManyMutationInputSchema: z.ZodType<Prisma.PermissionUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subject: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  inverted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const PermissionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PermissionUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subject: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  inverted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const SessionCreateInputSchema: z.ZodType<Prisma.SessionCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutSessionsInputSchema),
});

export const SessionUncheckedCreateInputSchema: z.ZodType<Prisma.SessionUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const SessionUpdateInputSchema: z.ZodType<Prisma.SessionUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSessionsNestedInputSchema).optional(),
});

export const SessionUncheckedUpdateInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SessionCreateManyInputSchema: z.ZodType<Prisma.SessionCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const SessionUpdateManyMutationInputSchema: z.ZodType<Prisma.SessionUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SessionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const AccountCreateInputSchema: z.ZodType<Prisma.AccountCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutAccountsInputSchema),
});

export const AccountUncheckedCreateInputSchema: z.ZodType<Prisma.AccountUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AccountUpdateInputSchema: z.ZodType<Prisma.AccountUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutAccountsNestedInputSchema).optional(),
});

export const AccountUncheckedUpdateInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountCreateManyInputSchema: z.ZodType<Prisma.AccountCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AccountUpdateManyMutationInputSchema: z.ZodType<Prisma.AccountUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const VerificationCreateInputSchema: z.ZodType<Prisma.VerificationCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const VerificationUncheckedCreateInputSchema: z.ZodType<Prisma.VerificationUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const VerificationUpdateInputSchema: z.ZodType<Prisma.VerificationUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const VerificationUncheckedUpdateInputSchema: z.ZodType<Prisma.VerificationUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const VerificationCreateManyInputSchema: z.ZodType<Prisma.VerificationCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const VerificationUpdateManyMutationInputSchema: z.ZodType<Prisma.VerificationUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const VerificationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.VerificationUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  identifier: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IssueCreateInputSchema: z.ZodType<Prisma.IssueCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  creator: z.lazy(() => UserCreateNestedOneWithoutIssuesInputSchema),
  assignee: z.lazy(() => UserCreateNestedOneWithoutAssignedIssuesInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueUncheckedCreateInputSchema: z.ZodType<Prisma.IssueUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdBy: z.string(),
  assigneeId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueUpdateInputSchema: z.ZodType<Prisma.IssueUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  creator: z.lazy(() => UserUpdateOneRequiredWithoutIssuesNestedInputSchema).optional(),
  assignee: z.lazy(() => UserUpdateOneWithoutAssignedIssuesNestedInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueUncheckedUpdateInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdBy: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  assigneeId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueCreateManyInputSchema: z.ZodType<Prisma.IssueCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdBy: z.string(),
  assigneeId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const IssueUpdateManyMutationInputSchema: z.ZodType<Prisma.IssueUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IssueUncheckedUpdateManyInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdBy: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  assigneeId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ScreenshotCreateInputSchema: z.ZodType<Prisma.ScreenshotCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  issue: z.lazy(() => IssueCreateNestedOneWithoutScreenshotsInputSchema),
});

export const ScreenshotUncheckedCreateInputSchema: z.ZodType<Prisma.ScreenshotUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const ScreenshotUpdateInputSchema: z.ZodType<Prisma.ScreenshotUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  issue: z.lazy(() => IssueUpdateOneRequiredWithoutScreenshotsNestedInputSchema).optional(),
});

export const ScreenshotUncheckedUpdateInputSchema: z.ZodType<Prisma.ScreenshotUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ScreenshotCreateManyInputSchema: z.ZodType<Prisma.ScreenshotCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const ScreenshotUpdateManyMutationInputSchema: z.ZodType<Prisma.ScreenshotUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ScreenshotUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ScreenshotUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AttachmentCreateInputSchema: z.ZodType<Prisma.AttachmentCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  issue: z.lazy(() => IssueCreateNestedOneWithoutAttachmentsInputSchema),
  uploader: z.lazy(() => UserCreateNestedOneWithoutAttachmentsInputSchema),
});

export const AttachmentUncheckedCreateInputSchema: z.ZodType<Prisma.AttachmentUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  uploaderId: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const AttachmentUpdateInputSchema: z.ZodType<Prisma.AttachmentUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  issue: z.lazy(() => IssueUpdateOneRequiredWithoutAttachmentsNestedInputSchema).optional(),
  uploader: z.lazy(() => UserUpdateOneRequiredWithoutAttachmentsNestedInputSchema).optional(),
});

export const AttachmentUncheckedUpdateInputSchema: z.ZodType<Prisma.AttachmentUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  uploaderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AttachmentCreateManyInputSchema: z.ZodType<Prisma.AttachmentCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  uploaderId: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const AttachmentUpdateManyMutationInputSchema: z.ZodType<Prisma.AttachmentUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AttachmentUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AttachmentUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  uploaderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const CommentCreateInputSchema: z.ZodType<Prisma.CommentCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
  issue: z.lazy(() => IssueCreateNestedOneWithoutCommentsInputSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutCommentsInputSchema),
});

export const CommentUncheckedCreateInputSchema: z.ZodType<Prisma.CommentUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
});

export const CommentUpdateInputSchema: z.ZodType<Prisma.CommentUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  issue: z.lazy(() => IssueUpdateOneRequiredWithoutCommentsNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutCommentsNestedInputSchema).optional(),
});

export const CommentUncheckedUpdateInputSchema: z.ZodType<Prisma.CommentUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const CommentCreateManyInputSchema: z.ZodType<Prisma.CommentCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
});

export const CommentUpdateManyMutationInputSchema: z.ZodType<Prisma.CommentUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const CommentUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CommentUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IssueHistoryCreateInputSchema: z.ZodType<Prisma.IssueHistoryCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  eventType: z.lazy(() => HistoryEventSchema),
  description: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  issue: z.lazy(() => IssueCreateNestedOneWithoutHistoryInputSchema),
  actor: z.lazy(() => UserCreateNestedOneWithoutHistoryActionsInputSchema),
});

export const IssueHistoryUncheckedCreateInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  actorId: z.string(),
  eventType: z.lazy(() => HistoryEventSchema),
  description: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
});

export const IssueHistoryUpdateInputSchema: z.ZodType<Prisma.IssueHistoryUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventType: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => EnumHistoryEventFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  issue: z.lazy(() => IssueUpdateOneRequiredWithoutHistoryNestedInputSchema).optional(),
  actor: z.lazy(() => UserUpdateOneRequiredWithoutHistoryActionsNestedInputSchema).optional(),
});

export const IssueHistoryUncheckedUpdateInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventType: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => EnumHistoryEventFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IssueHistoryCreateManyInputSchema: z.ZodType<Prisma.IssueHistoryCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  actorId: z.string(),
  eventType: z.lazy(() => HistoryEventSchema),
  description: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
});

export const IssueHistoryUpdateManyMutationInputSchema: z.ZodType<Prisma.IssueHistoryUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventType: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => EnumHistoryEventFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IssueHistoryUncheckedUpdateManyInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventType: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => EnumHistoryEventFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationCreateInputSchema: z.ZodType<Prisma.NotificationCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  message: z.string(),
  isRead: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutNotificationsInputSchema),
  issue: z.lazy(() => IssueCreateNestedOneWithoutNotificationsInputSchema),
});

export const NotificationUncheckedCreateInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  issueId: z.string(),
  message: z.string(),
  isRead: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
});

export const NotificationUpdateInputSchema: z.ZodType<Prisma.NotificationUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  message: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isRead: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutNotificationsNestedInputSchema).optional(),
  issue: z.lazy(() => IssueUpdateOneRequiredWithoutNotificationsNestedInputSchema).optional(),
});

export const NotificationUncheckedUpdateInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  message: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isRead: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationCreateManyInputSchema: z.ZodType<Prisma.NotificationCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  issueId: z.string(),
  message: z.string(),
  isRead: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
});

export const NotificationUpdateManyMutationInputSchema: z.ZodType<Prisma.NotificationUpdateManyMutationInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  message: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isRead: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  message: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isRead: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const EnumRoleFilterSchema: z.ZodType<Prisma.EnumRoleFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleFilterSchema) ]).optional(),
});

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const PermissionRoleActionSubjectCompoundUniqueInputSchema: z.ZodType<Prisma.PermissionRoleActionSubjectCompoundUniqueInput> = z.strictObject({
  role: z.lazy(() => RoleSchema),
  action: z.string(),
  subject: z.string(),
});

export const PermissionCountOrderByAggregateInputSchema: z.ZodType<Prisma.PermissionCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  subject: z.lazy(() => SortOrderSchema).optional(),
  inverted: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PermissionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PermissionMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  subject: z.lazy(() => SortOrderSchema).optional(),
  inverted: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const PermissionMinOrderByAggregateInputSchema: z.ZodType<Prisma.PermissionMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  subject: z.lazy(() => SortOrderSchema).optional(),
  inverted: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const EnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.EnumRoleWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
});

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const SessionListRelationFilterSchema: z.ZodType<Prisma.SessionListRelationFilter> = z.strictObject({
  every: z.lazy(() => SessionWhereInputSchema).optional(),
  some: z.lazy(() => SessionWhereInputSchema).optional(),
  none: z.lazy(() => SessionWhereInputSchema).optional(),
});

export const AccountListRelationFilterSchema: z.ZodType<Prisma.AccountListRelationFilter> = z.strictObject({
  every: z.lazy(() => AccountWhereInputSchema).optional(),
  some: z.lazy(() => AccountWhereInputSchema).optional(),
  none: z.lazy(() => AccountWhereInputSchema).optional(),
});

export const IssueListRelationFilterSchema: z.ZodType<Prisma.IssueListRelationFilter> = z.strictObject({
  every: z.lazy(() => IssueWhereInputSchema).optional(),
  some: z.lazy(() => IssueWhereInputSchema).optional(),
  none: z.lazy(() => IssueWhereInputSchema).optional(),
});

export const AttachmentListRelationFilterSchema: z.ZodType<Prisma.AttachmentListRelationFilter> = z.strictObject({
  every: z.lazy(() => AttachmentWhereInputSchema).optional(),
  some: z.lazy(() => AttachmentWhereInputSchema).optional(),
  none: z.lazy(() => AttachmentWhereInputSchema).optional(),
});

export const CommentListRelationFilterSchema: z.ZodType<Prisma.CommentListRelationFilter> = z.strictObject({
  every: z.lazy(() => CommentWhereInputSchema).optional(),
  some: z.lazy(() => CommentWhereInputSchema).optional(),
  none: z.lazy(() => CommentWhereInputSchema).optional(),
});

export const NotificationListRelationFilterSchema: z.ZodType<Prisma.NotificationListRelationFilter> = z.strictObject({
  every: z.lazy(() => NotificationWhereInputSchema).optional(),
  some: z.lazy(() => NotificationWhereInputSchema).optional(),
  none: z.lazy(() => NotificationWhereInputSchema).optional(),
});

export const IssueHistoryListRelationFilterSchema: z.ZodType<Prisma.IssueHistoryListRelationFilter> = z.strictObject({
  every: z.lazy(() => IssueHistoryWhereInputSchema).optional(),
  some: z.lazy(() => IssueHistoryWhereInputSchema).optional(),
  none: z.lazy(() => IssueHistoryWhereInputSchema).optional(),
});

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.strictObject({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional(),
});

export const SessionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SessionOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const AccountOrderByRelationAggregateInputSchema: z.ZodType<Prisma.AccountOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const IssueOrderByRelationAggregateInputSchema: z.ZodType<Prisma.IssueOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const AttachmentOrderByRelationAggregateInputSchema: z.ZodType<Prisma.AttachmentOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const CommentOrderByRelationAggregateInputSchema: z.ZodType<Prisma.CommentOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const NotificationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.NotificationOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const IssueHistoryOrderByRelationAggregateInputSchema: z.ZodType<Prisma.IssueHistoryOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  emailVerified: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const UserScalarRelationFilterSchema: z.ZodType<Prisma.UserScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => UserWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWhereInputSchema).optional(),
});

export const SessionCountOrderByAggregateInputSchema: z.ZodType<Prisma.SessionCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  userAgent: z.lazy(() => SortOrderSchema).optional(),
});

export const SessionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SessionMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  userAgent: z.lazy(() => SortOrderSchema).optional(),
});

export const SessionMinOrderByAggregateInputSchema: z.ZodType<Prisma.SessionMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  ipAddress: z.lazy(() => SortOrderSchema).optional(),
  userAgent: z.lazy(() => SortOrderSchema).optional(),
});

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const AccountCountOrderByAggregateInputSchema: z.ZodType<Prisma.AccountCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  accessTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  scope: z.lazy(() => SortOrderSchema).optional(),
  idToken: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AccountMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AccountMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  accessTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  scope: z.lazy(() => SortOrderSchema).optional(),
  idToken: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AccountMinOrderByAggregateInputSchema: z.ZodType<Prisma.AccountMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  accountId: z.lazy(() => SortOrderSchema).optional(),
  providerId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  accessTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresAt: z.lazy(() => SortOrderSchema).optional(),
  scope: z.lazy(() => SortOrderSchema).optional(),
  idToken: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const VerificationCountOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const VerificationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const VerificationMinOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  identifier: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumIssueTypeFilterSchema: z.ZodType<Prisma.EnumIssueTypeFilter> = z.strictObject({
  equals: z.lazy(() => IssueTypeSchema).optional(),
  in: z.lazy(() => IssueTypeSchema).array().optional(),
  notIn: z.lazy(() => IssueTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => NestedEnumIssueTypeFilterSchema) ]).optional(),
});

export const EnumPriorityFilterSchema: z.ZodType<Prisma.EnumPriorityFilter> = z.strictObject({
  equals: z.lazy(() => PrioritySchema).optional(),
  in: z.lazy(() => PrioritySchema).array().optional(),
  notIn: z.lazy(() => PrioritySchema).array().optional(),
  not: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => NestedEnumPriorityFilterSchema) ]).optional(),
});

export const EnumSeverityFilterSchema: z.ZodType<Prisma.EnumSeverityFilter> = z.strictObject({
  equals: z.lazy(() => SeveritySchema).optional(),
  in: z.lazy(() => SeveritySchema).array().optional(),
  notIn: z.lazy(() => SeveritySchema).array().optional(),
  not: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => NestedEnumSeverityFilterSchema) ]).optional(),
});

export const EnumIssueStatusFilterSchema: z.ZodType<Prisma.EnumIssueStatusFilter> = z.strictObject({
  equals: z.lazy(() => IssueStatusSchema).optional(),
  in: z.lazy(() => IssueStatusSchema).array().optional(),
  notIn: z.lazy(() => IssueStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => NestedEnumIssueStatusFilterSchema) ]).optional(),
});

export const UserNullableScalarRelationFilterSchema: z.ZodType<Prisma.UserNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => UserWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => UserWhereInputSchema).optional().nullable(),
});

export const ScreenshotListRelationFilterSchema: z.ZodType<Prisma.ScreenshotListRelationFilter> = z.strictObject({
  every: z.lazy(() => ScreenshotWhereInputSchema).optional(),
  some: z.lazy(() => ScreenshotWhereInputSchema).optional(),
  none: z.lazy(() => ScreenshotWhereInputSchema).optional(),
});

export const ScreenshotOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ScreenshotOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export const IssueCountOrderByAggregateInputSchema: z.ZodType<Prisma.IssueCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  priority: z.lazy(() => SortOrderSchema).optional(),
  severity: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  sourceNotes: z.lazy(() => SortOrderSchema).optional(),
  reportedAt: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdBy: z.lazy(() => SortOrderSchema).optional(),
  assigneeId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const IssueMaxOrderByAggregateInputSchema: z.ZodType<Prisma.IssueMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  priority: z.lazy(() => SortOrderSchema).optional(),
  severity: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  sourceNotes: z.lazy(() => SortOrderSchema).optional(),
  reportedAt: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdBy: z.lazy(() => SortOrderSchema).optional(),
  assigneeId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const IssueMinOrderByAggregateInputSchema: z.ZodType<Prisma.IssueMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  priority: z.lazy(() => SortOrderSchema).optional(),
  severity: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  sourceNotes: z.lazy(() => SortOrderSchema).optional(),
  reportedAt: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  createdBy: z.lazy(() => SortOrderSchema).optional(),
  assigneeId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumIssueTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumIssueTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => IssueTypeSchema).optional(),
  in: z.lazy(() => IssueTypeSchema).array().optional(),
  notIn: z.lazy(() => IssueTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => NestedEnumIssueTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumIssueTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumIssueTypeFilterSchema).optional(),
});

export const EnumPriorityWithAggregatesFilterSchema: z.ZodType<Prisma.EnumPriorityWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => PrioritySchema).optional(),
  in: z.lazy(() => PrioritySchema).array().optional(),
  notIn: z.lazy(() => PrioritySchema).array().optional(),
  not: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => NestedEnumPriorityWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPriorityFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPriorityFilterSchema).optional(),
});

export const EnumSeverityWithAggregatesFilterSchema: z.ZodType<Prisma.EnumSeverityWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => SeveritySchema).optional(),
  in: z.lazy(() => SeveritySchema).array().optional(),
  notIn: z.lazy(() => SeveritySchema).array().optional(),
  not: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => NestedEnumSeverityWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSeverityFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSeverityFilterSchema).optional(),
});

export const EnumIssueStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumIssueStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => IssueStatusSchema).optional(),
  in: z.lazy(() => IssueStatusSchema).array().optional(),
  notIn: z.lazy(() => IssueStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => NestedEnumIssueStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumIssueStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumIssueStatusFilterSchema).optional(),
});

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const IssueScalarRelationFilterSchema: z.ZodType<Prisma.IssueScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => IssueWhereInputSchema).optional(),
  isNot: z.lazy(() => IssueWhereInputSchema).optional(),
});

export const ScreenshotCountOrderByAggregateInputSchema: z.ZodType<Prisma.ScreenshotCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  filename: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ScreenshotAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ScreenshotAvgOrderByAggregateInput> = z.strictObject({
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const ScreenshotMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ScreenshotMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  filename: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ScreenshotMinOrderByAggregateInputSchema: z.ZodType<Prisma.ScreenshotMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  filename: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const ScreenshotSumOrderByAggregateInputSchema: z.ZodType<Prisma.ScreenshotSumOrderByAggregateInput> = z.strictObject({
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const AttachmentCountOrderByAggregateInputSchema: z.ZodType<Prisma.AttachmentCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  uploaderId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  filename: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AttachmentAvgOrderByAggregateInputSchema: z.ZodType<Prisma.AttachmentAvgOrderByAggregateInput> = z.strictObject({
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const AttachmentMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AttachmentMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  uploaderId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  filename: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AttachmentMinOrderByAggregateInputSchema: z.ZodType<Prisma.AttachmentMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  uploaderId: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  filename: z.lazy(() => SortOrderSchema).optional(),
  mimeType: z.lazy(() => SortOrderSchema).optional(),
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const AttachmentSumOrderByAggregateInputSchema: z.ZodType<Prisma.AttachmentSumOrderByAggregateInput> = z.strictObject({
  sizeBytes: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
});

export const CommentCountOrderByAggregateInputSchema: z.ZodType<Prisma.CommentCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const CommentMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CommentMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const CommentMinOrderByAggregateInputSchema: z.ZodType<Prisma.CommentMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumHistoryEventFilterSchema: z.ZodType<Prisma.EnumHistoryEventFilter> = z.strictObject({
  equals: z.lazy(() => HistoryEventSchema).optional(),
  in: z.lazy(() => HistoryEventSchema).array().optional(),
  notIn: z.lazy(() => HistoryEventSchema).array().optional(),
  not: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => NestedEnumHistoryEventFilterSchema) ]).optional(),
});

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const IssueHistoryCountOrderByAggregateInputSchema: z.ZodType<Prisma.IssueHistoryCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  actorId: z.lazy(() => SortOrderSchema).optional(),
  eventType: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  metadata: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const IssueHistoryMaxOrderByAggregateInputSchema: z.ZodType<Prisma.IssueHistoryMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  actorId: z.lazy(() => SortOrderSchema).optional(),
  eventType: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const IssueHistoryMinOrderByAggregateInputSchema: z.ZodType<Prisma.IssueHistoryMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  actorId: z.lazy(() => SortOrderSchema).optional(),
  eventType: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const EnumHistoryEventWithAggregatesFilterSchema: z.ZodType<Prisma.EnumHistoryEventWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => HistoryEventSchema).optional(),
  in: z.lazy(() => HistoryEventSchema).array().optional(),
  notIn: z.lazy(() => HistoryEventSchema).array().optional(),
  not: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => NestedEnumHistoryEventWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumHistoryEventFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumHistoryEventFilterSchema).optional(),
});

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
});

export const NotificationCountOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  message: z.lazy(() => SortOrderSchema).optional(),
  isRead: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const NotificationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  message: z.lazy(() => SortOrderSchema).optional(),
  isRead: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const NotificationMinOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  issueId: z.lazy(() => SortOrderSchema).optional(),
  message: z.lazy(() => SortOrderSchema).optional(),
  isRead: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional(),
});

export const EnumRoleFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumRoleFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => RoleSchema).optional(),
});

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.strictObject({
  set: z.boolean().optional(),
});

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional(),
});

export const SessionCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
});

export const AccountCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
});

export const IssueCreateNestedManyWithoutCreatorInputSchema: z.ZodType<Prisma.IssueCreateNestedManyWithoutCreatorInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutCreatorInputSchema), z.lazy(() => IssueCreateWithoutCreatorInputSchema).array(), z.lazy(() => IssueUncheckedCreateWithoutCreatorInputSchema), z.lazy(() => IssueUncheckedCreateWithoutCreatorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueCreateOrConnectWithoutCreatorInputSchema), z.lazy(() => IssueCreateOrConnectWithoutCreatorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueCreateManyCreatorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
});

export const IssueCreateNestedManyWithoutAssigneeInputSchema: z.ZodType<Prisma.IssueCreateNestedManyWithoutAssigneeInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutAssigneeInputSchema), z.lazy(() => IssueCreateWithoutAssigneeInputSchema).array(), z.lazy(() => IssueUncheckedCreateWithoutAssigneeInputSchema), z.lazy(() => IssueUncheckedCreateWithoutAssigneeInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueCreateOrConnectWithoutAssigneeInputSchema), z.lazy(() => IssueCreateOrConnectWithoutAssigneeInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueCreateManyAssigneeInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
});

export const AttachmentCreateNestedManyWithoutUploaderInputSchema: z.ZodType<Prisma.AttachmentCreateNestedManyWithoutUploaderInput> = z.strictObject({
  create: z.union([ z.lazy(() => AttachmentCreateWithoutUploaderInputSchema), z.lazy(() => AttachmentCreateWithoutUploaderInputSchema).array(), z.lazy(() => AttachmentUncheckedCreateWithoutUploaderInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutUploaderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AttachmentCreateOrConnectWithoutUploaderInputSchema), z.lazy(() => AttachmentCreateOrConnectWithoutUploaderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AttachmentCreateManyUploaderInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
});

export const CommentCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.CommentCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => CommentCreateWithoutUserInputSchema), z.lazy(() => CommentCreateWithoutUserInputSchema).array(), z.lazy(() => CommentUncheckedCreateWithoutUserInputSchema), z.lazy(() => CommentUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CommentCreateOrConnectWithoutUserInputSchema), z.lazy(() => CommentCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CommentCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.NotificationCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutUserInputSchema), z.lazy(() => NotificationCreateWithoutUserInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutUserInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutUserInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const IssueHistoryCreateNestedManyWithoutActorInputSchema: z.ZodType<Prisma.IssueHistoryCreateNestedManyWithoutActorInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutActorInputSchema), z.lazy(() => IssueHistoryCreateWithoutActorInputSchema).array(), z.lazy(() => IssueHistoryUncheckedCreateWithoutActorInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutActorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueHistoryCreateOrConnectWithoutActorInputSchema), z.lazy(() => IssueHistoryCreateOrConnectWithoutActorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueHistoryCreateManyActorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
});

export const SessionUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
});

export const AccountUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
});

export const IssueUncheckedCreateNestedManyWithoutCreatorInputSchema: z.ZodType<Prisma.IssueUncheckedCreateNestedManyWithoutCreatorInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutCreatorInputSchema), z.lazy(() => IssueCreateWithoutCreatorInputSchema).array(), z.lazy(() => IssueUncheckedCreateWithoutCreatorInputSchema), z.lazy(() => IssueUncheckedCreateWithoutCreatorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueCreateOrConnectWithoutCreatorInputSchema), z.lazy(() => IssueCreateOrConnectWithoutCreatorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueCreateManyCreatorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
});

export const IssueUncheckedCreateNestedManyWithoutAssigneeInputSchema: z.ZodType<Prisma.IssueUncheckedCreateNestedManyWithoutAssigneeInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutAssigneeInputSchema), z.lazy(() => IssueCreateWithoutAssigneeInputSchema).array(), z.lazy(() => IssueUncheckedCreateWithoutAssigneeInputSchema), z.lazy(() => IssueUncheckedCreateWithoutAssigneeInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueCreateOrConnectWithoutAssigneeInputSchema), z.lazy(() => IssueCreateOrConnectWithoutAssigneeInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueCreateManyAssigneeInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
});

export const AttachmentUncheckedCreateNestedManyWithoutUploaderInputSchema: z.ZodType<Prisma.AttachmentUncheckedCreateNestedManyWithoutUploaderInput> = z.strictObject({
  create: z.union([ z.lazy(() => AttachmentCreateWithoutUploaderInputSchema), z.lazy(() => AttachmentCreateWithoutUploaderInputSchema).array(), z.lazy(() => AttachmentUncheckedCreateWithoutUploaderInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutUploaderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AttachmentCreateOrConnectWithoutUploaderInputSchema), z.lazy(() => AttachmentCreateOrConnectWithoutUploaderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AttachmentCreateManyUploaderInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
});

export const CommentUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.CommentUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => CommentCreateWithoutUserInputSchema), z.lazy(() => CommentCreateWithoutUserInputSchema).array(), z.lazy(() => CommentUncheckedCreateWithoutUserInputSchema), z.lazy(() => CommentUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CommentCreateOrConnectWithoutUserInputSchema), z.lazy(() => CommentCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CommentCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateNestedManyWithoutUserInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutUserInputSchema), z.lazy(() => NotificationCreateWithoutUserInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutUserInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutUserInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const IssueHistoryUncheckedCreateNestedManyWithoutActorInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedCreateNestedManyWithoutActorInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutActorInputSchema), z.lazy(() => IssueHistoryCreateWithoutActorInputSchema).array(), z.lazy(() => IssueHistoryUncheckedCreateWithoutActorInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutActorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueHistoryCreateOrConnectWithoutActorInputSchema), z.lazy(() => IssueHistoryCreateOrConnectWithoutActorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueHistoryCreateManyActorInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
});

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export const SessionUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SessionUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
});

export const AccountUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.AccountUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
});

export const IssueUpdateManyWithoutCreatorNestedInputSchema: z.ZodType<Prisma.IssueUpdateManyWithoutCreatorNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutCreatorInputSchema), z.lazy(() => IssueCreateWithoutCreatorInputSchema).array(), z.lazy(() => IssueUncheckedCreateWithoutCreatorInputSchema), z.lazy(() => IssueUncheckedCreateWithoutCreatorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueCreateOrConnectWithoutCreatorInputSchema), z.lazy(() => IssueCreateOrConnectWithoutCreatorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => IssueUpsertWithWhereUniqueWithoutCreatorInputSchema), z.lazy(() => IssueUpsertWithWhereUniqueWithoutCreatorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueCreateManyCreatorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => IssueUpdateWithWhereUniqueWithoutCreatorInputSchema), z.lazy(() => IssueUpdateWithWhereUniqueWithoutCreatorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => IssueUpdateManyWithWhereWithoutCreatorInputSchema), z.lazy(() => IssueUpdateManyWithWhereWithoutCreatorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => IssueScalarWhereInputSchema), z.lazy(() => IssueScalarWhereInputSchema).array() ]).optional(),
});

export const IssueUpdateManyWithoutAssigneeNestedInputSchema: z.ZodType<Prisma.IssueUpdateManyWithoutAssigneeNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutAssigneeInputSchema), z.lazy(() => IssueCreateWithoutAssigneeInputSchema).array(), z.lazy(() => IssueUncheckedCreateWithoutAssigneeInputSchema), z.lazy(() => IssueUncheckedCreateWithoutAssigneeInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueCreateOrConnectWithoutAssigneeInputSchema), z.lazy(() => IssueCreateOrConnectWithoutAssigneeInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => IssueUpsertWithWhereUniqueWithoutAssigneeInputSchema), z.lazy(() => IssueUpsertWithWhereUniqueWithoutAssigneeInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueCreateManyAssigneeInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => IssueUpdateWithWhereUniqueWithoutAssigneeInputSchema), z.lazy(() => IssueUpdateWithWhereUniqueWithoutAssigneeInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => IssueUpdateManyWithWhereWithoutAssigneeInputSchema), z.lazy(() => IssueUpdateManyWithWhereWithoutAssigneeInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => IssueScalarWhereInputSchema), z.lazy(() => IssueScalarWhereInputSchema).array() ]).optional(),
});

export const AttachmentUpdateManyWithoutUploaderNestedInputSchema: z.ZodType<Prisma.AttachmentUpdateManyWithoutUploaderNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AttachmentCreateWithoutUploaderInputSchema), z.lazy(() => AttachmentCreateWithoutUploaderInputSchema).array(), z.lazy(() => AttachmentUncheckedCreateWithoutUploaderInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutUploaderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AttachmentCreateOrConnectWithoutUploaderInputSchema), z.lazy(() => AttachmentCreateOrConnectWithoutUploaderInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AttachmentUpsertWithWhereUniqueWithoutUploaderInputSchema), z.lazy(() => AttachmentUpsertWithWhereUniqueWithoutUploaderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AttachmentCreateManyUploaderInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AttachmentUpdateWithWhereUniqueWithoutUploaderInputSchema), z.lazy(() => AttachmentUpdateWithWhereUniqueWithoutUploaderInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AttachmentUpdateManyWithWhereWithoutUploaderInputSchema), z.lazy(() => AttachmentUpdateManyWithWhereWithoutUploaderInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AttachmentScalarWhereInputSchema), z.lazy(() => AttachmentScalarWhereInputSchema).array() ]).optional(),
});

export const CommentUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.CommentUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CommentCreateWithoutUserInputSchema), z.lazy(() => CommentCreateWithoutUserInputSchema).array(), z.lazy(() => CommentUncheckedCreateWithoutUserInputSchema), z.lazy(() => CommentUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CommentCreateOrConnectWithoutUserInputSchema), z.lazy(() => CommentCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CommentUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => CommentUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CommentCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CommentUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => CommentUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CommentUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => CommentUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CommentScalarWhereInputSchema), z.lazy(() => CommentScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutUserInputSchema), z.lazy(() => NotificationCreateWithoutUserInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutUserInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutUserInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const IssueHistoryUpdateManyWithoutActorNestedInputSchema: z.ZodType<Prisma.IssueHistoryUpdateManyWithoutActorNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutActorInputSchema), z.lazy(() => IssueHistoryCreateWithoutActorInputSchema).array(), z.lazy(() => IssueHistoryUncheckedCreateWithoutActorInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutActorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueHistoryCreateOrConnectWithoutActorInputSchema), z.lazy(() => IssueHistoryCreateOrConnectWithoutActorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => IssueHistoryUpsertWithWhereUniqueWithoutActorInputSchema), z.lazy(() => IssueHistoryUpsertWithWhereUniqueWithoutActorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueHistoryCreateManyActorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => IssueHistoryUpdateWithWhereUniqueWithoutActorInputSchema), z.lazy(() => IssueHistoryUpdateWithWhereUniqueWithoutActorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => IssueHistoryUpdateManyWithWhereWithoutActorInputSchema), z.lazy(() => IssueHistoryUpdateManyWithWhereWithoutActorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => IssueHistoryScalarWhereInputSchema), z.lazy(() => IssueHistoryScalarWhereInputSchema).array() ]).optional(),
});

export const SessionUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionCreateWithoutUserInputSchema).array(), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema), z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SessionCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SessionWhereUniqueInputSchema), z.lazy(() => SessionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
});

export const AccountUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountCreateWithoutUserInputSchema).array(), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema), z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AccountCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AccountWhereUniqueInputSchema), z.lazy(() => AccountWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
});

export const IssueUncheckedUpdateManyWithoutCreatorNestedInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateManyWithoutCreatorNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutCreatorInputSchema), z.lazy(() => IssueCreateWithoutCreatorInputSchema).array(), z.lazy(() => IssueUncheckedCreateWithoutCreatorInputSchema), z.lazy(() => IssueUncheckedCreateWithoutCreatorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueCreateOrConnectWithoutCreatorInputSchema), z.lazy(() => IssueCreateOrConnectWithoutCreatorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => IssueUpsertWithWhereUniqueWithoutCreatorInputSchema), z.lazy(() => IssueUpsertWithWhereUniqueWithoutCreatorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueCreateManyCreatorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => IssueUpdateWithWhereUniqueWithoutCreatorInputSchema), z.lazy(() => IssueUpdateWithWhereUniqueWithoutCreatorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => IssueUpdateManyWithWhereWithoutCreatorInputSchema), z.lazy(() => IssueUpdateManyWithWhereWithoutCreatorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => IssueScalarWhereInputSchema), z.lazy(() => IssueScalarWhereInputSchema).array() ]).optional(),
});

export const IssueUncheckedUpdateManyWithoutAssigneeNestedInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateManyWithoutAssigneeNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutAssigneeInputSchema), z.lazy(() => IssueCreateWithoutAssigneeInputSchema).array(), z.lazy(() => IssueUncheckedCreateWithoutAssigneeInputSchema), z.lazy(() => IssueUncheckedCreateWithoutAssigneeInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueCreateOrConnectWithoutAssigneeInputSchema), z.lazy(() => IssueCreateOrConnectWithoutAssigneeInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => IssueUpsertWithWhereUniqueWithoutAssigneeInputSchema), z.lazy(() => IssueUpsertWithWhereUniqueWithoutAssigneeInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueCreateManyAssigneeInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => IssueWhereUniqueInputSchema), z.lazy(() => IssueWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => IssueUpdateWithWhereUniqueWithoutAssigneeInputSchema), z.lazy(() => IssueUpdateWithWhereUniqueWithoutAssigneeInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => IssueUpdateManyWithWhereWithoutAssigneeInputSchema), z.lazy(() => IssueUpdateManyWithWhereWithoutAssigneeInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => IssueScalarWhereInputSchema), z.lazy(() => IssueScalarWhereInputSchema).array() ]).optional(),
});

export const AttachmentUncheckedUpdateManyWithoutUploaderNestedInputSchema: z.ZodType<Prisma.AttachmentUncheckedUpdateManyWithoutUploaderNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AttachmentCreateWithoutUploaderInputSchema), z.lazy(() => AttachmentCreateWithoutUploaderInputSchema).array(), z.lazy(() => AttachmentUncheckedCreateWithoutUploaderInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutUploaderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AttachmentCreateOrConnectWithoutUploaderInputSchema), z.lazy(() => AttachmentCreateOrConnectWithoutUploaderInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AttachmentUpsertWithWhereUniqueWithoutUploaderInputSchema), z.lazy(() => AttachmentUpsertWithWhereUniqueWithoutUploaderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AttachmentCreateManyUploaderInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AttachmentUpdateWithWhereUniqueWithoutUploaderInputSchema), z.lazy(() => AttachmentUpdateWithWhereUniqueWithoutUploaderInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AttachmentUpdateManyWithWhereWithoutUploaderInputSchema), z.lazy(() => AttachmentUpdateManyWithWhereWithoutUploaderInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AttachmentScalarWhereInputSchema), z.lazy(() => AttachmentScalarWhereInputSchema).array() ]).optional(),
});

export const CommentUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.CommentUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CommentCreateWithoutUserInputSchema), z.lazy(() => CommentCreateWithoutUserInputSchema).array(), z.lazy(() => CommentUncheckedCreateWithoutUserInputSchema), z.lazy(() => CommentUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CommentCreateOrConnectWithoutUserInputSchema), z.lazy(() => CommentCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CommentUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => CommentUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CommentCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CommentUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => CommentUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CommentUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => CommentUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CommentScalarWhereInputSchema), z.lazy(() => CommentScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutUserNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutUserInputSchema), z.lazy(() => NotificationCreateWithoutUserInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutUserInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutUserInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutUserInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutUserInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutUserInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const IssueHistoryUncheckedUpdateManyWithoutActorNestedInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedUpdateManyWithoutActorNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutActorInputSchema), z.lazy(() => IssueHistoryCreateWithoutActorInputSchema).array(), z.lazy(() => IssueHistoryUncheckedCreateWithoutActorInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutActorInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueHistoryCreateOrConnectWithoutActorInputSchema), z.lazy(() => IssueHistoryCreateOrConnectWithoutActorInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => IssueHistoryUpsertWithWhereUniqueWithoutActorInputSchema), z.lazy(() => IssueHistoryUpsertWithWhereUniqueWithoutActorInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueHistoryCreateManyActorInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => IssueHistoryUpdateWithWhereUniqueWithoutActorInputSchema), z.lazy(() => IssueHistoryUpdateWithWhereUniqueWithoutActorInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => IssueHistoryUpdateManyWithWhereWithoutActorInputSchema), z.lazy(() => IssueHistoryUpdateManyWithWhereWithoutActorInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => IssueHistoryScalarWhereInputSchema), z.lazy(() => IssueHistoryScalarWhereInputSchema).array() ]).optional(),
});

export const UserCreateNestedOneWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSessionsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSessionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const UserUpdateOneRequiredWithoutSessionsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutSessionsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSessionsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutSessionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutSessionsInputSchema), z.lazy(() => UserUpdateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutAccountsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutAccountsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional().nullable(),
});

export const UserUpdateOneRequiredWithoutAccountsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutAccountsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutAccountsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutAccountsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutAccountsInputSchema), z.lazy(() => UserUpdateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutIssuesInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutIssuesInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutIssuesInputSchema), z.lazy(() => UserUncheckedCreateWithoutIssuesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutIssuesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const UserCreateNestedOneWithoutAssignedIssuesInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutAssignedIssuesInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutAssignedIssuesInputSchema), z.lazy(() => UserUncheckedCreateWithoutAssignedIssuesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutAssignedIssuesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const ScreenshotCreateNestedManyWithoutIssueInputSchema: z.ZodType<Prisma.ScreenshotCreateNestedManyWithoutIssueInput> = z.strictObject({
  create: z.union([ z.lazy(() => ScreenshotCreateWithoutIssueInputSchema), z.lazy(() => ScreenshotCreateWithoutIssueInputSchema).array(), z.lazy(() => ScreenshotUncheckedCreateWithoutIssueInputSchema), z.lazy(() => ScreenshotUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ScreenshotCreateOrConnectWithoutIssueInputSchema), z.lazy(() => ScreenshotCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ScreenshotCreateManyIssueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ScreenshotWhereUniqueInputSchema), z.lazy(() => ScreenshotWhereUniqueInputSchema).array() ]).optional(),
});

export const AttachmentCreateNestedManyWithoutIssueInputSchema: z.ZodType<Prisma.AttachmentCreateNestedManyWithoutIssueInput> = z.strictObject({
  create: z.union([ z.lazy(() => AttachmentCreateWithoutIssueInputSchema), z.lazy(() => AttachmentCreateWithoutIssueInputSchema).array(), z.lazy(() => AttachmentUncheckedCreateWithoutIssueInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AttachmentCreateOrConnectWithoutIssueInputSchema), z.lazy(() => AttachmentCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AttachmentCreateManyIssueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
});

export const CommentCreateNestedManyWithoutIssueInputSchema: z.ZodType<Prisma.CommentCreateNestedManyWithoutIssueInput> = z.strictObject({
  create: z.union([ z.lazy(() => CommentCreateWithoutIssueInputSchema), z.lazy(() => CommentCreateWithoutIssueInputSchema).array(), z.lazy(() => CommentUncheckedCreateWithoutIssueInputSchema), z.lazy(() => CommentUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CommentCreateOrConnectWithoutIssueInputSchema), z.lazy(() => CommentCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CommentCreateManyIssueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
});

export const IssueHistoryCreateNestedManyWithoutIssueInputSchema: z.ZodType<Prisma.IssueHistoryCreateNestedManyWithoutIssueInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutIssueInputSchema), z.lazy(() => IssueHistoryCreateWithoutIssueInputSchema).array(), z.lazy(() => IssueHistoryUncheckedCreateWithoutIssueInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueHistoryCreateOrConnectWithoutIssueInputSchema), z.lazy(() => IssueHistoryCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueHistoryCreateManyIssueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationCreateNestedManyWithoutIssueInputSchema: z.ZodType<Prisma.NotificationCreateNestedManyWithoutIssueInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutIssueInputSchema), z.lazy(() => NotificationCreateWithoutIssueInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutIssueInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutIssueInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyIssueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const ScreenshotUncheckedCreateNestedManyWithoutIssueInputSchema: z.ZodType<Prisma.ScreenshotUncheckedCreateNestedManyWithoutIssueInput> = z.strictObject({
  create: z.union([ z.lazy(() => ScreenshotCreateWithoutIssueInputSchema), z.lazy(() => ScreenshotCreateWithoutIssueInputSchema).array(), z.lazy(() => ScreenshotUncheckedCreateWithoutIssueInputSchema), z.lazy(() => ScreenshotUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ScreenshotCreateOrConnectWithoutIssueInputSchema), z.lazy(() => ScreenshotCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ScreenshotCreateManyIssueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ScreenshotWhereUniqueInputSchema), z.lazy(() => ScreenshotWhereUniqueInputSchema).array() ]).optional(),
});

export const AttachmentUncheckedCreateNestedManyWithoutIssueInputSchema: z.ZodType<Prisma.AttachmentUncheckedCreateNestedManyWithoutIssueInput> = z.strictObject({
  create: z.union([ z.lazy(() => AttachmentCreateWithoutIssueInputSchema), z.lazy(() => AttachmentCreateWithoutIssueInputSchema).array(), z.lazy(() => AttachmentUncheckedCreateWithoutIssueInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AttachmentCreateOrConnectWithoutIssueInputSchema), z.lazy(() => AttachmentCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AttachmentCreateManyIssueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
});

export const CommentUncheckedCreateNestedManyWithoutIssueInputSchema: z.ZodType<Prisma.CommentUncheckedCreateNestedManyWithoutIssueInput> = z.strictObject({
  create: z.union([ z.lazy(() => CommentCreateWithoutIssueInputSchema), z.lazy(() => CommentCreateWithoutIssueInputSchema).array(), z.lazy(() => CommentUncheckedCreateWithoutIssueInputSchema), z.lazy(() => CommentUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CommentCreateOrConnectWithoutIssueInputSchema), z.lazy(() => CommentCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CommentCreateManyIssueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
});

export const IssueHistoryUncheckedCreateNestedManyWithoutIssueInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedCreateNestedManyWithoutIssueInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutIssueInputSchema), z.lazy(() => IssueHistoryCreateWithoutIssueInputSchema).array(), z.lazy(() => IssueHistoryUncheckedCreateWithoutIssueInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueHistoryCreateOrConnectWithoutIssueInputSchema), z.lazy(() => IssueHistoryCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueHistoryCreateManyIssueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
});

export const NotificationUncheckedCreateNestedManyWithoutIssueInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateNestedManyWithoutIssueInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutIssueInputSchema), z.lazy(() => NotificationCreateWithoutIssueInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutIssueInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutIssueInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyIssueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
});

export const EnumIssueTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumIssueTypeFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => IssueTypeSchema).optional(),
});

export const EnumPriorityFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumPriorityFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => PrioritySchema).optional(),
});

export const EnumSeverityFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumSeverityFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => SeveritySchema).optional(),
});

export const EnumIssueStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumIssueStatusFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => IssueStatusSchema).optional(),
});

export const UserUpdateOneRequiredWithoutIssuesNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutIssuesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutIssuesInputSchema), z.lazy(() => UserUncheckedCreateWithoutIssuesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutIssuesInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutIssuesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutIssuesInputSchema), z.lazy(() => UserUpdateWithoutIssuesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutIssuesInputSchema) ]).optional(),
});

export const UserUpdateOneWithoutAssignedIssuesNestedInputSchema: z.ZodType<Prisma.UserUpdateOneWithoutAssignedIssuesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutAssignedIssuesInputSchema), z.lazy(() => UserUncheckedCreateWithoutAssignedIssuesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutAssignedIssuesInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutAssignedIssuesInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutAssignedIssuesInputSchema), z.lazy(() => UserUpdateWithoutAssignedIssuesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAssignedIssuesInputSchema) ]).optional(),
});

export const ScreenshotUpdateManyWithoutIssueNestedInputSchema: z.ZodType<Prisma.ScreenshotUpdateManyWithoutIssueNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ScreenshotCreateWithoutIssueInputSchema), z.lazy(() => ScreenshotCreateWithoutIssueInputSchema).array(), z.lazy(() => ScreenshotUncheckedCreateWithoutIssueInputSchema), z.lazy(() => ScreenshotUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ScreenshotCreateOrConnectWithoutIssueInputSchema), z.lazy(() => ScreenshotCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ScreenshotUpsertWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => ScreenshotUpsertWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ScreenshotCreateManyIssueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ScreenshotWhereUniqueInputSchema), z.lazy(() => ScreenshotWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ScreenshotWhereUniqueInputSchema), z.lazy(() => ScreenshotWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ScreenshotWhereUniqueInputSchema), z.lazy(() => ScreenshotWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ScreenshotWhereUniqueInputSchema), z.lazy(() => ScreenshotWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ScreenshotUpdateWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => ScreenshotUpdateWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ScreenshotUpdateManyWithWhereWithoutIssueInputSchema), z.lazy(() => ScreenshotUpdateManyWithWhereWithoutIssueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ScreenshotScalarWhereInputSchema), z.lazy(() => ScreenshotScalarWhereInputSchema).array() ]).optional(),
});

export const AttachmentUpdateManyWithoutIssueNestedInputSchema: z.ZodType<Prisma.AttachmentUpdateManyWithoutIssueNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AttachmentCreateWithoutIssueInputSchema), z.lazy(() => AttachmentCreateWithoutIssueInputSchema).array(), z.lazy(() => AttachmentUncheckedCreateWithoutIssueInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AttachmentCreateOrConnectWithoutIssueInputSchema), z.lazy(() => AttachmentCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AttachmentUpsertWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => AttachmentUpsertWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AttachmentCreateManyIssueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AttachmentUpdateWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => AttachmentUpdateWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AttachmentUpdateManyWithWhereWithoutIssueInputSchema), z.lazy(() => AttachmentUpdateManyWithWhereWithoutIssueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AttachmentScalarWhereInputSchema), z.lazy(() => AttachmentScalarWhereInputSchema).array() ]).optional(),
});

export const CommentUpdateManyWithoutIssueNestedInputSchema: z.ZodType<Prisma.CommentUpdateManyWithoutIssueNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CommentCreateWithoutIssueInputSchema), z.lazy(() => CommentCreateWithoutIssueInputSchema).array(), z.lazy(() => CommentUncheckedCreateWithoutIssueInputSchema), z.lazy(() => CommentUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CommentCreateOrConnectWithoutIssueInputSchema), z.lazy(() => CommentCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CommentUpsertWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => CommentUpsertWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CommentCreateManyIssueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CommentUpdateWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => CommentUpdateWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CommentUpdateManyWithWhereWithoutIssueInputSchema), z.lazy(() => CommentUpdateManyWithWhereWithoutIssueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CommentScalarWhereInputSchema), z.lazy(() => CommentScalarWhereInputSchema).array() ]).optional(),
});

export const IssueHistoryUpdateManyWithoutIssueNestedInputSchema: z.ZodType<Prisma.IssueHistoryUpdateManyWithoutIssueNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutIssueInputSchema), z.lazy(() => IssueHistoryCreateWithoutIssueInputSchema).array(), z.lazy(() => IssueHistoryUncheckedCreateWithoutIssueInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueHistoryCreateOrConnectWithoutIssueInputSchema), z.lazy(() => IssueHistoryCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => IssueHistoryUpsertWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => IssueHistoryUpsertWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueHistoryCreateManyIssueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => IssueHistoryUpdateWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => IssueHistoryUpdateWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => IssueHistoryUpdateManyWithWhereWithoutIssueInputSchema), z.lazy(() => IssueHistoryUpdateManyWithWhereWithoutIssueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => IssueHistoryScalarWhereInputSchema), z.lazy(() => IssueHistoryScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUpdateManyWithoutIssueNestedInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithoutIssueNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutIssueInputSchema), z.lazy(() => NotificationCreateWithoutIssueInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutIssueInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutIssueInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyIssueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutIssueInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutIssueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const ScreenshotUncheckedUpdateManyWithoutIssueNestedInputSchema: z.ZodType<Prisma.ScreenshotUncheckedUpdateManyWithoutIssueNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ScreenshotCreateWithoutIssueInputSchema), z.lazy(() => ScreenshotCreateWithoutIssueInputSchema).array(), z.lazy(() => ScreenshotUncheckedCreateWithoutIssueInputSchema), z.lazy(() => ScreenshotUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ScreenshotCreateOrConnectWithoutIssueInputSchema), z.lazy(() => ScreenshotCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ScreenshotUpsertWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => ScreenshotUpsertWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ScreenshotCreateManyIssueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ScreenshotWhereUniqueInputSchema), z.lazy(() => ScreenshotWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ScreenshotWhereUniqueInputSchema), z.lazy(() => ScreenshotWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ScreenshotWhereUniqueInputSchema), z.lazy(() => ScreenshotWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ScreenshotWhereUniqueInputSchema), z.lazy(() => ScreenshotWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ScreenshotUpdateWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => ScreenshotUpdateWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ScreenshotUpdateManyWithWhereWithoutIssueInputSchema), z.lazy(() => ScreenshotUpdateManyWithWhereWithoutIssueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ScreenshotScalarWhereInputSchema), z.lazy(() => ScreenshotScalarWhereInputSchema).array() ]).optional(),
});

export const AttachmentUncheckedUpdateManyWithoutIssueNestedInputSchema: z.ZodType<Prisma.AttachmentUncheckedUpdateManyWithoutIssueNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => AttachmentCreateWithoutIssueInputSchema), z.lazy(() => AttachmentCreateWithoutIssueInputSchema).array(), z.lazy(() => AttachmentUncheckedCreateWithoutIssueInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AttachmentCreateOrConnectWithoutIssueInputSchema), z.lazy(() => AttachmentCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AttachmentUpsertWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => AttachmentUpsertWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AttachmentCreateManyIssueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AttachmentWhereUniqueInputSchema), z.lazy(() => AttachmentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AttachmentUpdateWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => AttachmentUpdateWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AttachmentUpdateManyWithWhereWithoutIssueInputSchema), z.lazy(() => AttachmentUpdateManyWithWhereWithoutIssueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AttachmentScalarWhereInputSchema), z.lazy(() => AttachmentScalarWhereInputSchema).array() ]).optional(),
});

export const CommentUncheckedUpdateManyWithoutIssueNestedInputSchema: z.ZodType<Prisma.CommentUncheckedUpdateManyWithoutIssueNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => CommentCreateWithoutIssueInputSchema), z.lazy(() => CommentCreateWithoutIssueInputSchema).array(), z.lazy(() => CommentUncheckedCreateWithoutIssueInputSchema), z.lazy(() => CommentUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CommentCreateOrConnectWithoutIssueInputSchema), z.lazy(() => CommentCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CommentUpsertWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => CommentUpsertWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CommentCreateManyIssueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CommentWhereUniqueInputSchema), z.lazy(() => CommentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CommentUpdateWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => CommentUpdateWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CommentUpdateManyWithWhereWithoutIssueInputSchema), z.lazy(() => CommentUpdateManyWithWhereWithoutIssueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CommentScalarWhereInputSchema), z.lazy(() => CommentScalarWhereInputSchema).array() ]).optional(),
});

export const IssueHistoryUncheckedUpdateManyWithoutIssueNestedInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedUpdateManyWithoutIssueNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutIssueInputSchema), z.lazy(() => IssueHistoryCreateWithoutIssueInputSchema).array(), z.lazy(() => IssueHistoryUncheckedCreateWithoutIssueInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => IssueHistoryCreateOrConnectWithoutIssueInputSchema), z.lazy(() => IssueHistoryCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => IssueHistoryUpsertWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => IssueHistoryUpsertWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => IssueHistoryCreateManyIssueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => IssueHistoryWhereUniqueInputSchema), z.lazy(() => IssueHistoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => IssueHistoryUpdateWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => IssueHistoryUpdateWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => IssueHistoryUpdateManyWithWhereWithoutIssueInputSchema), z.lazy(() => IssueHistoryUpdateManyWithWhereWithoutIssueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => IssueHistoryScalarWhereInputSchema), z.lazy(() => IssueHistoryScalarWhereInputSchema).array() ]).optional(),
});

export const NotificationUncheckedUpdateManyWithoutIssueNestedInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutIssueNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => NotificationCreateWithoutIssueInputSchema), z.lazy(() => NotificationCreateWithoutIssueInputSchema).array(), z.lazy(() => NotificationUncheckedCreateWithoutIssueInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutIssueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => NotificationCreateOrConnectWithoutIssueInputSchema), z.lazy(() => NotificationCreateOrConnectWithoutIssueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => NotificationUpsertWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => NotificationUpsertWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => NotificationCreateManyIssueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => NotificationWhereUniqueInputSchema), z.lazy(() => NotificationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => NotificationUpdateWithWhereUniqueWithoutIssueInputSchema), z.lazy(() => NotificationUpdateWithWhereUniqueWithoutIssueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => NotificationUpdateManyWithWhereWithoutIssueInputSchema), z.lazy(() => NotificationUpdateManyWithWhereWithoutIssueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
});

export const IssueCreateNestedOneWithoutScreenshotsInputSchema: z.ZodType<Prisma.IssueCreateNestedOneWithoutScreenshotsInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutScreenshotsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutScreenshotsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => IssueCreateOrConnectWithoutScreenshotsInputSchema).optional(),
  connect: z.lazy(() => IssueWhereUniqueInputSchema).optional(),
});

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.strictObject({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional(),
});

export const IssueUpdateOneRequiredWithoutScreenshotsNestedInputSchema: z.ZodType<Prisma.IssueUpdateOneRequiredWithoutScreenshotsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutScreenshotsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutScreenshotsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => IssueCreateOrConnectWithoutScreenshotsInputSchema).optional(),
  upsert: z.lazy(() => IssueUpsertWithoutScreenshotsInputSchema).optional(),
  connect: z.lazy(() => IssueWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => IssueUpdateToOneWithWhereWithoutScreenshotsInputSchema), z.lazy(() => IssueUpdateWithoutScreenshotsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutScreenshotsInputSchema) ]).optional(),
});

export const IssueCreateNestedOneWithoutAttachmentsInputSchema: z.ZodType<Prisma.IssueCreateNestedOneWithoutAttachmentsInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutAttachmentsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutAttachmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => IssueCreateOrConnectWithoutAttachmentsInputSchema).optional(),
  connect: z.lazy(() => IssueWhereUniqueInputSchema).optional(),
});

export const UserCreateNestedOneWithoutAttachmentsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutAttachmentsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutAttachmentsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAttachmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutAttachmentsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const IssueUpdateOneRequiredWithoutAttachmentsNestedInputSchema: z.ZodType<Prisma.IssueUpdateOneRequiredWithoutAttachmentsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutAttachmentsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutAttachmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => IssueCreateOrConnectWithoutAttachmentsInputSchema).optional(),
  upsert: z.lazy(() => IssueUpsertWithoutAttachmentsInputSchema).optional(),
  connect: z.lazy(() => IssueWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => IssueUpdateToOneWithWhereWithoutAttachmentsInputSchema), z.lazy(() => IssueUpdateWithoutAttachmentsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutAttachmentsInputSchema) ]).optional(),
});

export const UserUpdateOneRequiredWithoutAttachmentsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutAttachmentsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutAttachmentsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAttachmentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutAttachmentsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutAttachmentsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutAttachmentsInputSchema), z.lazy(() => UserUpdateWithoutAttachmentsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAttachmentsInputSchema) ]).optional(),
});

export const IssueCreateNestedOneWithoutCommentsInputSchema: z.ZodType<Prisma.IssueCreateNestedOneWithoutCommentsInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutCommentsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutCommentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => IssueCreateOrConnectWithoutCommentsInputSchema).optional(),
  connect: z.lazy(() => IssueWhereUniqueInputSchema).optional(),
});

export const UserCreateNestedOneWithoutCommentsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCommentsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutCommentsInputSchema), z.lazy(() => UserUncheckedCreateWithoutCommentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCommentsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const IssueUpdateOneRequiredWithoutCommentsNestedInputSchema: z.ZodType<Prisma.IssueUpdateOneRequiredWithoutCommentsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutCommentsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutCommentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => IssueCreateOrConnectWithoutCommentsInputSchema).optional(),
  upsert: z.lazy(() => IssueUpsertWithoutCommentsInputSchema).optional(),
  connect: z.lazy(() => IssueWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => IssueUpdateToOneWithWhereWithoutCommentsInputSchema), z.lazy(() => IssueUpdateWithoutCommentsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutCommentsInputSchema) ]).optional(),
});

export const UserUpdateOneRequiredWithoutCommentsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutCommentsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutCommentsInputSchema), z.lazy(() => UserUncheckedCreateWithoutCommentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCommentsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutCommentsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutCommentsInputSchema), z.lazy(() => UserUpdateWithoutCommentsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutCommentsInputSchema) ]).optional(),
});

export const IssueCreateNestedOneWithoutHistoryInputSchema: z.ZodType<Prisma.IssueCreateNestedOneWithoutHistoryInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutHistoryInputSchema), z.lazy(() => IssueUncheckedCreateWithoutHistoryInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => IssueCreateOrConnectWithoutHistoryInputSchema).optional(),
  connect: z.lazy(() => IssueWhereUniqueInputSchema).optional(),
});

export const UserCreateNestedOneWithoutHistoryActionsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutHistoryActionsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutHistoryActionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutHistoryActionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutHistoryActionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const EnumHistoryEventFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumHistoryEventFieldUpdateOperationsInput> = z.strictObject({
  set: z.lazy(() => HistoryEventSchema).optional(),
});

export const IssueUpdateOneRequiredWithoutHistoryNestedInputSchema: z.ZodType<Prisma.IssueUpdateOneRequiredWithoutHistoryNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutHistoryInputSchema), z.lazy(() => IssueUncheckedCreateWithoutHistoryInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => IssueCreateOrConnectWithoutHistoryInputSchema).optional(),
  upsert: z.lazy(() => IssueUpsertWithoutHistoryInputSchema).optional(),
  connect: z.lazy(() => IssueWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => IssueUpdateToOneWithWhereWithoutHistoryInputSchema), z.lazy(() => IssueUpdateWithoutHistoryInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutHistoryInputSchema) ]).optional(),
});

export const UserUpdateOneRequiredWithoutHistoryActionsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutHistoryActionsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutHistoryActionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutHistoryActionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutHistoryActionsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutHistoryActionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutHistoryActionsInputSchema), z.lazy(() => UserUpdateWithoutHistoryActionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutHistoryActionsInputSchema) ]).optional(),
});

export const UserCreateNestedOneWithoutNotificationsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutNotificationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutNotificationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutNotificationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
});

export const IssueCreateNestedOneWithoutNotificationsInputSchema: z.ZodType<Prisma.IssueCreateNestedOneWithoutNotificationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutNotificationsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => IssueCreateOrConnectWithoutNotificationsInputSchema).optional(),
  connect: z.lazy(() => IssueWhereUniqueInputSchema).optional(),
});

export const UserUpdateOneRequiredWithoutNotificationsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutNotificationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => UserCreateWithoutNotificationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutNotificationsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutNotificationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutNotificationsInputSchema), z.lazy(() => UserUpdateWithoutNotificationsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutNotificationsInputSchema) ]).optional(),
});

export const IssueUpdateOneRequiredWithoutNotificationsNestedInputSchema: z.ZodType<Prisma.IssueUpdateOneRequiredWithoutNotificationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => IssueCreateWithoutNotificationsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutNotificationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => IssueCreateOrConnectWithoutNotificationsInputSchema).optional(),
  upsert: z.lazy(() => IssueUpsertWithoutNotificationsInputSchema).optional(),
  connect: z.lazy(() => IssueWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => IssueUpdateToOneWithWhereWithoutNotificationsInputSchema), z.lazy(() => IssueUpdateWithoutNotificationsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutNotificationsInputSchema) ]).optional(),
});

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
});

export const NestedEnumRoleFilterSchema: z.ZodType<Prisma.NestedEnumRoleFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleFilterSchema) ]).optional(),
});

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
});

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional(),
});

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
});

export const NestedEnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumRoleWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema), z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
});

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional(),
});

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
});

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
});

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.strictObject({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
});

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.strictObject({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
});

export const NestedEnumIssueTypeFilterSchema: z.ZodType<Prisma.NestedEnumIssueTypeFilter> = z.strictObject({
  equals: z.lazy(() => IssueTypeSchema).optional(),
  in: z.lazy(() => IssueTypeSchema).array().optional(),
  notIn: z.lazy(() => IssueTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => NestedEnumIssueTypeFilterSchema) ]).optional(),
});

export const NestedEnumPriorityFilterSchema: z.ZodType<Prisma.NestedEnumPriorityFilter> = z.strictObject({
  equals: z.lazy(() => PrioritySchema).optional(),
  in: z.lazy(() => PrioritySchema).array().optional(),
  notIn: z.lazy(() => PrioritySchema).array().optional(),
  not: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => NestedEnumPriorityFilterSchema) ]).optional(),
});

export const NestedEnumSeverityFilterSchema: z.ZodType<Prisma.NestedEnumSeverityFilter> = z.strictObject({
  equals: z.lazy(() => SeveritySchema).optional(),
  in: z.lazy(() => SeveritySchema).array().optional(),
  notIn: z.lazy(() => SeveritySchema).array().optional(),
  not: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => NestedEnumSeverityFilterSchema) ]).optional(),
});

export const NestedEnumIssueStatusFilterSchema: z.ZodType<Prisma.NestedEnumIssueStatusFilter> = z.strictObject({
  equals: z.lazy(() => IssueStatusSchema).optional(),
  in: z.lazy(() => IssueStatusSchema).array().optional(),
  notIn: z.lazy(() => IssueStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => NestedEnumIssueStatusFilterSchema) ]).optional(),
});

export const NestedEnumIssueTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumIssueTypeWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => IssueTypeSchema).optional(),
  in: z.lazy(() => IssueTypeSchema).array().optional(),
  notIn: z.lazy(() => IssueTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => NestedEnumIssueTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumIssueTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumIssueTypeFilterSchema).optional(),
});

export const NestedEnumPriorityWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumPriorityWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => PrioritySchema).optional(),
  in: z.lazy(() => PrioritySchema).array().optional(),
  notIn: z.lazy(() => PrioritySchema).array().optional(),
  not: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => NestedEnumPriorityWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPriorityFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPriorityFilterSchema).optional(),
});

export const NestedEnumSeverityWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumSeverityWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => SeveritySchema).optional(),
  in: z.lazy(() => SeveritySchema).array().optional(),
  notIn: z.lazy(() => SeveritySchema).array().optional(),
  not: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => NestedEnumSeverityWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSeverityFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSeverityFilterSchema).optional(),
});

export const NestedEnumIssueStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumIssueStatusWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => IssueStatusSchema).optional(),
  in: z.lazy(() => IssueStatusSchema).array().optional(),
  notIn: z.lazy(() => IssueStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => NestedEnumIssueStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumIssueStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumIssueStatusFilterSchema).optional(),
});

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional(),
});

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.strictObject({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
});

export const NestedEnumHistoryEventFilterSchema: z.ZodType<Prisma.NestedEnumHistoryEventFilter> = z.strictObject({
  equals: z.lazy(() => HistoryEventSchema).optional(),
  in: z.lazy(() => HistoryEventSchema).array().optional(),
  notIn: z.lazy(() => HistoryEventSchema).array().optional(),
  not: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => NestedEnumHistoryEventFilterSchema) ]).optional(),
});

export const NestedEnumHistoryEventWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumHistoryEventWithAggregatesFilter> = z.strictObject({
  equals: z.lazy(() => HistoryEventSchema).optional(),
  in: z.lazy(() => HistoryEventSchema).array().optional(),
  notIn: z.lazy(() => HistoryEventSchema).array().optional(),
  not: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => NestedEnumHistoryEventWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumHistoryEventFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumHistoryEventFilterSchema).optional(),
});

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> = z.strictObject({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
});

export const SessionCreateWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const SessionUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const SessionCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema) ]),
});

export const SessionCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.SessionCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => SessionCreateManyUserInputSchema), z.lazy(() => SessionCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const AccountCreateWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AccountUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AccountCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema) ]),
});

export const AccountCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.AccountCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => AccountCreateManyUserInputSchema), z.lazy(() => AccountCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const IssueCreateWithoutCreatorInputSchema: z.ZodType<Prisma.IssueCreateWithoutCreatorInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  assignee: z.lazy(() => UserCreateNestedOneWithoutAssignedIssuesInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueUncheckedCreateWithoutCreatorInputSchema: z.ZodType<Prisma.IssueUncheckedCreateWithoutCreatorInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  assigneeId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueCreateOrConnectWithoutCreatorInputSchema: z.ZodType<Prisma.IssueCreateOrConnectWithoutCreatorInput> = z.strictObject({
  where: z.lazy(() => IssueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => IssueCreateWithoutCreatorInputSchema), z.lazy(() => IssueUncheckedCreateWithoutCreatorInputSchema) ]),
});

export const IssueCreateManyCreatorInputEnvelopeSchema: z.ZodType<Prisma.IssueCreateManyCreatorInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => IssueCreateManyCreatorInputSchema), z.lazy(() => IssueCreateManyCreatorInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const IssueCreateWithoutAssigneeInputSchema: z.ZodType<Prisma.IssueCreateWithoutAssigneeInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  creator: z.lazy(() => UserCreateNestedOneWithoutIssuesInputSchema),
  screenshots: z.lazy(() => ScreenshotCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueUncheckedCreateWithoutAssigneeInputSchema: z.ZodType<Prisma.IssueUncheckedCreateWithoutAssigneeInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdBy: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueCreateOrConnectWithoutAssigneeInputSchema: z.ZodType<Prisma.IssueCreateOrConnectWithoutAssigneeInput> = z.strictObject({
  where: z.lazy(() => IssueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => IssueCreateWithoutAssigneeInputSchema), z.lazy(() => IssueUncheckedCreateWithoutAssigneeInputSchema) ]),
});

export const IssueCreateManyAssigneeInputEnvelopeSchema: z.ZodType<Prisma.IssueCreateManyAssigneeInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => IssueCreateManyAssigneeInputSchema), z.lazy(() => IssueCreateManyAssigneeInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const AttachmentCreateWithoutUploaderInputSchema: z.ZodType<Prisma.AttachmentCreateWithoutUploaderInput> = z.strictObject({
  id: z.uuid().optional(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  issue: z.lazy(() => IssueCreateNestedOneWithoutAttachmentsInputSchema),
});

export const AttachmentUncheckedCreateWithoutUploaderInputSchema: z.ZodType<Prisma.AttachmentUncheckedCreateWithoutUploaderInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const AttachmentCreateOrConnectWithoutUploaderInputSchema: z.ZodType<Prisma.AttachmentCreateOrConnectWithoutUploaderInput> = z.strictObject({
  where: z.lazy(() => AttachmentWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AttachmentCreateWithoutUploaderInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutUploaderInputSchema) ]),
});

export const AttachmentCreateManyUploaderInputEnvelopeSchema: z.ZodType<Prisma.AttachmentCreateManyUploaderInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => AttachmentCreateManyUploaderInputSchema), z.lazy(() => AttachmentCreateManyUploaderInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const CommentCreateWithoutUserInputSchema: z.ZodType<Prisma.CommentCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
  issue: z.lazy(() => IssueCreateNestedOneWithoutCommentsInputSchema),
});

export const CommentUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.CommentUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
});

export const CommentCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.CommentCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => CommentWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CommentCreateWithoutUserInputSchema), z.lazy(() => CommentUncheckedCreateWithoutUserInputSchema) ]),
});

export const CommentCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.CommentCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => CommentCreateManyUserInputSchema), z.lazy(() => CommentCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const NotificationCreateWithoutUserInputSchema: z.ZodType<Prisma.NotificationCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  message: z.string(),
  isRead: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  issue: z.lazy(() => IssueCreateNestedOneWithoutNotificationsInputSchema),
});

export const NotificationUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateWithoutUserInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  message: z.string(),
  isRead: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
});

export const NotificationCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.NotificationCreateOrConnectWithoutUserInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => NotificationCreateWithoutUserInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutUserInputSchema) ]),
});

export const NotificationCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.NotificationCreateManyUserInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => NotificationCreateManyUserInputSchema), z.lazy(() => NotificationCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const IssueHistoryCreateWithoutActorInputSchema: z.ZodType<Prisma.IssueHistoryCreateWithoutActorInput> = z.strictObject({
  id: z.uuid().optional(),
  eventType: z.lazy(() => HistoryEventSchema),
  description: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  issue: z.lazy(() => IssueCreateNestedOneWithoutHistoryInputSchema),
});

export const IssueHistoryUncheckedCreateWithoutActorInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedCreateWithoutActorInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  eventType: z.lazy(() => HistoryEventSchema),
  description: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
});

export const IssueHistoryCreateOrConnectWithoutActorInputSchema: z.ZodType<Prisma.IssueHistoryCreateOrConnectWithoutActorInput> = z.strictObject({
  where: z.lazy(() => IssueHistoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutActorInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutActorInputSchema) ]),
});

export const IssueHistoryCreateManyActorInputEnvelopeSchema: z.ZodType<Prisma.IssueHistoryCreateManyActorInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => IssueHistoryCreateManyActorInputSchema), z.lazy(() => IssueHistoryCreateManyActorInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const SessionUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SessionUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SessionUpdateWithoutUserInputSchema), z.lazy(() => SessionUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => SessionCreateWithoutUserInputSchema), z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema) ]),
});

export const SessionUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SessionUpdateWithoutUserInputSchema), z.lazy(() => SessionUncheckedUpdateWithoutUserInputSchema) ]),
});

export const SessionUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => SessionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SessionUpdateManyMutationInputSchema), z.lazy(() => SessionUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const SessionScalarWhereInputSchema: z.ZodType<Prisma.SessionScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionScalarWhereInputSchema), z.lazy(() => SessionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  token: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  ipAddress: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userAgent: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
});

export const AccountUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.AccountUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => AccountUpdateWithoutUserInputSchema), z.lazy(() => AccountUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => AccountCreateWithoutUserInputSchema), z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema) ]),
});

export const AccountUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => AccountUpdateWithoutUserInputSchema), z.lazy(() => AccountUncheckedUpdateWithoutUserInputSchema) ]),
});

export const AccountUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => AccountScalarWhereInputSchema),
  data: z.union([ z.lazy(() => AccountUpdateManyMutationInputSchema), z.lazy(() => AccountUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const AccountScalarWhereInputSchema: z.ZodType<Prisma.AccountScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AccountScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AccountScalarWhereInputSchema), z.lazy(() => AccountScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accountId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  providerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  scope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  idToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  password: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const IssueUpsertWithWhereUniqueWithoutCreatorInputSchema: z.ZodType<Prisma.IssueUpsertWithWhereUniqueWithoutCreatorInput> = z.strictObject({
  where: z.lazy(() => IssueWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => IssueUpdateWithoutCreatorInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutCreatorInputSchema) ]),
  create: z.union([ z.lazy(() => IssueCreateWithoutCreatorInputSchema), z.lazy(() => IssueUncheckedCreateWithoutCreatorInputSchema) ]),
});

export const IssueUpdateWithWhereUniqueWithoutCreatorInputSchema: z.ZodType<Prisma.IssueUpdateWithWhereUniqueWithoutCreatorInput> = z.strictObject({
  where: z.lazy(() => IssueWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => IssueUpdateWithoutCreatorInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutCreatorInputSchema) ]),
});

export const IssueUpdateManyWithWhereWithoutCreatorInputSchema: z.ZodType<Prisma.IssueUpdateManyWithWhereWithoutCreatorInput> = z.strictObject({
  where: z.lazy(() => IssueScalarWhereInputSchema),
  data: z.union([ z.lazy(() => IssueUpdateManyMutationInputSchema), z.lazy(() => IssueUncheckedUpdateManyWithoutCreatorInputSchema) ]),
});

export const IssueScalarWhereInputSchema: z.ZodType<Prisma.IssueScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => IssueScalarWhereInputSchema), z.lazy(() => IssueScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => IssueScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => IssueScalarWhereInputSchema), z.lazy(() => IssueScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumIssueTypeFilterSchema), z.lazy(() => IssueTypeSchema) ]).optional(),
  priority: z.union([ z.lazy(() => EnumPriorityFilterSchema), z.lazy(() => PrioritySchema) ]).optional(),
  severity: z.union([ z.lazy(() => EnumSeverityFilterSchema), z.lazy(() => SeveritySchema) ]).optional(),
  url: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  sourceNotes: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  reportedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumIssueStatusFilterSchema), z.lazy(() => IssueStatusSchema) ]).optional(),
  createdBy: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  assigneeId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const IssueUpsertWithWhereUniqueWithoutAssigneeInputSchema: z.ZodType<Prisma.IssueUpsertWithWhereUniqueWithoutAssigneeInput> = z.strictObject({
  where: z.lazy(() => IssueWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => IssueUpdateWithoutAssigneeInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutAssigneeInputSchema) ]),
  create: z.union([ z.lazy(() => IssueCreateWithoutAssigneeInputSchema), z.lazy(() => IssueUncheckedCreateWithoutAssigneeInputSchema) ]),
});

export const IssueUpdateWithWhereUniqueWithoutAssigneeInputSchema: z.ZodType<Prisma.IssueUpdateWithWhereUniqueWithoutAssigneeInput> = z.strictObject({
  where: z.lazy(() => IssueWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => IssueUpdateWithoutAssigneeInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutAssigneeInputSchema) ]),
});

export const IssueUpdateManyWithWhereWithoutAssigneeInputSchema: z.ZodType<Prisma.IssueUpdateManyWithWhereWithoutAssigneeInput> = z.strictObject({
  where: z.lazy(() => IssueScalarWhereInputSchema),
  data: z.union([ z.lazy(() => IssueUpdateManyMutationInputSchema), z.lazy(() => IssueUncheckedUpdateManyWithoutAssigneeInputSchema) ]),
});

export const AttachmentUpsertWithWhereUniqueWithoutUploaderInputSchema: z.ZodType<Prisma.AttachmentUpsertWithWhereUniqueWithoutUploaderInput> = z.strictObject({
  where: z.lazy(() => AttachmentWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => AttachmentUpdateWithoutUploaderInputSchema), z.lazy(() => AttachmentUncheckedUpdateWithoutUploaderInputSchema) ]),
  create: z.union([ z.lazy(() => AttachmentCreateWithoutUploaderInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutUploaderInputSchema) ]),
});

export const AttachmentUpdateWithWhereUniqueWithoutUploaderInputSchema: z.ZodType<Prisma.AttachmentUpdateWithWhereUniqueWithoutUploaderInput> = z.strictObject({
  where: z.lazy(() => AttachmentWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => AttachmentUpdateWithoutUploaderInputSchema), z.lazy(() => AttachmentUncheckedUpdateWithoutUploaderInputSchema) ]),
});

export const AttachmentUpdateManyWithWhereWithoutUploaderInputSchema: z.ZodType<Prisma.AttachmentUpdateManyWithWhereWithoutUploaderInput> = z.strictObject({
  where: z.lazy(() => AttachmentScalarWhereInputSchema),
  data: z.union([ z.lazy(() => AttachmentUpdateManyMutationInputSchema), z.lazy(() => AttachmentUncheckedUpdateManyWithoutUploaderInputSchema) ]),
});

export const AttachmentScalarWhereInputSchema: z.ZodType<Prisma.AttachmentScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => AttachmentScalarWhereInputSchema), z.lazy(() => AttachmentScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AttachmentScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AttachmentScalarWhereInputSchema), z.lazy(() => AttachmentScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  uploaderId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  filename: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sizeBytes: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const CommentUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.CommentUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => CommentWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CommentUpdateWithoutUserInputSchema), z.lazy(() => CommentUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => CommentCreateWithoutUserInputSchema), z.lazy(() => CommentUncheckedCreateWithoutUserInputSchema) ]),
});

export const CommentUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.CommentUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => CommentWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CommentUpdateWithoutUserInputSchema), z.lazy(() => CommentUncheckedUpdateWithoutUserInputSchema) ]),
});

export const CommentUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.CommentUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => CommentScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CommentUpdateManyMutationInputSchema), z.lazy(() => CommentUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const CommentScalarWhereInputSchema: z.ZodType<Prisma.CommentScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => CommentScalarWhereInputSchema), z.lazy(() => CommentScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CommentScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CommentScalarWhereInputSchema), z.lazy(() => CommentScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  content: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const NotificationUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.NotificationUpsertWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => NotificationUpdateWithoutUserInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => NotificationCreateWithoutUserInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutUserInputSchema) ]),
});

export const NotificationUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.NotificationUpdateWithWhereUniqueWithoutUserInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateWithoutUserInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutUserInputSchema) ]),
});

export const NotificationUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithWhereWithoutUserInput> = z.strictObject({
  where: z.lazy(() => NotificationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateManyMutationInputSchema), z.lazy(() => NotificationUncheckedUpdateManyWithoutUserInputSchema) ]),
});

export const NotificationScalarWhereInputSchema: z.ZodType<Prisma.NotificationScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationScalarWhereInputSchema), z.lazy(() => NotificationScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  message: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  isRead: z.union([ z.lazy(() => BoolFilterSchema), z.boolean() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const IssueHistoryUpsertWithWhereUniqueWithoutActorInputSchema: z.ZodType<Prisma.IssueHistoryUpsertWithWhereUniqueWithoutActorInput> = z.strictObject({
  where: z.lazy(() => IssueHistoryWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => IssueHistoryUpdateWithoutActorInputSchema), z.lazy(() => IssueHistoryUncheckedUpdateWithoutActorInputSchema) ]),
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutActorInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutActorInputSchema) ]),
});

export const IssueHistoryUpdateWithWhereUniqueWithoutActorInputSchema: z.ZodType<Prisma.IssueHistoryUpdateWithWhereUniqueWithoutActorInput> = z.strictObject({
  where: z.lazy(() => IssueHistoryWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => IssueHistoryUpdateWithoutActorInputSchema), z.lazy(() => IssueHistoryUncheckedUpdateWithoutActorInputSchema) ]),
});

export const IssueHistoryUpdateManyWithWhereWithoutActorInputSchema: z.ZodType<Prisma.IssueHistoryUpdateManyWithWhereWithoutActorInput> = z.strictObject({
  where: z.lazy(() => IssueHistoryScalarWhereInputSchema),
  data: z.union([ z.lazy(() => IssueHistoryUpdateManyMutationInputSchema), z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutActorInputSchema) ]),
});

export const IssueHistoryScalarWhereInputSchema: z.ZodType<Prisma.IssueHistoryScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => IssueHistoryScalarWhereInputSchema), z.lazy(() => IssueHistoryScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => IssueHistoryScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => IssueHistoryScalarWhereInputSchema), z.lazy(() => IssueHistoryScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  actorId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  eventType: z.union([ z.lazy(() => EnumHistoryEventFilterSchema), z.lazy(() => HistoryEventSchema) ]).optional(),
  description: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  metadata: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const UserCreateWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateWithoutSessionsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserUncheckedCreateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSessionsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserCreateOrConnectWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSessionsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]),
});

export const UserUpsertWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpsertWithoutSessionsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSessionsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutSessionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema) ]),
});

export const UserUpdateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpdateWithoutSessionsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSessionsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserCreateWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateWithoutAccountsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserUncheckedCreateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutAccountsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserCreateOrConnectWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutAccountsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]),
});

export const UserUpsertWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpsertWithoutAccountsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutAccountsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutAccountsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema) ]),
});

export const UserUpdateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpdateWithoutAccountsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutAccountsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserCreateWithoutIssuesInputSchema: z.ZodType<Prisma.UserCreateWithoutIssuesInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserUncheckedCreateWithoutIssuesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutIssuesInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserCreateOrConnectWithoutIssuesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutIssuesInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutIssuesInputSchema), z.lazy(() => UserUncheckedCreateWithoutIssuesInputSchema) ]),
});

export const UserCreateWithoutAssignedIssuesInputSchema: z.ZodType<Prisma.UserCreateWithoutAssignedIssuesInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueCreateNestedManyWithoutCreatorInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserUncheckedCreateWithoutAssignedIssuesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutAssignedIssuesInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutCreatorInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserCreateOrConnectWithoutAssignedIssuesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutAssignedIssuesInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutAssignedIssuesInputSchema), z.lazy(() => UserUncheckedCreateWithoutAssignedIssuesInputSchema) ]),
});

export const ScreenshotCreateWithoutIssueInputSchema: z.ZodType<Prisma.ScreenshotCreateWithoutIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const ScreenshotUncheckedCreateWithoutIssueInputSchema: z.ZodType<Prisma.ScreenshotUncheckedCreateWithoutIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const ScreenshotCreateOrConnectWithoutIssueInputSchema: z.ZodType<Prisma.ScreenshotCreateOrConnectWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => ScreenshotWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ScreenshotCreateWithoutIssueInputSchema), z.lazy(() => ScreenshotUncheckedCreateWithoutIssueInputSchema) ]),
});

export const ScreenshotCreateManyIssueInputEnvelopeSchema: z.ZodType<Prisma.ScreenshotCreateManyIssueInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ScreenshotCreateManyIssueInputSchema), z.lazy(() => ScreenshotCreateManyIssueInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const AttachmentCreateWithoutIssueInputSchema: z.ZodType<Prisma.AttachmentCreateWithoutIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  uploader: z.lazy(() => UserCreateNestedOneWithoutAttachmentsInputSchema),
});

export const AttachmentUncheckedCreateWithoutIssueInputSchema: z.ZodType<Prisma.AttachmentUncheckedCreateWithoutIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  uploaderId: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const AttachmentCreateOrConnectWithoutIssueInputSchema: z.ZodType<Prisma.AttachmentCreateOrConnectWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => AttachmentWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AttachmentCreateWithoutIssueInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutIssueInputSchema) ]),
});

export const AttachmentCreateManyIssueInputEnvelopeSchema: z.ZodType<Prisma.AttachmentCreateManyIssueInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => AttachmentCreateManyIssueInputSchema), z.lazy(() => AttachmentCreateManyIssueInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const CommentCreateWithoutIssueInputSchema: z.ZodType<Prisma.CommentCreateWithoutIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutCommentsInputSchema),
});

export const CommentUncheckedCreateWithoutIssueInputSchema: z.ZodType<Prisma.CommentUncheckedCreateWithoutIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
});

export const CommentCreateOrConnectWithoutIssueInputSchema: z.ZodType<Prisma.CommentCreateOrConnectWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => CommentWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CommentCreateWithoutIssueInputSchema), z.lazy(() => CommentUncheckedCreateWithoutIssueInputSchema) ]),
});

export const CommentCreateManyIssueInputEnvelopeSchema: z.ZodType<Prisma.CommentCreateManyIssueInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => CommentCreateManyIssueInputSchema), z.lazy(() => CommentCreateManyIssueInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const IssueHistoryCreateWithoutIssueInputSchema: z.ZodType<Prisma.IssueHistoryCreateWithoutIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  eventType: z.lazy(() => HistoryEventSchema),
  description: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  actor: z.lazy(() => UserCreateNestedOneWithoutHistoryActionsInputSchema),
});

export const IssueHistoryUncheckedCreateWithoutIssueInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedCreateWithoutIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  actorId: z.string(),
  eventType: z.lazy(() => HistoryEventSchema),
  description: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
});

export const IssueHistoryCreateOrConnectWithoutIssueInputSchema: z.ZodType<Prisma.IssueHistoryCreateOrConnectWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => IssueHistoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutIssueInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutIssueInputSchema) ]),
});

export const IssueHistoryCreateManyIssueInputEnvelopeSchema: z.ZodType<Prisma.IssueHistoryCreateManyIssueInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => IssueHistoryCreateManyIssueInputSchema), z.lazy(() => IssueHistoryCreateManyIssueInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const NotificationCreateWithoutIssueInputSchema: z.ZodType<Prisma.NotificationCreateWithoutIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  message: z.string(),
  isRead: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutNotificationsInputSchema),
});

export const NotificationUncheckedCreateWithoutIssueInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateWithoutIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  message: z.string(),
  isRead: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
});

export const NotificationCreateOrConnectWithoutIssueInputSchema: z.ZodType<Prisma.NotificationCreateOrConnectWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => NotificationCreateWithoutIssueInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutIssueInputSchema) ]),
});

export const NotificationCreateManyIssueInputEnvelopeSchema: z.ZodType<Prisma.NotificationCreateManyIssueInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => NotificationCreateManyIssueInputSchema), z.lazy(() => NotificationCreateManyIssueInputSchema).array() ]),
  skipDuplicates: z.boolean().optional(),
});

export const UserUpsertWithoutIssuesInputSchema: z.ZodType<Prisma.UserUpsertWithoutIssuesInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutIssuesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutIssuesInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutIssuesInputSchema), z.lazy(() => UserUncheckedCreateWithoutIssuesInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutIssuesInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutIssuesInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutIssuesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutIssuesInputSchema) ]),
});

export const UserUpdateWithoutIssuesInputSchema: z.ZodType<Prisma.UserUpdateWithoutIssuesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutIssuesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutIssuesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserUpsertWithoutAssignedIssuesInputSchema: z.ZodType<Prisma.UserUpsertWithoutAssignedIssuesInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutAssignedIssuesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAssignedIssuesInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutAssignedIssuesInputSchema), z.lazy(() => UserUncheckedCreateWithoutAssignedIssuesInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutAssignedIssuesInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutAssignedIssuesInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutAssignedIssuesInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAssignedIssuesInputSchema) ]),
});

export const UserUpdateWithoutAssignedIssuesInputSchema: z.ZodType<Prisma.UserUpdateWithoutAssignedIssuesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUpdateManyWithoutCreatorNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutAssignedIssuesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutAssignedIssuesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const ScreenshotUpsertWithWhereUniqueWithoutIssueInputSchema: z.ZodType<Prisma.ScreenshotUpsertWithWhereUniqueWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => ScreenshotWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => ScreenshotUpdateWithoutIssueInputSchema), z.lazy(() => ScreenshotUncheckedUpdateWithoutIssueInputSchema) ]),
  create: z.union([ z.lazy(() => ScreenshotCreateWithoutIssueInputSchema), z.lazy(() => ScreenshotUncheckedCreateWithoutIssueInputSchema) ]),
});

export const ScreenshotUpdateWithWhereUniqueWithoutIssueInputSchema: z.ZodType<Prisma.ScreenshotUpdateWithWhereUniqueWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => ScreenshotWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => ScreenshotUpdateWithoutIssueInputSchema), z.lazy(() => ScreenshotUncheckedUpdateWithoutIssueInputSchema) ]),
});

export const ScreenshotUpdateManyWithWhereWithoutIssueInputSchema: z.ZodType<Prisma.ScreenshotUpdateManyWithWhereWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => ScreenshotScalarWhereInputSchema),
  data: z.union([ z.lazy(() => ScreenshotUpdateManyMutationInputSchema), z.lazy(() => ScreenshotUncheckedUpdateManyWithoutIssueInputSchema) ]),
});

export const ScreenshotScalarWhereInputSchema: z.ZodType<Prisma.ScreenshotScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => ScreenshotScalarWhereInputSchema), z.lazy(() => ScreenshotScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ScreenshotScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ScreenshotScalarWhereInputSchema), z.lazy(() => ScreenshotScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  issueId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  filename: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mimeType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  sizeBytes: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  order: z.union([ z.lazy(() => IntFilterSchema), z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export const AttachmentUpsertWithWhereUniqueWithoutIssueInputSchema: z.ZodType<Prisma.AttachmentUpsertWithWhereUniqueWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => AttachmentWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => AttachmentUpdateWithoutIssueInputSchema), z.lazy(() => AttachmentUncheckedUpdateWithoutIssueInputSchema) ]),
  create: z.union([ z.lazy(() => AttachmentCreateWithoutIssueInputSchema), z.lazy(() => AttachmentUncheckedCreateWithoutIssueInputSchema) ]),
});

export const AttachmentUpdateWithWhereUniqueWithoutIssueInputSchema: z.ZodType<Prisma.AttachmentUpdateWithWhereUniqueWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => AttachmentWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => AttachmentUpdateWithoutIssueInputSchema), z.lazy(() => AttachmentUncheckedUpdateWithoutIssueInputSchema) ]),
});

export const AttachmentUpdateManyWithWhereWithoutIssueInputSchema: z.ZodType<Prisma.AttachmentUpdateManyWithWhereWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => AttachmentScalarWhereInputSchema),
  data: z.union([ z.lazy(() => AttachmentUpdateManyMutationInputSchema), z.lazy(() => AttachmentUncheckedUpdateManyWithoutIssueInputSchema) ]),
});

export const CommentUpsertWithWhereUniqueWithoutIssueInputSchema: z.ZodType<Prisma.CommentUpsertWithWhereUniqueWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => CommentWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CommentUpdateWithoutIssueInputSchema), z.lazy(() => CommentUncheckedUpdateWithoutIssueInputSchema) ]),
  create: z.union([ z.lazy(() => CommentCreateWithoutIssueInputSchema), z.lazy(() => CommentUncheckedCreateWithoutIssueInputSchema) ]),
});

export const CommentUpdateWithWhereUniqueWithoutIssueInputSchema: z.ZodType<Prisma.CommentUpdateWithWhereUniqueWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => CommentWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CommentUpdateWithoutIssueInputSchema), z.lazy(() => CommentUncheckedUpdateWithoutIssueInputSchema) ]),
});

export const CommentUpdateManyWithWhereWithoutIssueInputSchema: z.ZodType<Prisma.CommentUpdateManyWithWhereWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => CommentScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CommentUpdateManyMutationInputSchema), z.lazy(() => CommentUncheckedUpdateManyWithoutIssueInputSchema) ]),
});

export const IssueHistoryUpsertWithWhereUniqueWithoutIssueInputSchema: z.ZodType<Prisma.IssueHistoryUpsertWithWhereUniqueWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => IssueHistoryWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => IssueHistoryUpdateWithoutIssueInputSchema), z.lazy(() => IssueHistoryUncheckedUpdateWithoutIssueInputSchema) ]),
  create: z.union([ z.lazy(() => IssueHistoryCreateWithoutIssueInputSchema), z.lazy(() => IssueHistoryUncheckedCreateWithoutIssueInputSchema) ]),
});

export const IssueHistoryUpdateWithWhereUniqueWithoutIssueInputSchema: z.ZodType<Prisma.IssueHistoryUpdateWithWhereUniqueWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => IssueHistoryWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => IssueHistoryUpdateWithoutIssueInputSchema), z.lazy(() => IssueHistoryUncheckedUpdateWithoutIssueInputSchema) ]),
});

export const IssueHistoryUpdateManyWithWhereWithoutIssueInputSchema: z.ZodType<Prisma.IssueHistoryUpdateManyWithWhereWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => IssueHistoryScalarWhereInputSchema),
  data: z.union([ z.lazy(() => IssueHistoryUpdateManyMutationInputSchema), z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutIssueInputSchema) ]),
});

export const NotificationUpsertWithWhereUniqueWithoutIssueInputSchema: z.ZodType<Prisma.NotificationUpsertWithWhereUniqueWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => NotificationUpdateWithoutIssueInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutIssueInputSchema) ]),
  create: z.union([ z.lazy(() => NotificationCreateWithoutIssueInputSchema), z.lazy(() => NotificationUncheckedCreateWithoutIssueInputSchema) ]),
});

export const NotificationUpdateWithWhereUniqueWithoutIssueInputSchema: z.ZodType<Prisma.NotificationUpdateWithWhereUniqueWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => NotificationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateWithoutIssueInputSchema), z.lazy(() => NotificationUncheckedUpdateWithoutIssueInputSchema) ]),
});

export const NotificationUpdateManyWithWhereWithoutIssueInputSchema: z.ZodType<Prisma.NotificationUpdateManyWithWhereWithoutIssueInput> = z.strictObject({
  where: z.lazy(() => NotificationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => NotificationUpdateManyMutationInputSchema), z.lazy(() => NotificationUncheckedUpdateManyWithoutIssueInputSchema) ]),
});

export const IssueCreateWithoutScreenshotsInputSchema: z.ZodType<Prisma.IssueCreateWithoutScreenshotsInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  creator: z.lazy(() => UserCreateNestedOneWithoutIssuesInputSchema),
  assignee: z.lazy(() => UserCreateNestedOneWithoutAssignedIssuesInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueUncheckedCreateWithoutScreenshotsInputSchema: z.ZodType<Prisma.IssueUncheckedCreateWithoutScreenshotsInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdBy: z.string(),
  assigneeId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueCreateOrConnectWithoutScreenshotsInputSchema: z.ZodType<Prisma.IssueCreateOrConnectWithoutScreenshotsInput> = z.strictObject({
  where: z.lazy(() => IssueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => IssueCreateWithoutScreenshotsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutScreenshotsInputSchema) ]),
});

export const IssueUpsertWithoutScreenshotsInputSchema: z.ZodType<Prisma.IssueUpsertWithoutScreenshotsInput> = z.strictObject({
  update: z.union([ z.lazy(() => IssueUpdateWithoutScreenshotsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutScreenshotsInputSchema) ]),
  create: z.union([ z.lazy(() => IssueCreateWithoutScreenshotsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutScreenshotsInputSchema) ]),
  where: z.lazy(() => IssueWhereInputSchema).optional(),
});

export const IssueUpdateToOneWithWhereWithoutScreenshotsInputSchema: z.ZodType<Prisma.IssueUpdateToOneWithWhereWithoutScreenshotsInput> = z.strictObject({
  where: z.lazy(() => IssueWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => IssueUpdateWithoutScreenshotsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutScreenshotsInputSchema) ]),
});

export const IssueUpdateWithoutScreenshotsInputSchema: z.ZodType<Prisma.IssueUpdateWithoutScreenshotsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  creator: z.lazy(() => UserUpdateOneRequiredWithoutIssuesNestedInputSchema).optional(),
  assignee: z.lazy(() => UserUpdateOneWithoutAssignedIssuesNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueUncheckedUpdateWithoutScreenshotsInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateWithoutScreenshotsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdBy: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  assigneeId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueCreateWithoutAttachmentsInputSchema: z.ZodType<Prisma.IssueCreateWithoutAttachmentsInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  creator: z.lazy(() => UserCreateNestedOneWithoutIssuesInputSchema),
  assignee: z.lazy(() => UserCreateNestedOneWithoutAssignedIssuesInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueUncheckedCreateWithoutAttachmentsInputSchema: z.ZodType<Prisma.IssueUncheckedCreateWithoutAttachmentsInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdBy: z.string(),
  assigneeId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueCreateOrConnectWithoutAttachmentsInputSchema: z.ZodType<Prisma.IssueCreateOrConnectWithoutAttachmentsInput> = z.strictObject({
  where: z.lazy(() => IssueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => IssueCreateWithoutAttachmentsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutAttachmentsInputSchema) ]),
});

export const UserCreateWithoutAttachmentsInputSchema: z.ZodType<Prisma.UserCreateWithoutAttachmentsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueCreateNestedManyWithoutAssigneeInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserUncheckedCreateWithoutAttachmentsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutAttachmentsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutAssigneeInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserCreateOrConnectWithoutAttachmentsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutAttachmentsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutAttachmentsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAttachmentsInputSchema) ]),
});

export const IssueUpsertWithoutAttachmentsInputSchema: z.ZodType<Prisma.IssueUpsertWithoutAttachmentsInput> = z.strictObject({
  update: z.union([ z.lazy(() => IssueUpdateWithoutAttachmentsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutAttachmentsInputSchema) ]),
  create: z.union([ z.lazy(() => IssueCreateWithoutAttachmentsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutAttachmentsInputSchema) ]),
  where: z.lazy(() => IssueWhereInputSchema).optional(),
});

export const IssueUpdateToOneWithWhereWithoutAttachmentsInputSchema: z.ZodType<Prisma.IssueUpdateToOneWithWhereWithoutAttachmentsInput> = z.strictObject({
  where: z.lazy(() => IssueWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => IssueUpdateWithoutAttachmentsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutAttachmentsInputSchema) ]),
});

export const IssueUpdateWithoutAttachmentsInputSchema: z.ZodType<Prisma.IssueUpdateWithoutAttachmentsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  creator: z.lazy(() => UserUpdateOneRequiredWithoutIssuesNestedInputSchema).optional(),
  assignee: z.lazy(() => UserUpdateOneWithoutAssignedIssuesNestedInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueUncheckedUpdateWithoutAttachmentsInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateWithoutAttachmentsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdBy: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  assigneeId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const UserUpsertWithoutAttachmentsInputSchema: z.ZodType<Prisma.UserUpsertWithoutAttachmentsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutAttachmentsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAttachmentsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutAttachmentsInputSchema), z.lazy(() => UserUncheckedCreateWithoutAttachmentsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutAttachmentsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutAttachmentsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutAttachmentsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutAttachmentsInputSchema) ]),
});

export const UserUpdateWithoutAttachmentsInputSchema: z.ZodType<Prisma.UserUpdateWithoutAttachmentsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutAttachmentsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutAttachmentsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const IssueCreateWithoutCommentsInputSchema: z.ZodType<Prisma.IssueCreateWithoutCommentsInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  creator: z.lazy(() => UserCreateNestedOneWithoutIssuesInputSchema),
  assignee: z.lazy(() => UserCreateNestedOneWithoutAssignedIssuesInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueUncheckedCreateWithoutCommentsInputSchema: z.ZodType<Prisma.IssueUncheckedCreateWithoutCommentsInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdBy: z.string(),
  assigneeId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueCreateOrConnectWithoutCommentsInputSchema: z.ZodType<Prisma.IssueCreateOrConnectWithoutCommentsInput> = z.strictObject({
  where: z.lazy(() => IssueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => IssueCreateWithoutCommentsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutCommentsInputSchema) ]),
});

export const UserCreateWithoutCommentsInputSchema: z.ZodType<Prisma.UserCreateWithoutCommentsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutUploaderInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserUncheckedCreateWithoutCommentsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutCommentsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutUploaderInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserCreateOrConnectWithoutCommentsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCommentsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutCommentsInputSchema), z.lazy(() => UserUncheckedCreateWithoutCommentsInputSchema) ]),
});

export const IssueUpsertWithoutCommentsInputSchema: z.ZodType<Prisma.IssueUpsertWithoutCommentsInput> = z.strictObject({
  update: z.union([ z.lazy(() => IssueUpdateWithoutCommentsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutCommentsInputSchema) ]),
  create: z.union([ z.lazy(() => IssueCreateWithoutCommentsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutCommentsInputSchema) ]),
  where: z.lazy(() => IssueWhereInputSchema).optional(),
});

export const IssueUpdateToOneWithWhereWithoutCommentsInputSchema: z.ZodType<Prisma.IssueUpdateToOneWithWhereWithoutCommentsInput> = z.strictObject({
  where: z.lazy(() => IssueWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => IssueUpdateWithoutCommentsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutCommentsInputSchema) ]),
});

export const IssueUpdateWithoutCommentsInputSchema: z.ZodType<Prisma.IssueUpdateWithoutCommentsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  creator: z.lazy(() => UserUpdateOneRequiredWithoutIssuesNestedInputSchema).optional(),
  assignee: z.lazy(() => UserUpdateOneWithoutAssignedIssuesNestedInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueUncheckedUpdateWithoutCommentsInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateWithoutCommentsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdBy: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  assigneeId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const UserUpsertWithoutCommentsInputSchema: z.ZodType<Prisma.UserUpsertWithoutCommentsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutCommentsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutCommentsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutCommentsInputSchema), z.lazy(() => UserUncheckedCreateWithoutCommentsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutCommentsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCommentsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutCommentsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutCommentsInputSchema) ]),
});

export const UserUpdateWithoutCommentsInputSchema: z.ZodType<Prisma.UserUpdateWithoutCommentsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutUploaderNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutCommentsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutCommentsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutUploaderNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const IssueCreateWithoutHistoryInputSchema: z.ZodType<Prisma.IssueCreateWithoutHistoryInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  creator: z.lazy(() => UserCreateNestedOneWithoutIssuesInputSchema),
  assignee: z.lazy(() => UserCreateNestedOneWithoutAssignedIssuesInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueUncheckedCreateWithoutHistoryInputSchema: z.ZodType<Prisma.IssueUncheckedCreateWithoutHistoryInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdBy: z.string(),
  assigneeId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueCreateOrConnectWithoutHistoryInputSchema: z.ZodType<Prisma.IssueCreateOrConnectWithoutHistoryInput> = z.strictObject({
  where: z.lazy(() => IssueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => IssueCreateWithoutHistoryInputSchema), z.lazy(() => IssueUncheckedCreateWithoutHistoryInputSchema) ]),
});

export const UserCreateWithoutHistoryActionsInputSchema: z.ZodType<Prisma.UserCreateWithoutHistoryActionsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserUncheckedCreateWithoutHistoryActionsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutHistoryActionsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
});

export const UserCreateOrConnectWithoutHistoryActionsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutHistoryActionsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutHistoryActionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutHistoryActionsInputSchema) ]),
});

export const IssueUpsertWithoutHistoryInputSchema: z.ZodType<Prisma.IssueUpsertWithoutHistoryInput> = z.strictObject({
  update: z.union([ z.lazy(() => IssueUpdateWithoutHistoryInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutHistoryInputSchema) ]),
  create: z.union([ z.lazy(() => IssueCreateWithoutHistoryInputSchema), z.lazy(() => IssueUncheckedCreateWithoutHistoryInputSchema) ]),
  where: z.lazy(() => IssueWhereInputSchema).optional(),
});

export const IssueUpdateToOneWithWhereWithoutHistoryInputSchema: z.ZodType<Prisma.IssueUpdateToOneWithWhereWithoutHistoryInput> = z.strictObject({
  where: z.lazy(() => IssueWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => IssueUpdateWithoutHistoryInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutHistoryInputSchema) ]),
});

export const IssueUpdateWithoutHistoryInputSchema: z.ZodType<Prisma.IssueUpdateWithoutHistoryInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  creator: z.lazy(() => UserUpdateOneRequiredWithoutIssuesNestedInputSchema).optional(),
  assignee: z.lazy(() => UserUpdateOneWithoutAssignedIssuesNestedInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueUncheckedUpdateWithoutHistoryInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateWithoutHistoryInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdBy: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  assigneeId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const UserUpsertWithoutHistoryActionsInputSchema: z.ZodType<Prisma.UserUpsertWithoutHistoryActionsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutHistoryActionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutHistoryActionsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutHistoryActionsInputSchema), z.lazy(() => UserUncheckedCreateWithoutHistoryActionsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutHistoryActionsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutHistoryActionsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutHistoryActionsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutHistoryActionsInputSchema) ]),
});

export const UserUpdateWithoutHistoryActionsInputSchema: z.ZodType<Prisma.UserUpdateWithoutHistoryActionsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutHistoryActionsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutHistoryActionsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
});

export const UserCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.UserCreateWithoutNotificationsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserUncheckedCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutNotificationsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean().optional(),
  image: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutCreatorInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedCreateNestedManyWithoutAssigneeInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutUploaderInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutActorInputSchema).optional(),
});

export const UserCreateOrConnectWithoutNotificationsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutNotificationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutNotificationsInputSchema) ]),
});

export const IssueCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.IssueCreateWithoutNotificationsInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  creator: z.lazy(() => UserCreateNestedOneWithoutIssuesInputSchema),
  assignee: z.lazy(() => UserCreateNestedOneWithoutAssignedIssuesInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueUncheckedCreateWithoutNotificationsInputSchema: z.ZodType<Prisma.IssueUncheckedCreateWithoutNotificationsInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdBy: z.string(),
  assigneeId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedCreateNestedManyWithoutIssueInputSchema).optional(),
});

export const IssueCreateOrConnectWithoutNotificationsInputSchema: z.ZodType<Prisma.IssueCreateOrConnectWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => IssueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => IssueCreateWithoutNotificationsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutNotificationsInputSchema) ]),
});

export const UserUpsertWithoutNotificationsInputSchema: z.ZodType<Prisma.UserUpsertWithoutNotificationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => UserUpdateWithoutNotificationsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutNotificationsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutNotificationsInputSchema), z.lazy(() => UserUncheckedCreateWithoutNotificationsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional(),
});

export const UserUpdateToOneWithWhereWithoutNotificationsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutNotificationsInputSchema), z.lazy(() => UserUncheckedUpdateWithoutNotificationsInputSchema) ]),
});

export const UserUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.UserUpdateWithoutNotificationsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const UserUncheckedUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutNotificationsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  role: z.union([ z.lazy(() => RoleSchema), z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  issues: z.lazy(() => IssueUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional(),
  assignedIssues: z.lazy(() => IssueUncheckedUpdateManyWithoutAssigneeNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutUploaderNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  historyActions: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutActorNestedInputSchema).optional(),
});

export const IssueUpsertWithoutNotificationsInputSchema: z.ZodType<Prisma.IssueUpsertWithoutNotificationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => IssueUpdateWithoutNotificationsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutNotificationsInputSchema) ]),
  create: z.union([ z.lazy(() => IssueCreateWithoutNotificationsInputSchema), z.lazy(() => IssueUncheckedCreateWithoutNotificationsInputSchema) ]),
  where: z.lazy(() => IssueWhereInputSchema).optional(),
});

export const IssueUpdateToOneWithWhereWithoutNotificationsInputSchema: z.ZodType<Prisma.IssueUpdateToOneWithWhereWithoutNotificationsInput> = z.strictObject({
  where: z.lazy(() => IssueWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => IssueUpdateWithoutNotificationsInputSchema), z.lazy(() => IssueUncheckedUpdateWithoutNotificationsInputSchema) ]),
});

export const IssueUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.IssueUpdateWithoutNotificationsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  creator: z.lazy(() => UserUpdateOneRequiredWithoutIssuesNestedInputSchema).optional(),
  assignee: z.lazy(() => UserUpdateOneWithoutAssignedIssuesNestedInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueUncheckedUpdateWithoutNotificationsInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateWithoutNotificationsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdBy: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  assigneeId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const SessionCreateManyUserInputSchema: z.ZodType<Prisma.SessionCreateManyUserInput> = z.strictObject({
  id: z.uuid().optional(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export const AccountCreateManyUserInputSchema: z.ZodType<Prisma.AccountCreateManyUserInput> = z.strictObject({
  id: z.uuid().optional(),
  accountId: z.string(),
  providerId: z.string(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  accessTokenExpiresAt: z.coerce.date().optional().nullable(),
  refreshTokenExpiresAt: z.coerce.date().optional().nullable(),
  scope: z.string().optional().nullable(),
  idToken: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const IssueCreateManyCreatorInputSchema: z.ZodType<Prisma.IssueCreateManyCreatorInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  assigneeId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const IssueCreateManyAssigneeInputSchema: z.ZodType<Prisma.IssueCreateManyAssigneeInput> = z.strictObject({
  id: z.uuid().optional(),
  title: z.string(),
  description: z.string(),
  type: z.lazy(() => IssueTypeSchema),
  priority: z.lazy(() => PrioritySchema),
  severity: z.lazy(() => SeveritySchema),
  url: z.string().optional().nullable(),
  sourceNotes: z.string().optional().nullable(),
  reportedAt: z.coerce.date().optional().nullable(),
  status: z.lazy(() => IssueStatusSchema).optional(),
  createdBy: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const AttachmentCreateManyUploaderInputSchema: z.ZodType<Prisma.AttachmentCreateManyUploaderInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const CommentCreateManyUserInputSchema: z.ZodType<Prisma.CommentCreateManyUserInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
});

export const NotificationCreateManyUserInputSchema: z.ZodType<Prisma.NotificationCreateManyUserInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  message: z.string(),
  isRead: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
});

export const IssueHistoryCreateManyActorInputSchema: z.ZodType<Prisma.IssueHistoryCreateManyActorInput> = z.strictObject({
  id: z.uuid().optional(),
  issueId: z.string(),
  eventType: z.lazy(() => HistoryEventSchema),
  description: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
});

export const SessionUpdateWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SessionUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const SessionUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ipAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userAgent: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
});

export const AccountUpdateWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AccountUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  providerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  accessToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  refreshTokenExpiresAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  scope: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  idToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  password: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IssueUpdateWithoutCreatorInputSchema: z.ZodType<Prisma.IssueUpdateWithoutCreatorInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  assignee: z.lazy(() => UserUpdateOneWithoutAssignedIssuesNestedInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueUncheckedUpdateWithoutCreatorInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateWithoutCreatorInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  assigneeId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueUncheckedUpdateManyWithoutCreatorInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateManyWithoutCreatorInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  assigneeId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IssueUpdateWithoutAssigneeInputSchema: z.ZodType<Prisma.IssueUpdateWithoutAssigneeInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  creator: z.lazy(() => UserUpdateOneRequiredWithoutIssuesNestedInputSchema).optional(),
  screenshots: z.lazy(() => ScreenshotUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueUncheckedUpdateWithoutAssigneeInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateWithoutAssigneeInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdBy: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  screenshots: z.lazy(() => ScreenshotUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  attachments: z.lazy(() => AttachmentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  comments: z.lazy(() => CommentUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  history: z.lazy(() => IssueHistoryUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
  notifications: z.lazy(() => NotificationUncheckedUpdateManyWithoutIssueNestedInputSchema).optional(),
});

export const IssueUncheckedUpdateManyWithoutAssigneeInputSchema: z.ZodType<Prisma.IssueUncheckedUpdateManyWithoutAssigneeInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => IssueTypeSchema), z.lazy(() => EnumIssueTypeFieldUpdateOperationsInputSchema) ]).optional(),
  priority: z.union([ z.lazy(() => PrioritySchema), z.lazy(() => EnumPriorityFieldUpdateOperationsInputSchema) ]).optional(),
  severity: z.union([ z.lazy(() => SeveritySchema), z.lazy(() => EnumSeverityFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sourceNotes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reportedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => IssueStatusSchema), z.lazy(() => EnumIssueStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdBy: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AttachmentUpdateWithoutUploaderInputSchema: z.ZodType<Prisma.AttachmentUpdateWithoutUploaderInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  issue: z.lazy(() => IssueUpdateOneRequiredWithoutAttachmentsNestedInputSchema).optional(),
});

export const AttachmentUncheckedUpdateWithoutUploaderInputSchema: z.ZodType<Prisma.AttachmentUncheckedUpdateWithoutUploaderInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AttachmentUncheckedUpdateManyWithoutUploaderInputSchema: z.ZodType<Prisma.AttachmentUncheckedUpdateManyWithoutUploaderInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const CommentUpdateWithoutUserInputSchema: z.ZodType<Prisma.CommentUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  issue: z.lazy(() => IssueUpdateOneRequiredWithoutCommentsNestedInputSchema).optional(),
});

export const CommentUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.CommentUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const CommentUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.CommentUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationUpdateWithoutUserInputSchema: z.ZodType<Prisma.NotificationUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  message: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isRead: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  issue: z.lazy(() => IssueUpdateOneRequiredWithoutNotificationsNestedInputSchema).optional(),
});

export const NotificationUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  message: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isRead: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutUserInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  message: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isRead: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IssueHistoryUpdateWithoutActorInputSchema: z.ZodType<Prisma.IssueHistoryUpdateWithoutActorInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventType: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => EnumHistoryEventFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  issue: z.lazy(() => IssueUpdateOneRequiredWithoutHistoryNestedInputSchema).optional(),
});

export const IssueHistoryUncheckedUpdateWithoutActorInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedUpdateWithoutActorInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventType: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => EnumHistoryEventFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IssueHistoryUncheckedUpdateManyWithoutActorInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedUpdateManyWithoutActorInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  issueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventType: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => EnumHistoryEventFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ScreenshotCreateManyIssueInputSchema: z.ZodType<Prisma.ScreenshotCreateManyIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const AttachmentCreateManyIssueInputSchema: z.ZodType<Prisma.AttachmentCreateManyIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  uploaderId: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  order: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
});

export const CommentCreateManyIssueInputSchema: z.ZodType<Prisma.CommentCreateManyIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
});

export const IssueHistoryCreateManyIssueInputSchema: z.ZodType<Prisma.IssueHistoryCreateManyIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  actorId: z.string(),
  eventType: z.lazy(() => HistoryEventSchema),
  description: z.string(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
});

export const NotificationCreateManyIssueInputSchema: z.ZodType<Prisma.NotificationCreateManyIssueInput> = z.strictObject({
  id: z.uuid().optional(),
  userId: z.string(),
  message: z.string(),
  isRead: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
});

export const ScreenshotUpdateWithoutIssueInputSchema: z.ZodType<Prisma.ScreenshotUpdateWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ScreenshotUncheckedUpdateWithoutIssueInputSchema: z.ZodType<Prisma.ScreenshotUncheckedUpdateWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const ScreenshotUncheckedUpdateManyWithoutIssueInputSchema: z.ZodType<Prisma.ScreenshotUncheckedUpdateManyWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AttachmentUpdateWithoutIssueInputSchema: z.ZodType<Prisma.AttachmentUpdateWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  uploader: z.lazy(() => UserUpdateOneRequiredWithoutAttachmentsNestedInputSchema).optional(),
});

export const AttachmentUncheckedUpdateWithoutIssueInputSchema: z.ZodType<Prisma.AttachmentUncheckedUpdateWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  uploaderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const AttachmentUncheckedUpdateManyWithoutIssueInputSchema: z.ZodType<Prisma.AttachmentUncheckedUpdateManyWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  uploaderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  filename: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  mimeType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sizeBytes: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const CommentUpdateWithoutIssueInputSchema: z.ZodType<Prisma.CommentUpdateWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutCommentsNestedInputSchema).optional(),
});

export const CommentUncheckedUpdateWithoutIssueInputSchema: z.ZodType<Prisma.CommentUncheckedUpdateWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const CommentUncheckedUpdateManyWithoutIssueInputSchema: z.ZodType<Prisma.CommentUncheckedUpdateManyWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IssueHistoryUpdateWithoutIssueInputSchema: z.ZodType<Prisma.IssueHistoryUpdateWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventType: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => EnumHistoryEventFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  actor: z.lazy(() => UserUpdateOneRequiredWithoutHistoryActionsNestedInputSchema).optional(),
});

export const IssueHistoryUncheckedUpdateWithoutIssueInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedUpdateWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventType: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => EnumHistoryEventFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const IssueHistoryUncheckedUpdateManyWithoutIssueInputSchema: z.ZodType<Prisma.IssueHistoryUncheckedUpdateManyWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventType: z.union([ z.lazy(() => HistoryEventSchema), z.lazy(() => EnumHistoryEventFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.lazy(() => NullableJsonNullValueInputSchema), InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationUpdateWithoutIssueInputSchema: z.ZodType<Prisma.NotificationUpdateWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  message: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isRead: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutNotificationsNestedInputSchema).optional(),
});

export const NotificationUncheckedUpdateWithoutIssueInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  message: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isRead: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export const NotificationUncheckedUpdateManyWithoutIssueInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyWithoutIssueInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  message: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isRead: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const PermissionFindFirstArgsSchema: z.ZodType<Prisma.PermissionFindFirstArgs> = z.object({
  select: PermissionSelectSchema.optional(),
  where: PermissionWhereInputSchema.optional(), 
  orderBy: z.union([ PermissionOrderByWithRelationInputSchema.array(), PermissionOrderByWithRelationInputSchema ]).optional(),
  cursor: PermissionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PermissionScalarFieldEnumSchema, PermissionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PermissionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PermissionFindFirstOrThrowArgs> = z.object({
  select: PermissionSelectSchema.optional(),
  where: PermissionWhereInputSchema.optional(), 
  orderBy: z.union([ PermissionOrderByWithRelationInputSchema.array(), PermissionOrderByWithRelationInputSchema ]).optional(),
  cursor: PermissionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PermissionScalarFieldEnumSchema, PermissionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PermissionFindManyArgsSchema: z.ZodType<Prisma.PermissionFindManyArgs> = z.object({
  select: PermissionSelectSchema.optional(),
  where: PermissionWhereInputSchema.optional(), 
  orderBy: z.union([ PermissionOrderByWithRelationInputSchema.array(), PermissionOrderByWithRelationInputSchema ]).optional(),
  cursor: PermissionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PermissionScalarFieldEnumSchema, PermissionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const PermissionAggregateArgsSchema: z.ZodType<Prisma.PermissionAggregateArgs> = z.object({
  where: PermissionWhereInputSchema.optional(), 
  orderBy: z.union([ PermissionOrderByWithRelationInputSchema.array(), PermissionOrderByWithRelationInputSchema ]).optional(),
  cursor: PermissionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PermissionGroupByArgsSchema: z.ZodType<Prisma.PermissionGroupByArgs> = z.object({
  where: PermissionWhereInputSchema.optional(), 
  orderBy: z.union([ PermissionOrderByWithAggregationInputSchema.array(), PermissionOrderByWithAggregationInputSchema ]).optional(),
  by: PermissionScalarFieldEnumSchema.array(), 
  having: PermissionScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const PermissionFindUniqueArgsSchema: z.ZodType<Prisma.PermissionFindUniqueArgs> = z.object({
  select: PermissionSelectSchema.optional(),
  where: PermissionWhereUniqueInputSchema, 
}).strict();

export const PermissionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PermissionFindUniqueOrThrowArgs> = z.object({
  select: PermissionSelectSchema.optional(),
  where: PermissionWhereUniqueInputSchema, 
}).strict();

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(), UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(), UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(), 
  having: UserScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const SessionFindFirstArgsSchema: z.ZodType<Prisma.SessionFindFirstArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SessionScalarFieldEnumSchema, SessionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SessionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SessionFindFirstOrThrowArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SessionScalarFieldEnumSchema, SessionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SessionFindManyArgsSchema: z.ZodType<Prisma.SessionFindManyArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SessionScalarFieldEnumSchema, SessionScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const SessionAggregateArgsSchema: z.ZodType<Prisma.SessionAggregateArgs> = z.object({
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(), SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SessionGroupByArgsSchema: z.ZodType<Prisma.SessionGroupByArgs> = z.object({
  where: SessionWhereInputSchema.optional(), 
  orderBy: z.union([ SessionOrderByWithAggregationInputSchema.array(), SessionOrderByWithAggregationInputSchema ]).optional(),
  by: SessionScalarFieldEnumSchema.array(), 
  having: SessionScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const SessionFindUniqueArgsSchema: z.ZodType<Prisma.SessionFindUniqueArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const SessionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SessionFindUniqueOrThrowArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const AccountFindFirstArgsSchema: z.ZodType<Prisma.AccountFindFirstArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AccountScalarFieldEnumSchema, AccountScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AccountFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AccountFindFirstOrThrowArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AccountScalarFieldEnumSchema, AccountScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AccountFindManyArgsSchema: z.ZodType<Prisma.AccountFindManyArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AccountScalarFieldEnumSchema, AccountScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AccountAggregateArgsSchema: z.ZodType<Prisma.AccountAggregateArgs> = z.object({
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithRelationInputSchema.array(), AccountOrderByWithRelationInputSchema ]).optional(),
  cursor: AccountWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AccountGroupByArgsSchema: z.ZodType<Prisma.AccountGroupByArgs> = z.object({
  where: AccountWhereInputSchema.optional(), 
  orderBy: z.union([ AccountOrderByWithAggregationInputSchema.array(), AccountOrderByWithAggregationInputSchema ]).optional(),
  by: AccountScalarFieldEnumSchema.array(), 
  having: AccountScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AccountFindUniqueArgsSchema: z.ZodType<Prisma.AccountFindUniqueArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const AccountFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AccountFindUniqueOrThrowArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const VerificationFindFirstArgsSchema: z.ZodType<Prisma.VerificationFindFirstArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ VerificationScalarFieldEnumSchema, VerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const VerificationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.VerificationFindFirstOrThrowArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ VerificationScalarFieldEnumSchema, VerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const VerificationFindManyArgsSchema: z.ZodType<Prisma.VerificationFindManyArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ VerificationScalarFieldEnumSchema, VerificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const VerificationAggregateArgsSchema: z.ZodType<Prisma.VerificationAggregateArgs> = z.object({
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithRelationInputSchema.array(), VerificationOrderByWithRelationInputSchema ]).optional(),
  cursor: VerificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const VerificationGroupByArgsSchema: z.ZodType<Prisma.VerificationGroupByArgs> = z.object({
  where: VerificationWhereInputSchema.optional(), 
  orderBy: z.union([ VerificationOrderByWithAggregationInputSchema.array(), VerificationOrderByWithAggregationInputSchema ]).optional(),
  by: VerificationScalarFieldEnumSchema.array(), 
  having: VerificationScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const VerificationFindUniqueArgsSchema: z.ZodType<Prisma.VerificationFindUniqueArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const VerificationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.VerificationFindUniqueOrThrowArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const IssueFindFirstArgsSchema: z.ZodType<Prisma.IssueFindFirstArgs> = z.object({
  select: IssueSelectSchema.optional(),
  include: IssueIncludeSchema.optional(),
  where: IssueWhereInputSchema.optional(), 
  orderBy: z.union([ IssueOrderByWithRelationInputSchema.array(), IssueOrderByWithRelationInputSchema ]).optional(),
  cursor: IssueWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ IssueScalarFieldEnumSchema, IssueScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const IssueFindFirstOrThrowArgsSchema: z.ZodType<Prisma.IssueFindFirstOrThrowArgs> = z.object({
  select: IssueSelectSchema.optional(),
  include: IssueIncludeSchema.optional(),
  where: IssueWhereInputSchema.optional(), 
  orderBy: z.union([ IssueOrderByWithRelationInputSchema.array(), IssueOrderByWithRelationInputSchema ]).optional(),
  cursor: IssueWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ IssueScalarFieldEnumSchema, IssueScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const IssueFindManyArgsSchema: z.ZodType<Prisma.IssueFindManyArgs> = z.object({
  select: IssueSelectSchema.optional(),
  include: IssueIncludeSchema.optional(),
  where: IssueWhereInputSchema.optional(), 
  orderBy: z.union([ IssueOrderByWithRelationInputSchema.array(), IssueOrderByWithRelationInputSchema ]).optional(),
  cursor: IssueWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ IssueScalarFieldEnumSchema, IssueScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const IssueAggregateArgsSchema: z.ZodType<Prisma.IssueAggregateArgs> = z.object({
  where: IssueWhereInputSchema.optional(), 
  orderBy: z.union([ IssueOrderByWithRelationInputSchema.array(), IssueOrderByWithRelationInputSchema ]).optional(),
  cursor: IssueWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const IssueGroupByArgsSchema: z.ZodType<Prisma.IssueGroupByArgs> = z.object({
  where: IssueWhereInputSchema.optional(), 
  orderBy: z.union([ IssueOrderByWithAggregationInputSchema.array(), IssueOrderByWithAggregationInputSchema ]).optional(),
  by: IssueScalarFieldEnumSchema.array(), 
  having: IssueScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const IssueFindUniqueArgsSchema: z.ZodType<Prisma.IssueFindUniqueArgs> = z.object({
  select: IssueSelectSchema.optional(),
  include: IssueIncludeSchema.optional(),
  where: IssueWhereUniqueInputSchema, 
}).strict();

export const IssueFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.IssueFindUniqueOrThrowArgs> = z.object({
  select: IssueSelectSchema.optional(),
  include: IssueIncludeSchema.optional(),
  where: IssueWhereUniqueInputSchema, 
}).strict();

export const ScreenshotFindFirstArgsSchema: z.ZodType<Prisma.ScreenshotFindFirstArgs> = z.object({
  select: ScreenshotSelectSchema.optional(),
  include: ScreenshotIncludeSchema.optional(),
  where: ScreenshotWhereInputSchema.optional(), 
  orderBy: z.union([ ScreenshotOrderByWithRelationInputSchema.array(), ScreenshotOrderByWithRelationInputSchema ]).optional(),
  cursor: ScreenshotWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ScreenshotScalarFieldEnumSchema, ScreenshotScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ScreenshotFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ScreenshotFindFirstOrThrowArgs> = z.object({
  select: ScreenshotSelectSchema.optional(),
  include: ScreenshotIncludeSchema.optional(),
  where: ScreenshotWhereInputSchema.optional(), 
  orderBy: z.union([ ScreenshotOrderByWithRelationInputSchema.array(), ScreenshotOrderByWithRelationInputSchema ]).optional(),
  cursor: ScreenshotWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ScreenshotScalarFieldEnumSchema, ScreenshotScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ScreenshotFindManyArgsSchema: z.ZodType<Prisma.ScreenshotFindManyArgs> = z.object({
  select: ScreenshotSelectSchema.optional(),
  include: ScreenshotIncludeSchema.optional(),
  where: ScreenshotWhereInputSchema.optional(), 
  orderBy: z.union([ ScreenshotOrderByWithRelationInputSchema.array(), ScreenshotOrderByWithRelationInputSchema ]).optional(),
  cursor: ScreenshotWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ScreenshotScalarFieldEnumSchema, ScreenshotScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const ScreenshotAggregateArgsSchema: z.ZodType<Prisma.ScreenshotAggregateArgs> = z.object({
  where: ScreenshotWhereInputSchema.optional(), 
  orderBy: z.union([ ScreenshotOrderByWithRelationInputSchema.array(), ScreenshotOrderByWithRelationInputSchema ]).optional(),
  cursor: ScreenshotWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ScreenshotGroupByArgsSchema: z.ZodType<Prisma.ScreenshotGroupByArgs> = z.object({
  where: ScreenshotWhereInputSchema.optional(), 
  orderBy: z.union([ ScreenshotOrderByWithAggregationInputSchema.array(), ScreenshotOrderByWithAggregationInputSchema ]).optional(),
  by: ScreenshotScalarFieldEnumSchema.array(), 
  having: ScreenshotScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const ScreenshotFindUniqueArgsSchema: z.ZodType<Prisma.ScreenshotFindUniqueArgs> = z.object({
  select: ScreenshotSelectSchema.optional(),
  include: ScreenshotIncludeSchema.optional(),
  where: ScreenshotWhereUniqueInputSchema, 
}).strict();

export const ScreenshotFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ScreenshotFindUniqueOrThrowArgs> = z.object({
  select: ScreenshotSelectSchema.optional(),
  include: ScreenshotIncludeSchema.optional(),
  where: ScreenshotWhereUniqueInputSchema, 
}).strict();

export const AttachmentFindFirstArgsSchema: z.ZodType<Prisma.AttachmentFindFirstArgs> = z.object({
  select: AttachmentSelectSchema.optional(),
  include: AttachmentIncludeSchema.optional(),
  where: AttachmentWhereInputSchema.optional(), 
  orderBy: z.union([ AttachmentOrderByWithRelationInputSchema.array(), AttachmentOrderByWithRelationInputSchema ]).optional(),
  cursor: AttachmentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AttachmentScalarFieldEnumSchema, AttachmentScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AttachmentFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AttachmentFindFirstOrThrowArgs> = z.object({
  select: AttachmentSelectSchema.optional(),
  include: AttachmentIncludeSchema.optional(),
  where: AttachmentWhereInputSchema.optional(), 
  orderBy: z.union([ AttachmentOrderByWithRelationInputSchema.array(), AttachmentOrderByWithRelationInputSchema ]).optional(),
  cursor: AttachmentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AttachmentScalarFieldEnumSchema, AttachmentScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AttachmentFindManyArgsSchema: z.ZodType<Prisma.AttachmentFindManyArgs> = z.object({
  select: AttachmentSelectSchema.optional(),
  include: AttachmentIncludeSchema.optional(),
  where: AttachmentWhereInputSchema.optional(), 
  orderBy: z.union([ AttachmentOrderByWithRelationInputSchema.array(), AttachmentOrderByWithRelationInputSchema ]).optional(),
  cursor: AttachmentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AttachmentScalarFieldEnumSchema, AttachmentScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const AttachmentAggregateArgsSchema: z.ZodType<Prisma.AttachmentAggregateArgs> = z.object({
  where: AttachmentWhereInputSchema.optional(), 
  orderBy: z.union([ AttachmentOrderByWithRelationInputSchema.array(), AttachmentOrderByWithRelationInputSchema ]).optional(),
  cursor: AttachmentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AttachmentGroupByArgsSchema: z.ZodType<Prisma.AttachmentGroupByArgs> = z.object({
  where: AttachmentWhereInputSchema.optional(), 
  orderBy: z.union([ AttachmentOrderByWithAggregationInputSchema.array(), AttachmentOrderByWithAggregationInputSchema ]).optional(),
  by: AttachmentScalarFieldEnumSchema.array(), 
  having: AttachmentScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const AttachmentFindUniqueArgsSchema: z.ZodType<Prisma.AttachmentFindUniqueArgs> = z.object({
  select: AttachmentSelectSchema.optional(),
  include: AttachmentIncludeSchema.optional(),
  where: AttachmentWhereUniqueInputSchema, 
}).strict();

export const AttachmentFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AttachmentFindUniqueOrThrowArgs> = z.object({
  select: AttachmentSelectSchema.optional(),
  include: AttachmentIncludeSchema.optional(),
  where: AttachmentWhereUniqueInputSchema, 
}).strict();

export const CommentFindFirstArgsSchema: z.ZodType<Prisma.CommentFindFirstArgs> = z.object({
  select: CommentSelectSchema.optional(),
  include: CommentIncludeSchema.optional(),
  where: CommentWhereInputSchema.optional(), 
  orderBy: z.union([ CommentOrderByWithRelationInputSchema.array(), CommentOrderByWithRelationInputSchema ]).optional(),
  cursor: CommentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CommentScalarFieldEnumSchema, CommentScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CommentFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CommentFindFirstOrThrowArgs> = z.object({
  select: CommentSelectSchema.optional(),
  include: CommentIncludeSchema.optional(),
  where: CommentWhereInputSchema.optional(), 
  orderBy: z.union([ CommentOrderByWithRelationInputSchema.array(), CommentOrderByWithRelationInputSchema ]).optional(),
  cursor: CommentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CommentScalarFieldEnumSchema, CommentScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CommentFindManyArgsSchema: z.ZodType<Prisma.CommentFindManyArgs> = z.object({
  select: CommentSelectSchema.optional(),
  include: CommentIncludeSchema.optional(),
  where: CommentWhereInputSchema.optional(), 
  orderBy: z.union([ CommentOrderByWithRelationInputSchema.array(), CommentOrderByWithRelationInputSchema ]).optional(),
  cursor: CommentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CommentScalarFieldEnumSchema, CommentScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const CommentAggregateArgsSchema: z.ZodType<Prisma.CommentAggregateArgs> = z.object({
  where: CommentWhereInputSchema.optional(), 
  orderBy: z.union([ CommentOrderByWithRelationInputSchema.array(), CommentOrderByWithRelationInputSchema ]).optional(),
  cursor: CommentWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const CommentGroupByArgsSchema: z.ZodType<Prisma.CommentGroupByArgs> = z.object({
  where: CommentWhereInputSchema.optional(), 
  orderBy: z.union([ CommentOrderByWithAggregationInputSchema.array(), CommentOrderByWithAggregationInputSchema ]).optional(),
  by: CommentScalarFieldEnumSchema.array(), 
  having: CommentScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const CommentFindUniqueArgsSchema: z.ZodType<Prisma.CommentFindUniqueArgs> = z.object({
  select: CommentSelectSchema.optional(),
  include: CommentIncludeSchema.optional(),
  where: CommentWhereUniqueInputSchema, 
}).strict();

export const CommentFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CommentFindUniqueOrThrowArgs> = z.object({
  select: CommentSelectSchema.optional(),
  include: CommentIncludeSchema.optional(),
  where: CommentWhereUniqueInputSchema, 
}).strict();

export const IssueHistoryFindFirstArgsSchema: z.ZodType<Prisma.IssueHistoryFindFirstArgs> = z.object({
  select: IssueHistorySelectSchema.optional(),
  include: IssueHistoryIncludeSchema.optional(),
  where: IssueHistoryWhereInputSchema.optional(), 
  orderBy: z.union([ IssueHistoryOrderByWithRelationInputSchema.array(), IssueHistoryOrderByWithRelationInputSchema ]).optional(),
  cursor: IssueHistoryWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ IssueHistoryScalarFieldEnumSchema, IssueHistoryScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const IssueHistoryFindFirstOrThrowArgsSchema: z.ZodType<Prisma.IssueHistoryFindFirstOrThrowArgs> = z.object({
  select: IssueHistorySelectSchema.optional(),
  include: IssueHistoryIncludeSchema.optional(),
  where: IssueHistoryWhereInputSchema.optional(), 
  orderBy: z.union([ IssueHistoryOrderByWithRelationInputSchema.array(), IssueHistoryOrderByWithRelationInputSchema ]).optional(),
  cursor: IssueHistoryWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ IssueHistoryScalarFieldEnumSchema, IssueHistoryScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const IssueHistoryFindManyArgsSchema: z.ZodType<Prisma.IssueHistoryFindManyArgs> = z.object({
  select: IssueHistorySelectSchema.optional(),
  include: IssueHistoryIncludeSchema.optional(),
  where: IssueHistoryWhereInputSchema.optional(), 
  orderBy: z.union([ IssueHistoryOrderByWithRelationInputSchema.array(), IssueHistoryOrderByWithRelationInputSchema ]).optional(),
  cursor: IssueHistoryWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ IssueHistoryScalarFieldEnumSchema, IssueHistoryScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const IssueHistoryAggregateArgsSchema: z.ZodType<Prisma.IssueHistoryAggregateArgs> = z.object({
  where: IssueHistoryWhereInputSchema.optional(), 
  orderBy: z.union([ IssueHistoryOrderByWithRelationInputSchema.array(), IssueHistoryOrderByWithRelationInputSchema ]).optional(),
  cursor: IssueHistoryWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const IssueHistoryGroupByArgsSchema: z.ZodType<Prisma.IssueHistoryGroupByArgs> = z.object({
  where: IssueHistoryWhereInputSchema.optional(), 
  orderBy: z.union([ IssueHistoryOrderByWithAggregationInputSchema.array(), IssueHistoryOrderByWithAggregationInputSchema ]).optional(),
  by: IssueHistoryScalarFieldEnumSchema.array(), 
  having: IssueHistoryScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const IssueHistoryFindUniqueArgsSchema: z.ZodType<Prisma.IssueHistoryFindUniqueArgs> = z.object({
  select: IssueHistorySelectSchema.optional(),
  include: IssueHistoryIncludeSchema.optional(),
  where: IssueHistoryWhereUniqueInputSchema, 
}).strict();

export const IssueHistoryFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.IssueHistoryFindUniqueOrThrowArgs> = z.object({
  select: IssueHistorySelectSchema.optional(),
  include: IssueHistoryIncludeSchema.optional(),
  where: IssueHistoryWhereUniqueInputSchema, 
}).strict();

export const NotificationFindFirstArgsSchema: z.ZodType<Prisma.NotificationFindFirstArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(), NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationScalarFieldEnumSchema, NotificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.NotificationFindFirstOrThrowArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(), NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationScalarFieldEnumSchema, NotificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationFindManyArgsSchema: z.ZodType<Prisma.NotificationFindManyArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(), NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationScalarFieldEnumSchema, NotificationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export const NotificationAggregateArgsSchema: z.ZodType<Prisma.NotificationAggregateArgs> = z.object({
  where: NotificationWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(), NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const NotificationGroupByArgsSchema: z.ZodType<Prisma.NotificationGroupByArgs> = z.object({
  where: NotificationWhereInputSchema.optional(), 
  orderBy: z.union([ NotificationOrderByWithAggregationInputSchema.array(), NotificationOrderByWithAggregationInputSchema ]).optional(),
  by: NotificationScalarFieldEnumSchema.array(), 
  having: NotificationScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export const NotificationFindUniqueArgsSchema: z.ZodType<Prisma.NotificationFindUniqueArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereUniqueInputSchema, 
}).strict();

export const NotificationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.NotificationFindUniqueOrThrowArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereUniqueInputSchema, 
}).strict();

export const PermissionCreateArgsSchema: z.ZodType<Prisma.PermissionCreateArgs> = z.object({
  select: PermissionSelectSchema.optional(),
  data: z.union([ PermissionCreateInputSchema, PermissionUncheckedCreateInputSchema ]),
}).strict();

export const PermissionUpsertArgsSchema: z.ZodType<Prisma.PermissionUpsertArgs> = z.object({
  select: PermissionSelectSchema.optional(),
  where: PermissionWhereUniqueInputSchema, 
  create: z.union([ PermissionCreateInputSchema, PermissionUncheckedCreateInputSchema ]),
  update: z.union([ PermissionUpdateInputSchema, PermissionUncheckedUpdateInputSchema ]),
}).strict();

export const PermissionCreateManyArgsSchema: z.ZodType<Prisma.PermissionCreateManyArgs> = z.object({
  data: z.union([ PermissionCreateManyInputSchema, PermissionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PermissionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PermissionCreateManyAndReturnArgs> = z.object({
  data: z.union([ PermissionCreateManyInputSchema, PermissionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const PermissionDeleteArgsSchema: z.ZodType<Prisma.PermissionDeleteArgs> = z.object({
  select: PermissionSelectSchema.optional(),
  where: PermissionWhereUniqueInputSchema, 
}).strict();

export const PermissionUpdateArgsSchema: z.ZodType<Prisma.PermissionUpdateArgs> = z.object({
  select: PermissionSelectSchema.optional(),
  data: z.union([ PermissionUpdateInputSchema, PermissionUncheckedUpdateInputSchema ]),
  where: PermissionWhereUniqueInputSchema, 
}).strict();

export const PermissionUpdateManyArgsSchema: z.ZodType<Prisma.PermissionUpdateManyArgs> = z.object({
  data: z.union([ PermissionUpdateManyMutationInputSchema, PermissionUncheckedUpdateManyInputSchema ]),
  where: PermissionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PermissionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PermissionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PermissionUpdateManyMutationInputSchema, PermissionUncheckedUpdateManyInputSchema ]),
  where: PermissionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const PermissionDeleteManyArgsSchema: z.ZodType<Prisma.PermissionDeleteManyArgs> = z.object({
  where: PermissionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
}).strict();

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
  create: z.union([ UserCreateInputSchema, UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
}).strict();

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema, UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserUpdateInputSchema, UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema, 
}).strict();

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema, UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SessionCreateArgsSchema: z.ZodType<Prisma.SessionCreateArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  data: z.union([ SessionCreateInputSchema, SessionUncheckedCreateInputSchema ]),
}).strict();

export const SessionUpsertArgsSchema: z.ZodType<Prisma.SessionUpsertArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
  create: z.union([ SessionCreateInputSchema, SessionUncheckedCreateInputSchema ]),
  update: z.union([ SessionUpdateInputSchema, SessionUncheckedUpdateInputSchema ]),
}).strict();

export const SessionCreateManyArgsSchema: z.ZodType<Prisma.SessionCreateManyArgs> = z.object({
  data: z.union([ SessionCreateManyInputSchema, SessionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SessionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SessionCreateManyAndReturnArgs> = z.object({
  data: z.union([ SessionCreateManyInputSchema, SessionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const SessionDeleteArgsSchema: z.ZodType<Prisma.SessionDeleteArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const SessionUpdateArgsSchema: z.ZodType<Prisma.SessionUpdateArgs> = z.object({
  select: SessionSelectSchema.optional(),
  include: SessionIncludeSchema.optional(),
  data: z.union([ SessionUpdateInputSchema, SessionUncheckedUpdateInputSchema ]),
  where: SessionWhereUniqueInputSchema, 
}).strict();

export const SessionUpdateManyArgsSchema: z.ZodType<Prisma.SessionUpdateManyArgs> = z.object({
  data: z.union([ SessionUpdateManyMutationInputSchema, SessionUncheckedUpdateManyInputSchema ]),
  where: SessionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SessionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SessionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SessionUpdateManyMutationInputSchema, SessionUncheckedUpdateManyInputSchema ]),
  where: SessionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const SessionDeleteManyArgsSchema: z.ZodType<Prisma.SessionDeleteManyArgs> = z.object({
  where: SessionWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AccountCreateArgsSchema: z.ZodType<Prisma.AccountCreateArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  data: z.union([ AccountCreateInputSchema, AccountUncheckedCreateInputSchema ]),
}).strict();

export const AccountUpsertArgsSchema: z.ZodType<Prisma.AccountUpsertArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
  create: z.union([ AccountCreateInputSchema, AccountUncheckedCreateInputSchema ]),
  update: z.union([ AccountUpdateInputSchema, AccountUncheckedUpdateInputSchema ]),
}).strict();

export const AccountCreateManyArgsSchema: z.ZodType<Prisma.AccountCreateManyArgs> = z.object({
  data: z.union([ AccountCreateManyInputSchema, AccountCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AccountCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AccountCreateManyAndReturnArgs> = z.object({
  data: z.union([ AccountCreateManyInputSchema, AccountCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AccountDeleteArgsSchema: z.ZodType<Prisma.AccountDeleteArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const AccountUpdateArgsSchema: z.ZodType<Prisma.AccountUpdateArgs> = z.object({
  select: AccountSelectSchema.optional(),
  include: AccountIncludeSchema.optional(),
  data: z.union([ AccountUpdateInputSchema, AccountUncheckedUpdateInputSchema ]),
  where: AccountWhereUniqueInputSchema, 
}).strict();

export const AccountUpdateManyArgsSchema: z.ZodType<Prisma.AccountUpdateManyArgs> = z.object({
  data: z.union([ AccountUpdateManyMutationInputSchema, AccountUncheckedUpdateManyInputSchema ]),
  where: AccountWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AccountUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AccountUpdateManyAndReturnArgs> = z.object({
  data: z.union([ AccountUpdateManyMutationInputSchema, AccountUncheckedUpdateManyInputSchema ]),
  where: AccountWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AccountDeleteManyArgsSchema: z.ZodType<Prisma.AccountDeleteManyArgs> = z.object({
  where: AccountWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const VerificationCreateArgsSchema: z.ZodType<Prisma.VerificationCreateArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  data: z.union([ VerificationCreateInputSchema, VerificationUncheckedCreateInputSchema ]),
}).strict();

export const VerificationUpsertArgsSchema: z.ZodType<Prisma.VerificationUpsertArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
  create: z.union([ VerificationCreateInputSchema, VerificationUncheckedCreateInputSchema ]),
  update: z.union([ VerificationUpdateInputSchema, VerificationUncheckedUpdateInputSchema ]),
}).strict();

export const VerificationCreateManyArgsSchema: z.ZodType<Prisma.VerificationCreateManyArgs> = z.object({
  data: z.union([ VerificationCreateManyInputSchema, VerificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const VerificationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.VerificationCreateManyAndReturnArgs> = z.object({
  data: z.union([ VerificationCreateManyInputSchema, VerificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const VerificationDeleteArgsSchema: z.ZodType<Prisma.VerificationDeleteArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const VerificationUpdateArgsSchema: z.ZodType<Prisma.VerificationUpdateArgs> = z.object({
  select: VerificationSelectSchema.optional(),
  data: z.union([ VerificationUpdateInputSchema, VerificationUncheckedUpdateInputSchema ]),
  where: VerificationWhereUniqueInputSchema, 
}).strict();

export const VerificationUpdateManyArgsSchema: z.ZodType<Prisma.VerificationUpdateManyArgs> = z.object({
  data: z.union([ VerificationUpdateManyMutationInputSchema, VerificationUncheckedUpdateManyInputSchema ]),
  where: VerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const VerificationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.VerificationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ VerificationUpdateManyMutationInputSchema, VerificationUncheckedUpdateManyInputSchema ]),
  where: VerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const VerificationDeleteManyArgsSchema: z.ZodType<Prisma.VerificationDeleteManyArgs> = z.object({
  where: VerificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const IssueCreateArgsSchema: z.ZodType<Prisma.IssueCreateArgs> = z.object({
  select: IssueSelectSchema.optional(),
  include: IssueIncludeSchema.optional(),
  data: z.union([ IssueCreateInputSchema, IssueUncheckedCreateInputSchema ]),
}).strict();

export const IssueUpsertArgsSchema: z.ZodType<Prisma.IssueUpsertArgs> = z.object({
  select: IssueSelectSchema.optional(),
  include: IssueIncludeSchema.optional(),
  where: IssueWhereUniqueInputSchema, 
  create: z.union([ IssueCreateInputSchema, IssueUncheckedCreateInputSchema ]),
  update: z.union([ IssueUpdateInputSchema, IssueUncheckedUpdateInputSchema ]),
}).strict();

export const IssueCreateManyArgsSchema: z.ZodType<Prisma.IssueCreateManyArgs> = z.object({
  data: z.union([ IssueCreateManyInputSchema, IssueCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const IssueCreateManyAndReturnArgsSchema: z.ZodType<Prisma.IssueCreateManyAndReturnArgs> = z.object({
  data: z.union([ IssueCreateManyInputSchema, IssueCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const IssueDeleteArgsSchema: z.ZodType<Prisma.IssueDeleteArgs> = z.object({
  select: IssueSelectSchema.optional(),
  include: IssueIncludeSchema.optional(),
  where: IssueWhereUniqueInputSchema, 
}).strict();

export const IssueUpdateArgsSchema: z.ZodType<Prisma.IssueUpdateArgs> = z.object({
  select: IssueSelectSchema.optional(),
  include: IssueIncludeSchema.optional(),
  data: z.union([ IssueUpdateInputSchema, IssueUncheckedUpdateInputSchema ]),
  where: IssueWhereUniqueInputSchema, 
}).strict();

export const IssueUpdateManyArgsSchema: z.ZodType<Prisma.IssueUpdateManyArgs> = z.object({
  data: z.union([ IssueUpdateManyMutationInputSchema, IssueUncheckedUpdateManyInputSchema ]),
  where: IssueWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const IssueUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.IssueUpdateManyAndReturnArgs> = z.object({
  data: z.union([ IssueUpdateManyMutationInputSchema, IssueUncheckedUpdateManyInputSchema ]),
  where: IssueWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const IssueDeleteManyArgsSchema: z.ZodType<Prisma.IssueDeleteManyArgs> = z.object({
  where: IssueWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ScreenshotCreateArgsSchema: z.ZodType<Prisma.ScreenshotCreateArgs> = z.object({
  select: ScreenshotSelectSchema.optional(),
  include: ScreenshotIncludeSchema.optional(),
  data: z.union([ ScreenshotCreateInputSchema, ScreenshotUncheckedCreateInputSchema ]),
}).strict();

export const ScreenshotUpsertArgsSchema: z.ZodType<Prisma.ScreenshotUpsertArgs> = z.object({
  select: ScreenshotSelectSchema.optional(),
  include: ScreenshotIncludeSchema.optional(),
  where: ScreenshotWhereUniqueInputSchema, 
  create: z.union([ ScreenshotCreateInputSchema, ScreenshotUncheckedCreateInputSchema ]),
  update: z.union([ ScreenshotUpdateInputSchema, ScreenshotUncheckedUpdateInputSchema ]),
}).strict();

export const ScreenshotCreateManyArgsSchema: z.ZodType<Prisma.ScreenshotCreateManyArgs> = z.object({
  data: z.union([ ScreenshotCreateManyInputSchema, ScreenshotCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ScreenshotCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ScreenshotCreateManyAndReturnArgs> = z.object({
  data: z.union([ ScreenshotCreateManyInputSchema, ScreenshotCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const ScreenshotDeleteArgsSchema: z.ZodType<Prisma.ScreenshotDeleteArgs> = z.object({
  select: ScreenshotSelectSchema.optional(),
  include: ScreenshotIncludeSchema.optional(),
  where: ScreenshotWhereUniqueInputSchema, 
}).strict();

export const ScreenshotUpdateArgsSchema: z.ZodType<Prisma.ScreenshotUpdateArgs> = z.object({
  select: ScreenshotSelectSchema.optional(),
  include: ScreenshotIncludeSchema.optional(),
  data: z.union([ ScreenshotUpdateInputSchema, ScreenshotUncheckedUpdateInputSchema ]),
  where: ScreenshotWhereUniqueInputSchema, 
}).strict();

export const ScreenshotUpdateManyArgsSchema: z.ZodType<Prisma.ScreenshotUpdateManyArgs> = z.object({
  data: z.union([ ScreenshotUpdateManyMutationInputSchema, ScreenshotUncheckedUpdateManyInputSchema ]),
  where: ScreenshotWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ScreenshotUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ScreenshotUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ScreenshotUpdateManyMutationInputSchema, ScreenshotUncheckedUpdateManyInputSchema ]),
  where: ScreenshotWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const ScreenshotDeleteManyArgsSchema: z.ZodType<Prisma.ScreenshotDeleteManyArgs> = z.object({
  where: ScreenshotWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AttachmentCreateArgsSchema: z.ZodType<Prisma.AttachmentCreateArgs> = z.object({
  select: AttachmentSelectSchema.optional(),
  include: AttachmentIncludeSchema.optional(),
  data: z.union([ AttachmentCreateInputSchema, AttachmentUncheckedCreateInputSchema ]),
}).strict();

export const AttachmentUpsertArgsSchema: z.ZodType<Prisma.AttachmentUpsertArgs> = z.object({
  select: AttachmentSelectSchema.optional(),
  include: AttachmentIncludeSchema.optional(),
  where: AttachmentWhereUniqueInputSchema, 
  create: z.union([ AttachmentCreateInputSchema, AttachmentUncheckedCreateInputSchema ]),
  update: z.union([ AttachmentUpdateInputSchema, AttachmentUncheckedUpdateInputSchema ]),
}).strict();

export const AttachmentCreateManyArgsSchema: z.ZodType<Prisma.AttachmentCreateManyArgs> = z.object({
  data: z.union([ AttachmentCreateManyInputSchema, AttachmentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AttachmentCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AttachmentCreateManyAndReturnArgs> = z.object({
  data: z.union([ AttachmentCreateManyInputSchema, AttachmentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const AttachmentDeleteArgsSchema: z.ZodType<Prisma.AttachmentDeleteArgs> = z.object({
  select: AttachmentSelectSchema.optional(),
  include: AttachmentIncludeSchema.optional(),
  where: AttachmentWhereUniqueInputSchema, 
}).strict();

export const AttachmentUpdateArgsSchema: z.ZodType<Prisma.AttachmentUpdateArgs> = z.object({
  select: AttachmentSelectSchema.optional(),
  include: AttachmentIncludeSchema.optional(),
  data: z.union([ AttachmentUpdateInputSchema, AttachmentUncheckedUpdateInputSchema ]),
  where: AttachmentWhereUniqueInputSchema, 
}).strict();

export const AttachmentUpdateManyArgsSchema: z.ZodType<Prisma.AttachmentUpdateManyArgs> = z.object({
  data: z.union([ AttachmentUpdateManyMutationInputSchema, AttachmentUncheckedUpdateManyInputSchema ]),
  where: AttachmentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AttachmentUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AttachmentUpdateManyAndReturnArgs> = z.object({
  data: z.union([ AttachmentUpdateManyMutationInputSchema, AttachmentUncheckedUpdateManyInputSchema ]),
  where: AttachmentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const AttachmentDeleteManyArgsSchema: z.ZodType<Prisma.AttachmentDeleteManyArgs> = z.object({
  where: AttachmentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CommentCreateArgsSchema: z.ZodType<Prisma.CommentCreateArgs> = z.object({
  select: CommentSelectSchema.optional(),
  include: CommentIncludeSchema.optional(),
  data: z.union([ CommentCreateInputSchema, CommentUncheckedCreateInputSchema ]),
}).strict();

export const CommentUpsertArgsSchema: z.ZodType<Prisma.CommentUpsertArgs> = z.object({
  select: CommentSelectSchema.optional(),
  include: CommentIncludeSchema.optional(),
  where: CommentWhereUniqueInputSchema, 
  create: z.union([ CommentCreateInputSchema, CommentUncheckedCreateInputSchema ]),
  update: z.union([ CommentUpdateInputSchema, CommentUncheckedUpdateInputSchema ]),
}).strict();

export const CommentCreateManyArgsSchema: z.ZodType<Prisma.CommentCreateManyArgs> = z.object({
  data: z.union([ CommentCreateManyInputSchema, CommentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const CommentCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CommentCreateManyAndReturnArgs> = z.object({
  data: z.union([ CommentCreateManyInputSchema, CommentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const CommentDeleteArgsSchema: z.ZodType<Prisma.CommentDeleteArgs> = z.object({
  select: CommentSelectSchema.optional(),
  include: CommentIncludeSchema.optional(),
  where: CommentWhereUniqueInputSchema, 
}).strict();

export const CommentUpdateArgsSchema: z.ZodType<Prisma.CommentUpdateArgs> = z.object({
  select: CommentSelectSchema.optional(),
  include: CommentIncludeSchema.optional(),
  data: z.union([ CommentUpdateInputSchema, CommentUncheckedUpdateInputSchema ]),
  where: CommentWhereUniqueInputSchema, 
}).strict();

export const CommentUpdateManyArgsSchema: z.ZodType<Prisma.CommentUpdateManyArgs> = z.object({
  data: z.union([ CommentUpdateManyMutationInputSchema, CommentUncheckedUpdateManyInputSchema ]),
  where: CommentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CommentUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.CommentUpdateManyAndReturnArgs> = z.object({
  data: z.union([ CommentUpdateManyMutationInputSchema, CommentUncheckedUpdateManyInputSchema ]),
  where: CommentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const CommentDeleteManyArgsSchema: z.ZodType<Prisma.CommentDeleteManyArgs> = z.object({
  where: CommentWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const IssueHistoryCreateArgsSchema: z.ZodType<Prisma.IssueHistoryCreateArgs> = z.object({
  select: IssueHistorySelectSchema.optional(),
  include: IssueHistoryIncludeSchema.optional(),
  data: z.union([ IssueHistoryCreateInputSchema, IssueHistoryUncheckedCreateInputSchema ]),
}).strict();

export const IssueHistoryUpsertArgsSchema: z.ZodType<Prisma.IssueHistoryUpsertArgs> = z.object({
  select: IssueHistorySelectSchema.optional(),
  include: IssueHistoryIncludeSchema.optional(),
  where: IssueHistoryWhereUniqueInputSchema, 
  create: z.union([ IssueHistoryCreateInputSchema, IssueHistoryUncheckedCreateInputSchema ]),
  update: z.union([ IssueHistoryUpdateInputSchema, IssueHistoryUncheckedUpdateInputSchema ]),
}).strict();

export const IssueHistoryCreateManyArgsSchema: z.ZodType<Prisma.IssueHistoryCreateManyArgs> = z.object({
  data: z.union([ IssueHistoryCreateManyInputSchema, IssueHistoryCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const IssueHistoryCreateManyAndReturnArgsSchema: z.ZodType<Prisma.IssueHistoryCreateManyAndReturnArgs> = z.object({
  data: z.union([ IssueHistoryCreateManyInputSchema, IssueHistoryCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const IssueHistoryDeleteArgsSchema: z.ZodType<Prisma.IssueHistoryDeleteArgs> = z.object({
  select: IssueHistorySelectSchema.optional(),
  include: IssueHistoryIncludeSchema.optional(),
  where: IssueHistoryWhereUniqueInputSchema, 
}).strict();

export const IssueHistoryUpdateArgsSchema: z.ZodType<Prisma.IssueHistoryUpdateArgs> = z.object({
  select: IssueHistorySelectSchema.optional(),
  include: IssueHistoryIncludeSchema.optional(),
  data: z.union([ IssueHistoryUpdateInputSchema, IssueHistoryUncheckedUpdateInputSchema ]),
  where: IssueHistoryWhereUniqueInputSchema, 
}).strict();

export const IssueHistoryUpdateManyArgsSchema: z.ZodType<Prisma.IssueHistoryUpdateManyArgs> = z.object({
  data: z.union([ IssueHistoryUpdateManyMutationInputSchema, IssueHistoryUncheckedUpdateManyInputSchema ]),
  where: IssueHistoryWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const IssueHistoryUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.IssueHistoryUpdateManyAndReturnArgs> = z.object({
  data: z.union([ IssueHistoryUpdateManyMutationInputSchema, IssueHistoryUncheckedUpdateManyInputSchema ]),
  where: IssueHistoryWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const IssueHistoryDeleteManyArgsSchema: z.ZodType<Prisma.IssueHistoryDeleteManyArgs> = z.object({
  where: IssueHistoryWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationCreateArgsSchema: z.ZodType<Prisma.NotificationCreateArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  data: z.union([ NotificationCreateInputSchema, NotificationUncheckedCreateInputSchema ]),
}).strict();

export const NotificationUpsertArgsSchema: z.ZodType<Prisma.NotificationUpsertArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereUniqueInputSchema, 
  create: z.union([ NotificationCreateInputSchema, NotificationUncheckedCreateInputSchema ]),
  update: z.union([ NotificationUpdateInputSchema, NotificationUncheckedUpdateInputSchema ]),
}).strict();

export const NotificationCreateManyArgsSchema: z.ZodType<Prisma.NotificationCreateManyArgs> = z.object({
  data: z.union([ NotificationCreateManyInputSchema, NotificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const NotificationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationCreateManyAndReturnArgs> = z.object({
  data: z.union([ NotificationCreateManyInputSchema, NotificationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export const NotificationDeleteArgsSchema: z.ZodType<Prisma.NotificationDeleteArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  where: NotificationWhereUniqueInputSchema, 
}).strict();

export const NotificationUpdateArgsSchema: z.ZodType<Prisma.NotificationUpdateArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  include: NotificationIncludeSchema.optional(),
  data: z.union([ NotificationUpdateInputSchema, NotificationUncheckedUpdateInputSchema ]),
  where: NotificationWhereUniqueInputSchema, 
}).strict();

export const NotificationUpdateManyArgsSchema: z.ZodType<Prisma.NotificationUpdateManyArgs> = z.object({
  data: z.union([ NotificationUpdateManyMutationInputSchema, NotificationUncheckedUpdateManyInputSchema ]),
  where: NotificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ NotificationUpdateManyMutationInputSchema, NotificationUncheckedUpdateManyInputSchema ]),
  where: NotificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export const NotificationDeleteManyArgsSchema: z.ZodType<Prisma.NotificationDeleteManyArgs> = z.object({
  where: NotificationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();