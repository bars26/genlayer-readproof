"""Shared helpers for the direct-mode tests."""

import json
import os

BRADBURY = os.environ.get("READPROOF_NETWORK") == "bradbury"
if BRADBURY:
    os.environ.setdefault("GENVM_VERSION", "v0.6.0-rc10")

CONTRACT_PATH = "contracts/read_proof.bradbury.py" if BRADBURY else "contracts/read_proof.py"


def llm_json(obj):
    """An LLM mock answering JSON (bytes on the Bradbury harness, which otherwise turns string mocks into dicts)."""
    text = json.dumps(obj)
    return text.encode() if BRADBURY else text


def to_hex(addr_bytes):
    """Checksummed hex of an address, as Address.as_hex returns it."""
    if hasattr(addr_bytes, "as_hex"):
        return addr_bytes.as_hex
    try:
        from genlayer.types import Address
    except ImportError:
        from genlayer.py.types import Address
    return Address(addr_bytes).as_hex
