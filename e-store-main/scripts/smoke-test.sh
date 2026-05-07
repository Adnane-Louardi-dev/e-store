#!/usr/bin/env bash
# End-to-end smoke test for everything built through Day 5.
# Requires: bash, curl, python (for JSON parsing), a built jar at target/.
# Usage: from project root, run  ./scripts/smoke-test.sh

set -u
BASE="http://localhost:8080"
JAR="target/estore-backend-0.0.1-SNAPSHOT.jar"
LOG="/tmp/estore-smoke.log"
FAIL=0
PASS=0

# Maven on Windows requires JAVA_HOME. If it's missing in this shell, derive it
# from `which java` so the test runs without manual env setup.
if [ -z "${JAVA_HOME:-}" ]; then
  JAVA_BIN=$(command -v java || true)
  if [ -n "$JAVA_BIN" ]; then
    JAVA_DIR=$(dirname "$(dirname "$JAVA_BIN")")
    export JAVA_HOME="$JAVA_DIR"
    echo "JAVA_HOME was unset; derived from java on PATH: $JAVA_HOME"
  else
    echo "ERROR: java not on PATH and JAVA_HOME unset. Install JDK 21 or run from a shell where 'java -version' works."
    exit 1
  fi
fi

j() { python -c "import json,sys; d=json.load(sys.stdin); $1"; }
ok()   { PASS=$((PASS+1)); echo "  PASS — $1"; }
fail() { FAIL=$((FAIL+1)); echo "  FAIL — $1"; }
expect_status() {
  local got="$1"; local want="$2"; local label="$3"
  if [ "$got" = "$want" ]; then ok "$label ($got)"; else fail "$label (got $got, want $want)"; fi
}

echo "=== Building jar ==="
mvn -q -DskipTests package || { echo "build failed"; exit 1; }

echo "=== Starting app ==="
rm -rf data
# Smoke test creates its own data and asserts exact counts; disable the seeder.
nohup java -Destore.seed-on-startup=false -jar "$JAR" > "$LOG" 2>&1 &
APP_PID=$!
trap 'kill $APP_PID 2>/dev/null; sleep 1' EXIT

for i in $(seq 1 90); do
  if grep -q "Started EstoreApplication" "$LOG" 2>/dev/null; then
    echo "  ready in ${i}s"; break
  fi
  if grep -qE "APPLICATION FAILED|loopback connection" "$LOG" 2>/dev/null; then
    echo "  startup failed:"; tail -20 "$LOG"; exit 1
  fi
  sleep 1
done

# ---------------------------------------------------------------- Day 2 (Auth)
echo
echo "=== Day 2 — Auth ==="

REG=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Adnane","lastName":"Louardi","email":"adnane@test.com","password":"password123"}')
REG_CODE=$(echo "$REG" | tail -1); REG_BODY=$(echo "$REG" | head -n -1)
expect_status "$REG_CODE" "201" "POST /api/auth/register"
TOKEN=$(echo "$REG_BODY" | j 'print(d["token"])')
USER_ID=$(echo "$REG_BODY" | j 'print(d["userId"])')
[ -n "$TOKEN" ] && ok "token issued" || fail "no token"

ME=$(curl -s -w "\n%{http_code}" "$BASE/api/users/me" -H "Authorization: Bearer $TOKEN")
expect_status "$(echo "$ME" | tail -1)" "200" "GET /api/users/me"

PROF=$(curl -s -w "\n%{http_code}" -X PUT "$BASE/api/users/me/profile" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"phone":"+212600000000","address":"Casa","city":"Casablanca","country":"Morocco"}')
expect_status "$(echo "$PROF" | tail -1)" "200" "PUT /api/users/me/profile"

NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/users/me")
expect_status "$NOAUTH" "401" "GET /api/users/me without token"

# Forbidden as USER
FORB=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/categories" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Books"}')
expect_status "$FORB" "403" "POST /api/categories as USER → forbidden"

# ----------------------------------- Promote to ADMIN via H2 Shell, re-login
echo
echo "=== Promoting user to ADMIN ==="
H2_JAR=$(find ~/.m2/repository/com/h2database/h2 -name 'h2-*.jar' | sort -V | tail -1)
java -cp "$H2_JAR" org.h2.tools.Shell \
  -url 'jdbc:h2:file:./data/estore;AUTO_SERVER=TRUE' -user sa -password '' \
  -sql "UPDATE users SET role='ADMIN' WHERE id=$USER_ID" 2>&1 | tail -2

LOGIN=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"adnane@test.com","password":"password123"}')
TOKEN=$(echo "$LOGIN" | j 'print(d["token"])')
ROLE=$(echo "$LOGIN" | j 'print(d["role"])')
[ "$ROLE" = "ADMIN" ] && ok "re-login as ADMIN" || fail "still $ROLE"

# ---------------------------------------------------------------- Day 3 (Catalog)
echo
echo "=== Day 3 — Catalog ==="

CAT=$(curl -s -X POST "$BASE/api/categories" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Books","description":"Books category"}')
CAT_ID=$(echo "$CAT" | j 'print(d["id"])')
[ -n "$CAT_ID" ] && ok "POST /api/categories ADMIN → id=$CAT_ID" || fail "category create"

DUP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/categories" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Books"}')
expect_status "$DUP" "422" "duplicate category → 422"

PROD=$(curl -s -X POST "$BASE/api/products" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Clean Code\",\"description\":\"Robert Martin\",\"price\":29.99,\"imageUrl\":null,\"categoryId\":$CAT_ID}")
PROD_ID=$(echo "$PROD" | j 'print(d["id"])')
INIT_STOCK=$(echo "$PROD" | j 'print(d["quantityInStock"])')
[ -n "$PROD_ID" ] && ok "POST /api/products → id=$PROD_ID" || fail "product create"
[ "$INIT_STOCK" = "0" ] && ok "auto-created inventory at 0" || fail "stock=$INIT_STOCK"

LIST=$(curl -s "$BASE/api/products?q=clean")
TOTAL=$(echo "$LIST" | j 'print(d["totalElements"])')
[ "$TOTAL" = "1" ] && ok "search q=clean returns 1" || fail "got $TOTAL"

# ---------------------------------------------------------------- Day 4 (Inventory)
echo
echo "=== Day 4 — Inventory ==="

SET=$(curl -s -X PUT "$BASE/api/inventory/product/$PROD_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"quantity":10}')
QTY=$(echo "$SET" | j 'print(d["quantity"])')
[ "$QTY" = "10" ] && ok "set stock to 10" || fail "stock=$QTY"

PROD2=$(curl -s "$BASE/api/products/$PROD_ID")
S2=$(echo "$PROD2" | j 'print(d["quantityInStock"])')
[ "$S2" = "10" ] && ok "ProductResponse reflects stock=10" || fail "got $S2"

# ---------------------------------------------------------------- Day 5 (Cart)
echo
echo "=== Day 5 — Cart ==="

EMPTY=$(curl -s "$BASE/api/cart" -H "Authorization: Bearer $TOKEN")
ECNT=$(echo "$EMPTY" | j 'print(d["itemCount"])')
[ "$ECNT" = "0" ] && ok "GET /api/cart auto-creates empty" || fail "itemCount=$ECNT"

ADD=$(curl -s -X POST "$BASE/api/cart/items" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"productId\":$PROD_ID,\"quantity\":3}")
ITEM_ID=$(echo "$ADD" | j 'print(d["items"][0]["id"])')
TOTAL_C=$(echo "$ADD" | j 'print(d["total"])')
[ -n "$ITEM_ID" ] && ok "added 3, item id=$ITEM_ID, total=$TOTAL_C" || fail "add failed"

OVER=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/cart/items" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"productId\":$PROD_ID,\"quantity\":99}")
expect_status "$OVER" "422" "exceeding stock → 422"

UPD=$(curl -s -X PUT "$BASE/api/cart/items/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"quantity":5}')
NEWQ=$(echo "$UPD" | j 'print(d["items"][0]["quantity"])')
[ "$NEWQ" = "5" ] && ok "updated qty to 5" || fail "qty=$NEWQ"

DEL=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/cart/items/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN")
expect_status "$DEL" "200" "DELETE cart item"

CLR=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/cart" \
  -H "Authorization: Bearer $TOKEN")
expect_status "$CLR" "200" "DELETE /api/cart"

# ---------------------------------------------------------------- Day 6 (Orders)
echo
echo "=== Day 6 — Orders ==="

EMPTY_ORDER=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/orders" \
  -H "Authorization: Bearer $TOKEN")
expect_status "$EMPTY_ORDER" "422" "POST /api/orders on empty cart → 422"

curl -s -X POST "$BASE/api/cart/items" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"productId\":$PROD_ID,\"quantity\":2}" > /dev/null

ORDER=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/orders" -H "Authorization: Bearer $TOKEN")
ORDER_CODE=$(echo "$ORDER" | tail -1); ORDER_BODY=$(echo "$ORDER" | head -n -1)
expect_status "$ORDER_CODE" "201" "POST /api/orders"
ORDER_ID=$(echo "$ORDER_BODY" | j 'print(d["id"])')
ORDER_STATUS=$(echo "$ORDER_BODY" | j 'print(d["status"])')
ORDER_TOTAL=$(echo "$ORDER_BODY" | j 'print(d["totalAmount"])')
[ "$ORDER_STATUS" = "CONFIRMED" ] && ok "status=CONFIRMED" || fail "status=$ORDER_STATUS"
[ "$ORDER_TOTAL" = "59.98" ] && ok "total=59.98 (2 x 29.99)" || fail "total=$ORDER_TOTAL"

POST_STOCK=$(curl -s "$BASE/api/products/$PROD_ID" | j 'print(d["quantityInStock"])')
[ "$POST_STOCK" = "8" ] && ok "stock decremented 10→8" || fail "stock=$POST_STOCK"

POST_CART=$(curl -s "$BASE/api/cart" -H "Authorization: Bearer $TOKEN" | j 'print(d["itemCount"])')
[ "$POST_CART" = "0" ] && ok "cart cleared after checkout" || fail "cart still has $POST_CART items"

HIST=$(curl -s "$BASE/api/orders/user/me" -H "Authorization: Bearer $TOKEN")
HIST_TOTAL=$(echo "$HIST" | j 'print(d["totalElements"])')
[ "$HIST_TOTAL" = "1" ] && ok "GET /api/orders/user/me returns 1 order" || fail "got $HIST_TOTAL"

ONE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/orders/$ORDER_ID" -H "Authorization: Bearer $TOKEN")
expect_status "$ONE" "200" "GET /api/orders/$ORDER_ID"

# ---------------------------------------------------------------- Result
echo
echo "================================="
echo "Total: PASS=$PASS  FAIL=$FAIL"
echo "================================="
[ $FAIL -eq 0 ]
