-- CreateTable
CREATE TABLE "ChatbotConversation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "satisfactionRating" INTEGER,
    "wasEscalated" BOOLEAN NOT NULL DEFAULT false,
    "wasResolved" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],

    CONSTRAINT "ChatbotConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patternMatched" TEXT,
    "confidence" DOUBLE PRECISION,
    "processingTime" INTEGER,
    "wasHelpful" BOOLEAN,
    "context" JSONB,

    CONSTRAINT "ChatbotMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotFeedback" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "feedbackType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotLearning" (
    "id" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL,
    "expectedResponse" TEXT,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastOccurred" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedBy" TEXT,

    CONSTRAINT "ChatbotLearning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "avgSatisfaction" DOUBLE PRECISION,
    "escalationRate" DOUBLE PRECISION,
    "resolutionRate" DOUBLE PRECISION,
    "avgResponseTime" DOUBLE PRECISION,
    "topTopics" JSONB,
    "unmatchedQueries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteContext" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT[],
    "category" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WebsiteContext_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatbotConversation_sessionId_idx" ON "ChatbotConversation"("sessionId");

-- CreateIndex
CREATE INDEX "ChatbotConversation_userId_idx" ON "ChatbotConversation"("userId");

-- CreateIndex
CREATE INDEX "ChatbotConversation_startedAt_idx" ON "ChatbotConversation"("startedAt");

-- CreateIndex
CREATE INDEX "ChatbotMessage_conversationId_idx" ON "ChatbotMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ChatbotMessage_timestamp_idx" ON "ChatbotMessage"("timestamp");

-- CreateIndex
CREATE INDEX "ChatbotFeedback_conversationId_idx" ON "ChatbotFeedback"("conversationId");

-- CreateIndex
CREATE INDEX "ChatbotFeedback_createdAt_idx" ON "ChatbotFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "ChatbotLearning_status_idx" ON "ChatbotLearning"("status");

-- CreateIndex
CREATE INDEX "ChatbotLearning_frequency_idx" ON "ChatbotLearning"("frequency");

-- CreateIndex
CREATE INDEX "ChatbotLearning_lastOccurred_idx" ON "ChatbotLearning"("lastOccurred");

-- CreateIndex
CREATE UNIQUE INDEX "ChatbotAnalytics_date_key" ON "ChatbotAnalytics"("date");

-- CreateIndex
CREATE INDEX "ChatbotAnalytics_date_idx" ON "ChatbotAnalytics"("date");

-- CreateIndex
CREATE INDEX "WebsiteContext_page_idx" ON "WebsiteContext"("page");

-- CreateIndex
CREATE INDEX "WebsiteContext_category_idx" ON "WebsiteContext"("category");

-- CreateIndex
CREATE INDEX "WebsiteContext_keywords_idx" ON "WebsiteContext"("keywords");

-- AddForeignKey
ALTER TABLE "ChatbotConversation" ADD CONSTRAINT "ChatbotConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotMessage" ADD CONSTRAINT "ChatbotMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatbotConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotFeedback" ADD CONSTRAINT "ChatbotFeedback_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatbotConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotLearning" ADD CONSTRAINT "ChatbotLearning_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
