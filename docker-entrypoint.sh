#!/bin/sh
set -eu

npx prisma db push
exec npm run start