#!/bin/bash
set -e

echo "Running tests..."

node tests/test-template.js
node tests/test-parse.js

echo ""
echo "All tests passed."
