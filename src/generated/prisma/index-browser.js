
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  emailVerified: 'emailVerified',
  password: 'password',
  image: 'image',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  price: 'price',
  compareAtPrice: 'compareAtPrice',
  costPrice: 'costPrice',
  sku: 'sku',
  barcode: 'barcode',
  inventory: 'inventory',
  weight: 'weight',
  dimensions: 'dimensions',
  categoryId: 'categoryId',
  tags: 'tags',
  brand: 'brand',
  isPublished: 'isPublished',
  isFeatured: 'isFeatured',
  featuredOrder: 'featuredOrder',
  isDeleted: 'isDeleted',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  supplierUrl: 'supplierUrl',
  supplierProductId: 'supplierProductId',
  supplierSource: 'supplierSource',
  shippingTime: 'shippingTime',
  profitMargin: 'profitMargin',
  supplierId: 'supplierId',
  lowStockThreshold: 'lowStockThreshold',
  variantTypes: 'variantTypes'
};

exports.Prisma.ProductImageScalarFieldEnum = {
  id: 'id',
  url: 'url',
  alt: 'alt',
  position: 'position',
  productId: 'productId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductVariantScalarFieldEnum = {
  id: 'id',
  name: 'name',
  price: 'price',
  compareAtPrice: 'compareAtPrice',
  costPrice: 'costPrice',
  sku: 'sku',
  inventory: 'inventory',
  image: 'image',
  productId: 'productId',
  type: 'type',
  options: 'options',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  image: 'image',
  parentId: 'parentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupplierScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  website: 'website',
  apiKey: 'apiKey',
  apiEndpoint: 'apiEndpoint',
  contactEmail: 'contactEmail',
  contactPhone: 'contactPhone',
  averageShipping: 'averageShipping',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  orderNumber: 'orderNumber',
  status: 'status',
  subtotal: 'subtotal',
  tax: 'tax',
  shipping: 'shipping',
  total: 'total',
  discount: 'discount',
  discountCode: 'discountCode',
  notes: 'notes',
  userId: 'userId',
  shippingAddressId: 'shippingAddressId',
  paymentMethod: 'paymentMethod',
  paymentStatus: 'paymentStatus',
  paymentIntentId: 'paymentIntentId',
  trackingNumber: 'trackingNumber',
  trackingUrl: 'trackingUrl',
  fulfillmentStatus: 'fulfillmentStatus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  paidAt: 'paidAt',
  cancelledAt: 'cancelledAt'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  quantity: 'quantity',
  price: 'price',
  total: 'total',
  productId: 'productId',
  variantId: 'variantId',
  orderId: 'orderId',
  supplierOrderId: 'supplierOrderId',
  supplierOrderStatus: 'supplierOrderStatus',
  supplierTrackingNumber: 'supplierTrackingNumber',
  supplierTrackingUrl: 'supplierTrackingUrl',
  profitAmount: 'profitAmount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AddressScalarFieldEnum = {
  id: 'id',
  type: 'type',
  firstName: 'firstName',
  lastName: 'lastName',
  company: 'company',
  address1: 'address1',
  address2: 'address2',
  city: 'city',
  state: 'state',
  postalCode: 'postalCode',
  country: 'country',
  phone: 'phone',
  isDefault: 'isDefault',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  rating: 'rating',
  title: 'title',
  content: 'content',
  productId: 'productId',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  adminResponse: 'adminResponse',
  adminResponseDate: 'adminResponseDate',
  helpfulVotes: 'helpfulVotes',
  isVerified: 'isVerified',
  status: 'status',
  images: 'images'
};

exports.Prisma.AdminAuditLogScalarFieldEnum = {
  id: 'id',
  action: 'action',
  details: 'details',
  performedById: 'performedById',
  createdAt: 'createdAt'
};

exports.Prisma.BlogCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BlogPostScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  excerpt: 'excerpt',
  content: 'content',
  coverImage: 'coverImage',
  isPublished: 'isPublished',
  publishedAt: 'publishedAt',
  authorId: 'authorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  metaTitle: 'metaTitle',
  metaDesc: 'metaDesc',
  tags: 'tags',
  isAdEnabled: 'isAdEnabled',
  externalLinks: 'externalLinks'
};

exports.Prisma.CartScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CartItemScalarFieldEnum = {
  id: 'id',
  cartId: 'cartId',
  productId: 'productId',
  variantId: 'variantId',
  quantity: 'quantity',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HomepageSectionScalarFieldEnum = {
  id: 'id',
  title: 'title',
  subtitle: 'subtitle',
  content: 'content',
  type: 'type',
  position: 'position',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryHistoryScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  variantId: 'variantId',
  previousValue: 'previousValue',
  newValue: 'newValue',
  action: 'action',
  notes: 'notes',
  userId: 'userId',
  timestamp: 'timestamp'
};

exports.Prisma.InventorySettingsScalarFieldEnum = {
  id: 'id',
  defaultLowStockThreshold: 'defaultLowStockThreshold',
  autoHideOutOfStock: 'autoHideOutOfStock',
  notifyOnLowStock: 'notifyOnLowStock',
  notifyOnOutOfStock: 'notifyOnOutOfStock',
  autoSendRestockEmails: 'autoSendRestockEmails',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  updatedBy: 'updatedBy'
};

exports.Prisma.MediaScalarFieldEnum = {
  id: 'id',
  filename: 'filename',
  originalFilename: 'originalFilename',
  url: 'url',
  filesize: 'filesize',
  mimetype: 'mimetype',
  width: 'width',
  height: 'height',
  alt: 'alt',
  caption: 'caption',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PageScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  content: 'content',
  description: 'description',
  metaTitle: 'metaTitle',
  metaDesc: 'metaDesc',
  isPublished: 'isPublished',
  layout: 'layout',
  settings: 'settings',
  authorId: 'authorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PageMetricScalarFieldEnum = {
  id: 'id',
  page: 'page',
  score: 'score',
  lcp: 'lcp',
  fid: 'fid',
  cls: 'cls',
  ttfb: 'ttfb',
  fcp: 'fcp',
  deviceType: 'deviceType',
  navStart: 'navStart',
  loadTime: 'loadTime',
  domContentLoaded: 'domContentLoaded',
  domInteractive: 'domInteractive',
  resourceLoadTime: 'resourceLoadTime',
  jsCount: 'jsCount',
  cssCount: 'cssCount',
  imageCount: 'imageCount',
  fontCount: 'fontCount',
  otherCount: 'otherCount',
  totalSize: 'totalSize',
  createdAt: 'createdAt'
};

exports.Prisma.PageSectionScalarFieldEnum = {
  id: 'id',
  pageId: 'pageId',
  title: 'title',
  content: 'content',
  type: 'type',
  position: 'position',
  settings: 'settings',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PerformanceMetricScalarFieldEnum = {
  id: 'id',
  metricName: 'metricName',
  metricValue: 'metricValue',
  metricUnit: 'metricUnit',
  page: 'page',
  deviceType: 'deviceType',
  browserId: 'browserId',
  userAgent: 'userAgent',
  connectionType: 'connectionType',
  userCountry: 'userCountry',
  metricCategory: 'metricCategory',
  customProps: 'customProps',
  createdAt: 'createdAt',
  pathname: 'pathname'
};

exports.Prisma.PricingRuleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  priority: 'priority',
  isActive: 'isActive',
  conditions: 'conditions',
  supplierId: 'supplierId',
  categoryId: 'categoryId',
  minPrice: 'minPrice',
  maxPrice: 'maxPrice',
  profitMargin: 'profitMargin',
  profitAmount: 'profitAmount',
  markupPercentage: 'markupPercentage',
  roundToNearest: 'roundToNearest',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResourceMetricScalarFieldEnum = {
  id: 'id',
  page: 'page',
  resourceUrl: 'resourceUrl',
  initiatorType: 'initiatorType',
  duration: 'duration',
  transferSize: 'transferSize',
  deviceType: 'deviceType',
  createdAt: 'createdAt'
};

exports.Prisma.SiteSettingsScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupplierOrderScalarFieldEnum = {
  id: 'id',
  externalOrderId: 'externalOrderId',
  supplierId: 'supplierId',
  status: 'status',
  orderDate: 'orderDate',
  totalCost: 'totalCost',
  shippingCost: 'shippingCost',
  currency: 'currency',
  trackingNumber: 'trackingNumber',
  trackingUrl: 'trackingUrl',
  carrier: 'carrier',
  estimatedDelivery: 'estimatedDelivery',
  notes: 'notes',
  errorMessage: 'errorMessage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserSecuritySettingsScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  securityNotifications: 'securityNotifications',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatbotPatternScalarFieldEnum = {
  id: 'id',
  priority: 'priority',
  response: 'response',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy'
};

exports.Prisma.ChatbotTriggerScalarFieldEnum = {
  id: 'id',
  phrase: 'phrase',
  patternId: 'patternId'
};

exports.Prisma.ChatbotFallbackScalarFieldEnum = {
  id: 'id',
  response: 'response',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupportTicketScalarFieldEnum = {
  id: 'id',
  subject: 'subject',
  description: 'description',
  status: 'status',
  priority: 'priority',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TicketReplyScalarFieldEnum = {
  id: 'id',
  content: 'content',
  isAdminReply: 'isAdminReply',
  ticketId: 'ticketId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.TicketAttachmentScalarFieldEnum = {
  id: 'id',
  filename: 'filename',
  url: 'url',
  mimeType: 'mimeType',
  ticketId: 'ticketId',
  createdAt: 'createdAt'
};

exports.Prisma.PromotionScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  type: 'type',
  imageUrl: 'imageUrl',
  videoUrl: 'videoUrl',
  linkUrl: 'linkUrl',
  position: 'position',
  startDate: 'startDate',
  endDate: 'endDate',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EventScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  imageUrl: 'imageUrl',
  videoUrl: 'videoUrl',
  contentType: 'contentType',
  textOverlay: 'textOverlay',
  textPosition: 'textPosition',
  textColor: 'textColor',
  textSize: 'textSize',
  textShadow: 'textShadow',
  backgroundColor: 'backgroundColor',
  opacity: 'opacity',
  effectType: 'effectType',
  linkUrl: 'linkUrl',
  startDate: 'startDate',
  endDate: 'endDate',
  isActive: 'isActive',
  position: 'position',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CouponScalarFieldEnum = {
  id: 'id',
  code: 'code',
  description: 'description',
  discountType: 'discountType',
  discountValue: 'discountValue',
  minimumPurchase: 'minimumPurchase',
  maximumDiscount: 'maximumDiscount',
  usageLimit: 'usageLimit',
  usageCount: 'usageCount',
  isActive: 'isActive',
  startDate: 'startDate',
  endDate: 'endDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CouponUsageScalarFieldEnum = {
  id: 'id',
  couponId: 'couponId',
  userId: 'userId',
  orderId: 'orderId',
  discountAmount: 'discountAmount',
  usedAt: 'usedAt'
};

exports.Prisma.DropshippingSettingsScalarFieldEnum = {
  id: 'id',
  autoProcess: 'autoProcess',
  autoSendOrders: 'autoSendOrders',
  statusCheckInterval: 'statusCheckInterval',
  defaultShippingDays: 'defaultShippingDays',
  notificationEmail: 'notificationEmail',
  profitMargin: 'profitMargin',
  automaticFulfillment: 'automaticFulfillment',
  notifyCustomerOnShipment: 'notifyCustomerOnShipment',
  defaultSupplier: 'defaultSupplier',
  supplierNotes: 'supplierNotes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NewsletterSubscriptionScalarFieldEnum = {
  id: 'id',
  email: 'email',
  status: 'status',
  subscribedAt: 'subscribedAt',
  unsubscribedAt: 'unsubscribedAt',
  unsubscribeToken: 'unsubscribeToken',
  preferences: 'preferences',
  source: 'source',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  ADMIN: 'ADMIN',
  VENDOR: 'VENDOR',
  CUSTOMER: 'CUSTOMER'
};

exports.SupplierStatus = exports.$Enums.SupplierStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  ON_HOLD: 'ON_HOLD',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  CANCELLED: 'CANCELLED'
};

exports.FulfillmentStatus = exports.$Enums.FulfillmentStatus = {
  UNFULFILLED: 'UNFULFILLED',
  PARTIALLY_FULFILLED: 'PARTIALLY_FULFILLED',
  FULFILLED: 'FULFILLED',
  RETURNED: 'RETURNED',
  RESTOCKED: 'RESTOCKED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED'
};

exports.AddressType = exports.$Enums.AddressType = {
  SHIPPING: 'SHIPPING',
  BILLING: 'BILLING'
};

exports.ReviewStatus = exports.$Enums.ReviewStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.PageLayout = exports.$Enums.PageLayout = {
  STANDARD: 'STANDARD',
  FULL_WIDTH: 'FULL_WIDTH',
  LANDING: 'LANDING',
  CUSTOM: 'CUSTOM'
};

exports.DeviceType = exports.$Enums.DeviceType = {
  DESKTOP: 'DESKTOP',
  MOBILE: 'MOBILE',
  TABLET: 'TABLET'
};

exports.MetricCategory = exports.$Enums.MetricCategory = {
  WEB_VITAL: 'WEB_VITAL',
  CUSTOM: 'CUSTOM',
  RESOURCE: 'RESOURCE',
  API: 'API',
  ERROR: 'ERROR'
};

exports.TicketStatus = exports.$Enums.TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_CUSTOMER: 'AWAITING_CUSTOMER',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

exports.TicketPriority = exports.$Enums.TicketPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

exports.PromotionType = exports.$Enums.PromotionType = {
  BANNER: 'BANNER',
  POPUP: 'POPUP',
  SLIDER: 'SLIDER'
};

exports.DiscountType = exports.$Enums.DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT'
};

exports.NewsletterStatus = exports.$Enums.NewsletterStatus = {
  ACTIVE: 'ACTIVE',
  UNSUBSCRIBED: 'UNSUBSCRIBED',
  BOUNCED: 'BOUNCED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  Product: 'Product',
  ProductImage: 'ProductImage',
  ProductVariant: 'ProductVariant',
  Category: 'Category',
  Supplier: 'Supplier',
  Order: 'Order',
  OrderItem: 'OrderItem',
  Address: 'Address',
  Review: 'Review',
  AdminAuditLog: 'AdminAuditLog',
  BlogCategory: 'BlogCategory',
  BlogPost: 'BlogPost',
  Cart: 'Cart',
  CartItem: 'CartItem',
  HomepageSection: 'HomepageSection',
  InventoryHistory: 'InventoryHistory',
  InventorySettings: 'InventorySettings',
  Media: 'Media',
  Page: 'Page',
  PageMetric: 'PageMetric',
  PageSection: 'PageSection',
  PerformanceMetric: 'PerformanceMetric',
  PricingRule: 'PricingRule',
  ResourceMetric: 'ResourceMetric',
  SiteSettings: 'SiteSettings',
  SupplierOrder: 'SupplierOrder',
  UserSecuritySettings: 'UserSecuritySettings',
  ChatbotPattern: 'ChatbotPattern',
  ChatbotTrigger: 'ChatbotTrigger',
  ChatbotFallback: 'ChatbotFallback',
  SupportTicket: 'SupportTicket',
  TicketReply: 'TicketReply',
  TicketAttachment: 'TicketAttachment',
  Promotion: 'Promotion',
  Event: 'Event',
  Coupon: 'Coupon',
  CouponUsage: 'CouponUsage',
  DropshippingSettings: 'DropshippingSettings',
  NewsletterSubscription: 'NewsletterSubscription'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
