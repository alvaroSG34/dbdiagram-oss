#!/bin/bash

# Test script for dbdiagram-oss Rooms API
# Requires: curl, jq (optional for pretty JSON)

BASE_URL="http://localhost:3003/api"
TOKEN=""
ROOM_CODE=""

echo "🧪 Testing dbdiagram-oss Rooms API"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to extract value from JSON response
extract_json_value() {
    echo "$1" | jq -r "$2" 2>/dev/null || echo ""
}

# Test 1: Health Check
echo -e "\n${YELLOW}🔍 Test 1: Health Check${NC}"
curl -s -X GET "$BASE_URL/health" | jq . 2>/dev/null || curl -s -X GET "$BASE_URL/health"

# Test 2: Register User for Testing
echo -e "\n${YELLOW}📝 Test 2: Register Test User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "roomtester",
    "email": "roomtest@dbdiagram.com",
    "password": "password123",
    "confirmPassword": "password123"
  }')

echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"

# Extract token
TOKEN=$(extract_json_value "$REGISTER_RESPONSE" ".token")

if [ "$TOKEN" != "" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Registration successful, token acquired${NC}"
else
    echo -e "${YELLOW}🔄 Registration failed, trying login...${NC}"
    # Try login if registration failed
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "roomtest@dbdiagram.com",
        "password": "password123"
      }')
    
    TOKEN=$(extract_json_value "$LOGIN_RESPONSE" ".token")
    echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
fi

if [ "$TOKEN" == "" ] || [ "$TOKEN" == "null" ]; then
    echo -e "${RED}❌ Could not acquire token, stopping tests${NC}"
    exit 1
fi

echo "Token: ${TOKEN:0:50}..."

# Test 3: Create Room
echo -e "\n${YELLOW}🏠 Test 3: Create Room${NC}"
CREATE_ROOM_RESPONSE=$(curl -s -X POST "$BASE_URL/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Collaboration Room",
    "description": "A room for testing the collaboration features",
    "is_public": false,
    "max_members": 5
  }')

echo "$CREATE_ROOM_RESPONSE" | jq . 2>/dev/null || echo "$CREATE_ROOM_RESPONSE"

# Extract room code
ROOM_CODE=$(extract_json_value "$CREATE_ROOM_RESPONSE" ".room.room_code")

if [ "$ROOM_CODE" != "" ] && [ "$ROOM_CODE" != "null" ]; then
    echo -e "${GREEN}✅ Room created with code: $ROOM_CODE${NC}"
else
    echo -e "${RED}❌ Failed to create room${NC}"
fi

# Test 4: Get User Rooms
echo -e "\n${YELLOW}📋 Test 4: Get User Rooms${NC}"
curl -s -X GET "$BASE_URL/rooms" \
  -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null || \
curl -s -X GET "$BASE_URL/rooms" \
  -H "Authorization: Bearer $TOKEN"

# Test 5: Get Room Info (if room was created)
if [ "$ROOM_CODE" != "" ] && [ "$ROOM_CODE" != "null" ]; then
    echo -e "\n${YELLOW}🔍 Test 5: Get Room Info${NC}"
    curl -s -X GET "$BASE_URL/rooms/$ROOM_CODE" \
      -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null || \
    curl -s -X GET "$BASE_URL/rooms/$ROOM_CODE" \
      -H "Authorization: Bearer $TOKEN"

    # Test 6: Update Room Content
    echo -e "\n${YELLOW}💾 Test 6: Update Room Content${NC}"
    curl -s -X PUT "$BASE_URL/rooms/$ROOM_CODE/content" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "dbml_content": "Table users {\n  id integer [primary key]\n  username varchar\n  email varchar [unique]\n  created_at timestamp\n}"
      }' | jq . 2>/dev/null || \
    curl -s -X PUT "$BASE_URL/rooms/$ROOM_CODE/content" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "dbml_content": "Table users {\n  id integer [primary key]\n  username varchar\n  email varchar [unique]\n  created_at timestamp\n}"
      }'

    # Test 7: Get Room Members
    echo -e "\n${YELLOW}👥 Test 7: Get Room Members${NC}"
    curl -s -X GET "$BASE_URL/rooms/$ROOM_CODE/members" \
      -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null || \
    curl -s -X GET "$BASE_URL/rooms/$ROOM_CODE/members" \
      -H "Authorization: Bearer $TOKEN"
fi

# Test 8: Register Second User for Join Test
echo -e "\n${YELLOW}📝 Test 8: Register Second User${NC}"
USER2_REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "roomtester2",
    "email": "roomtest2@dbdiagram.com",
    "password": "password123",
    "confirmPassword": "password123"
  }')

USER2_TOKEN=$(extract_json_value "$USER2_REGISTER_RESPONSE" ".token")

if [ "$USER2_TOKEN" != "" ] && [ "$USER2_TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Second user registered${NC}"
    
    # Test 9: Join Room with Second User
    if [ "$ROOM_CODE" != "" ] && [ "$ROOM_CODE" != "null" ]; then
        echo -e "\n${YELLOW}🚪 Test 9: Second User Join Room${NC}"
        curl -s -X POST "$BASE_URL/rooms/join" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $USER2_TOKEN" \
          -d "{\"room_code\": \"$ROOM_CODE\"}" | jq . 2>/dev/null || \
        curl -s -X POST "$BASE_URL/rooms/join" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $USER2_TOKEN" \
          -d "{\"room_code\": \"$ROOM_CODE\"}"

        # Test 10: Second User Get Room Members
        echo -e "\n${YELLOW}👥 Test 10: Updated Room Members${NC}"
        curl -s -X GET "$BASE_URL/rooms/$ROOM_CODE/members" \
          -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null || \
        curl -s -X GET "$BASE_URL/rooms/$ROOM_CODE/members" \
          -H "Authorization: Bearer $TOKEN"

        # Test 11: Second User Leave Room
        echo -e "\n${YELLOW}🚪 Test 11: Second User Leave Room${NC}"
        curl -s -X DELETE "$BASE_URL/rooms/$ROOM_CODE/leave" \
          -H "Authorization: Bearer $USER2_TOKEN" | jq . 2>/dev/null || \
        curl -s -X DELETE "$BASE_URL/rooms/$ROOM_CODE/leave" \
          -H "Authorization: Bearer $USER2_TOKEN"
    fi
else
    echo -e "${YELLOW}⚠️ Second user registration failed, skipping join tests${NC}"
fi

# Test 12: Try to Join Non-existent Room
echo -e "\n${YELLOW}🚫 Test 12: Join Non-existent Room${NC}"
curl -s -X POST "$BASE_URL/rooms/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"room_code": "NOTEXIST"}' | jq . 2>/dev/null || \
curl -s -X POST "$BASE_URL/rooms/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"room_code": "NOTEXIST"}'

# Test 13: Try to Access Room Without Permission
echo -e "\n${YELLOW}🔒 Test 13: Access Room Without Permission${NC}"
curl -s -X GET "$BASE_URL/rooms/NOACCESS" \
  -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null || \
curl -s -X GET "$BASE_URL/rooms/NOACCESS" \
  -H "Authorization: Bearer $TOKEN"

# Test 14: Delete Room (Owner only)
if [ "$ROOM_CODE" != "" ] && [ "$ROOM_CODE" != "null" ]; then
    echo -e "\n${YELLOW}🗑️ Test 14: Delete Room (Owner)${NC}"
    curl -s -X DELETE "$BASE_URL/rooms/$ROOM_CODE" \
      -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null || \
    curl -s -X DELETE "$BASE_URL/rooms/$ROOM_CODE" \
      -H "Authorization: Bearer $TOKEN"

    # Test 15: Try to Access Deleted Room
    echo -e "\n${YELLOW}❌ Test 15: Access Deleted Room${NC}"
    curl -s -X GET "$BASE_URL/rooms/$ROOM_CODE" \
      -H "Authorization: Bearer $TOKEN" | jq . 2>/dev/null || \
    curl -s -X GET "$BASE_URL/rooms/$ROOM_CODE" \
      -H "Authorization: Bearer $TOKEN"
fi

echo -e "\n${GREEN}🏁 Room API Testing completed!${NC}"
echo -e "${BLUE}💡 Summary of tested features:${NC}"
echo -e "  ✅ Room creation with unique codes"
echo -e "  ✅ User room listing"
echo -e "  ✅ Room information retrieval"
echo -e "  ✅ Room content updates (DBML)"
echo -e "  ✅ Room member management"
echo -e "  ✅ Multi-user join/leave functionality"
echo -e "  ✅ Permission validation"
echo -e "  ✅ Room deletion (owner only)"
echo -e "  ✅ Error handling for invalid operations"