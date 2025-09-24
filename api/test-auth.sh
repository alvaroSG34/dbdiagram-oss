#!/bin/bash

# Test script for dbdiagram-oss Authentication API
# Requires: curl, jq (optional for pretty JSON)

BASE_URL="http://localhost:3002/api"

echo "🧪 Testing dbdiagram-oss Authentication API"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "\n${YELLOW}🔍 Test 1: Health Check${NC}"
curl -s -X GET "$BASE_URL/health" | jq . || curl -s -X GET "$BASE_URL/health"

# Test 2: Register User
echo -e "\n${YELLOW}📝 Test 2: Register User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@dbdiagram.com",
    "password": "password123",
    "confirmPassword": "password123"
  }')

echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"

# Extract token from registration
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")

if [ "$TOKEN" != "" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Registration successful${NC}"
    echo "Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}❌ Registration failed${NC}"
fi

# Test 3: Login
echo -e "\n${YELLOW}🔑 Test 3: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dbdiagram.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token from login if registration failed
if [ "$TOKEN" == "" ] || [ "$TOKEN" == "null" ]; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")
fi

# Test 4: Get Profile (Protected Route)
if [ "$TOKEN" != "" ] && [ "$TOKEN" != "null" ]; then
    echo -e "\n${YELLOW}👤 Test 4: Get Profile (Protected)${NC}"
    curl -s -X GET "$BASE_URL/auth/profile" \
      -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null || \
    curl -s -X GET "$BASE_URL/auth/profile" \
      -H "Authorization: Bearer $TOKEN"

    # Test 5: Verify Token
    echo -e "\n${YELLOW}✅ Test 5: Verify Token${NC}"
    curl -s -X POST "$BASE_URL/auth/verify" \
      -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null || \
    curl -s -X POST "$BASE_URL/auth/verify" \
      -H "Authorization: Bearer $TOKEN"
else
    echo -e "\n${RED}❌ No token available, skipping protected routes${NC}"
fi

# Test 6: Invalid Login
echo -e "\n${YELLOW}🚫 Test 6: Invalid Login${NC}"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@example.com",
    "password": "wrongpassword"
  }' | jq . 2>/dev/null || \
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid@example.com",
    "password": "wrongpassword"
  }'

# Test 7: Duplicate Registration
echo -e "\n${YELLOW}🔄 Test 7: Duplicate Registration${NC}"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@dbdiagram.com",
    "password": "password123"
  }' | jq . 2>/dev/null || \
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@dbdiagram.com",
    "password": "password123"
  }'

echo -e "\n${GREEN}🏁 Testing completed!${NC}"
echo "Check the responses above to verify all endpoints are working correctly."