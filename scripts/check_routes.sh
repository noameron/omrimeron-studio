#!/usr/bin/env bash
# Validate old-URL compatibility (FR-008 / SC-004) against a running server.
# Usage: scripts/check_routes.sh [base-url]   (default http://localhost:3000)
set -u
BASE="${1:-http://localhost:3000}"
fail=0

check() { # path expected-final-code (follows redirects)
  code=$(curl -s -o /dev/null -w '%{http_code}' -L "$BASE$1")
  if [ "$code" = "$2" ]; then
    echo "ok   $1 -> $code"
  else
    echo "FAIL $1 -> $code (want $2)"
    fail=1
  fi
}

check "/" 200
check "/home/" 200 # redirects to /
for p in about-the-studio packshots jewlery people architecture wine-more food life-style holiday-cards contact our-clients; do
  check "/$p/" 200 # old WP trailing-slash URLs
done
# Industry: URL-encoded Hebrew slug as old links have it
check "/%D7%A6%D7%99%D7%9C%D7%95%D7%9D-%D7%AA%D7%A2%D7%A9%D7%99%D7%94-%D7%A2%D7%9E%D7%A8%D7%99-%D7%9E%D7%99%D7%A8%D7%95%D7%9F/" 200
# out-of-scope drafts must 404
for p in home-page-with-video new-home-page photography-of-art-works; do
  check "/$p" 404
done

exit $fail
