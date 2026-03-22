#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATE_DIR="${SKILL_DIR}/assets/foundry"

TARGET=""
NAME=""
SYMBOL=""
BASE_URI=""
CONTRACT_URI=""
MAX_SUPPLY="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --name)
      NAME="$2"
      shift 2
      ;;
    --symbol)
      SYMBOL="$2"
      shift 2
      ;;
    --base-uri)
      BASE_URI="$2"
      shift 2
      ;;
    --contract-uri)
      CONTRACT_URI="$2"
      shift 2
      ;;
    --max-supply)
      MAX_SUPPLY="$2"
      shift 2
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "${TARGET}" || -z "${NAME}" || -z "${SYMBOL}" || -z "${BASE_URI}" || -z "${CONTRACT_URI}" ]]; then
  cat <<'EOF' >&2
Usage:
  bash scripts/bootstrap_foundry_collection.sh \
    --target /absolute/path/project \
    --name "My Collection" \
    --symbol MYC \
    --base-uri "ipfs://CID/" \
    --contract-uri "ipfs://CID/contract.json" \
    --max-supply 1000
EOF
  exit 1
fi

if ! command -v forge >/dev/null 2>&1; then
  echo "forge is required but was not found in PATH" >&2
  exit 1
fi

mkdir -p "${TARGET}"
cp -R "${TEMPLATE_DIR}/." "${TARGET}/"

pushd "${TARGET}" >/dev/null

if [[ ! -d ".git" ]]; then
  git init -q
fi

forge install OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std --no-commit

cp .env.example .env
BOOTSTRAP_NAME="${NAME}" \
BOOTSTRAP_SYMBOL="${SYMBOL}" \
BOOTSTRAP_BASE_URI="${BASE_URI}" \
BOOTSTRAP_CONTRACT_URI="${CONTRACT_URI}" \
BOOTSTRAP_MAX_SUPPLY="${MAX_SUPPLY}" \
python3 - <<'PY'
import os
from pathlib import Path

env_path = Path(".env")
data = env_path.read_text()
replacements = {
    "NFT_NAME=OpenSea Collection": f"NFT_NAME={os.environ['BOOTSTRAP_NAME']}",
    "NFT_SYMBOL=OSC": f"NFT_SYMBOL={os.environ['BOOTSTRAP_SYMBOL']}",
    "NFT_BASE_URI=ipfs://CID/": f"NFT_BASE_URI={os.environ['BOOTSTRAP_BASE_URI']}",
    "NFT_CONTRACT_URI=ipfs://CID/contract.json": f"NFT_CONTRACT_URI={os.environ['BOOTSTRAP_CONTRACT_URI']}",
    "NFT_MAX_SUPPLY=1000": f"NFT_MAX_SUPPLY={os.environ['BOOTSTRAP_MAX_SUPPLY']}",
}
for old, new in replacements.items():
    data = data.replace(old, new)
env_path.write_text(data)
PY

popd >/dev/null

echo "Bootstrapped OpenSea collection project at ${TARGET}"
echo "Next steps:"
echo "  1. cd ${TARGET}"
echo "  2. Edit .env with RPC_URL and PRIVATE_KEY"
echo "     Optional: add NFT_OWNER=0x... if the owner should differ from the deployer"
echo "  3. source .env"
echo "  4. forge script script/DeployOpenSeaCollection.s.sol:DeployOpenSeaCollection --rpc-url \"\$RPC_URL\" --broadcast"
