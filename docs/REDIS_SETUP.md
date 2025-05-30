# Redis Setup Guide for Uniqverse

## Implementation Status ✅

The Redis implementation is **COMPLETE** and **WORKING**:
- ✅ Universal Redis client supporting both local Docker and Upstash
- ✅ Memory cache fallback for development
- ✅ Comprehensive cache management with invalidation patterns
- ✅ Production-ready with Upstash Redis REST API
- ✅ Local development with Docker container
- ✅ Cache utilities for all major data operations

### Current Configuration
- **Local Development**: Docker Redis container (redis:7.2-alpine)
- **Production**: Upstash Redis REST API
- **Fallback**: In-memory cache for development resilience
- **Health Checks**: Container health monitoring enabled

## Verification Steps

### 1. Check Redis Service Status
```bash
# Check if Redis container is running
docker ps

# Should show: uniqverse-redis (healthy)
```

### 2. Test Redis Connection
```bash
# Test Redis directly
docker exec -it uniqverse-redis redis-cli ping
# Should return: PONG
```

### 3. Verify Application Integration
- Start the development server: `npm run dev`
- Look for: `🌐 Using Upstash Redis REST API` in console
- Cache operations should work seamlessly

## Local Development (Docker)

### Quick Start
```bash
# Start Redis container
docker-compose up -d redis

# Check Redis status
docker-compose ps

# View Redis logs
docker-compose logs redis

# Connect to Redis CLI
docker exec -it uniqverse-redis redis-cli

# Stop Redis
docker-compose down
```

### Test Redis Connection
```bash
# In Redis CLI
ping
# Should return: PONG

# Set a test value
set test "hello"
get test
# Should return: "hello"
```

## Production Setup (Upstash)

### 1. Create Upstash Account
- Go to [upstash.com](https://upstash.com)
- Sign up with GitHub/Google
- Create a new Redis database

### 2. Get Connection Details
- Copy the Redis URL from Upstash dashboard
- Format: `rediss://[username]:[password]@[endpoint]:[port]/[db]`

### 3. Update Environment Variables
```env
# For local development
REDIS_URL="redis://localhost:6379"

# For production (replace with your Upstash URL)
REDIS_URL="rediss://your-username:your-password@your-endpoint.upstash.io:6380/0"
```

## Environment Configuration

### Development (.env.local)
```env
# Required for local Docker Redis
REDIS_URL="redis://localhost:6379"

# Optional: For Upstash testing in development
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

### Production (.env.production)
```env
# Primary: Upstash Redis REST API (recommended)
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Alternative: Traditional Redis URL
REDIS_URL="rediss://your-upstash-url"
```

## Troubleshooting

### Connection Issues
1. **ECONNREFUSED**: Make sure Redis container is running
2. **Timeout**: Check Redis container health
3. **Auth errors**: Verify Upstash credentials

### Useful Commands
```bash
# Restart Redis container
docker-compose restart redis

# View all containers
docker ps

# Clean up Redis data
docker-compose down -v
```

## Features Implemented

### Cache Management
- Product caching with automatic invalidation
- User session and cart caching
- Search result caching
- Category and blog post caching
- Admin dashboard data caching

### Cache Patterns
- **Get/Set**: Basic key-value operations
- **Pattern Invalidation**: Bulk cache clearing by patterns
- **TTL Management**: Automatic expiration handling
- **Memory Fallback**: Graceful degradation

### Cache Keys
- Structured key naming convention
- Organized by data type and scope
- Pattern-based invalidation support
